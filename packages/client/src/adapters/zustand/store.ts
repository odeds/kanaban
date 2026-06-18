import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Card, ColumnId, ServerMessage } from '@kanaban/shared';
import { COLUMN_IDS } from '@kanaban/shared';
import { wsTransport } from '@/lib/ws-transport';
import { api } from '@/lib/api';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { EMPTY_COLUMNS, generateUserId } from '@/adapters/constants';
import { reorderColumns } from '@/adapters/columnUtils';

interface State {
  cards: Record<string, Card>;
  columnCardIds: Record<ColumnId, string[]>;
  userIds: string[];
  status: 'connected' | 'disconnected' | 'reconnecting';
  userId: string;
}

interface Actions {
  applyServerMsg: (msg: ServerMessage) => void;
  createCard: (columnId: ColumnId, values: CardFormValues) => Promise<void>;
  updateCard: (cardId: string, values: CardFormValues) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, direction: 'left' | 'right') => Promise<void>;
  initTransport: () => () => void;
}

export const useZustandStore = create<State & Actions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────────
      cards: {},
      columnCardIds: { ...EMPTY_COLUMNS },
      userIds: [],
      status: 'disconnected',
      userId: generateUserId(),

      // ── Server message handler ─────────────────────────────────────────────────
      applyServerMsg(msg: ServerMessage) {
        switch (msg.type) {
          case 'board:state': {
            const columnCardIds = { ...EMPTY_COLUMNS };
            for (const id of COLUMN_IDS) {
              columnCardIds[id] = [...msg.board.columns[id].cardIds];
            }
            set({ cards: { ...msg.board.cards }, columnCardIds }, false, 'board:state');
            break;
          }
          case 'card:created': {
            set(
              (s) => ({
                cards: { ...s.cards, [msg.card.id]: msg.card },
                columnCardIds: {
                  ...s.columnCardIds,
                  [msg.card.columnId]: [...s.columnCardIds[msg.card.columnId], msg.card.id],
                },
              }),
              false,
              'card:created',
            );
            break;
          }
          case 'card:updated': {
            set(
              (s) => ({ cards: { ...s.cards, [msg.card.id]: msg.card } }),
              false,
              'card:updated',
            );
            break;
          }
          case 'card:deleted': {
            set((s) => {
              const card = s.cards[msg.cardId];
              if (!card) return {};
              const { [msg.cardId]: _removed, ...rest } = s.cards;
              return {
                cards: rest,
                columnCardIds: {
                  ...s.columnCardIds,
                  [card.columnId]: s.columnCardIds[card.columnId].filter(
                    (id) => id !== msg.cardId,
                  ),
                },
              };
            }, false, 'card:deleted');
            break;
          }
          case 'card:moved': {
            set((s) => {
              const card = s.cards[msg.cardId];
              if (!card) return {};
              return {
                cards: { ...s.cards, [msg.cardId]: { ...card, columnId: msg.columnId, order: msg.order } },
                columnCardIds: reorderColumns(s.columnCardIds, msg.cardId, card.columnId, msg.columnId, msg.order),
              };
            }, false, 'card:moved');
            break;
          }
          case 'presence:update': {
            set({ userIds: msg.userIds }, false, 'presence:update');
            break;
          }
        }
      },

      // ── Mutations ──────────────────────────────────────────────────────────────

      async createCard(columnId, values) {
        // No optimistic update: state arrives via card:created WS broadcast.
        await api.createCard(columnId, values);
      },

      async updateCard(cardId, values) {
        const prev = get().cards[cardId];
        set(
          (s) => ({
            cards: {
              ...s.cards,
              [cardId]: { ...s.cards[cardId], ...values, updatedAt: new Date().toISOString() },
            },
          }),
          false,
          'updateCard:optimistic',
        );
        try {
          await api.updateCard(cardId, values);
        } catch {
          if (prev) {
            set((s) => ({ cards: { ...s.cards, [cardId]: prev } }), false, 'updateCard:rollback');
          }
        }
      },

      async deleteCard(cardId) {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        const { [cardId]: _removed, ...remainingCards } = s.cards;
        set(
          {
            cards: remainingCards,
            columnCardIds: {
              ...s.columnCardIds,
              [card.columnId]: s.columnCardIds[card.columnId].filter((id) => id !== cardId),
            },
          },
          false,
          'deleteCard:optimistic',
        );
        try {
          await api.deleteCard(cardId);
        } catch {
          set({ cards: s.cards, columnCardIds: s.columnCardIds }, false, 'deleteCard:rollback');
        }
      },

      async moveCard(cardId, direction) {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        const colIndex = COLUMN_IDS.indexOf(card.columnId);
        const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
        if (targetIndex < 0 || targetIndex >= COLUMN_IDS.length) return;
        const targetColId = COLUMN_IDS[targetIndex];
        const targetOrder = s.columnCardIds[targetColId].length;

        const prevCards = s.cards;
        const prevColIds = s.columnCardIds;
        set(
          (st) => ({
            cards: { ...st.cards, [cardId]: { ...card, columnId: targetColId, order: targetOrder } },
            columnCardIds: reorderColumns(st.columnCardIds, cardId, card.columnId, targetColId, targetOrder),
          }),
          false,
          'moveCard:optimistic',
        );
        try {
          await api.moveCard(cardId, targetColId, targetOrder);
        } catch {
          set({ cards: prevCards, columnCardIds: prevColIds }, false, 'moveCard:rollback');
        }
      },

      // ── Transport ──────────────────────────────────────────────────────────────

      initTransport() {
        const { userId, applyServerMsg } = get();
        wsTransport.connect();

        const unsubMsg = wsTransport.subscribe(applyServerMsg);
        const unsubStatus = wsTransport.onStatus((status) => {
          set({ status }, false, `status:${status}`);
          if (status === 'connected') {
            wsTransport.send({ type: 'presence:join', userId });
          }
        });

        return () => {
          unsubMsg();
          unsubStatus();
          wsTransport.disconnect();
        };
      },
    }),
    { name: 'kanaban-board' },
  ),
);
