import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Card, ColumnId, ServerMessage } from '@kanaban/shared';
import { COLUMN_IDS } from '@kanaban/shared';
import { wsTransport } from '@/lib/ws-transport';
import type { CardFormValues } from '@/components/card-form/CardForm';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const EMPTY_COLUMNS: Record<ColumnId, string[]> = { todo: [], 'in-progress': [], done: [] };

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
      userId: `user-${Math.random().toString(36).slice(2, 8)}`,

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
              const oldColId = card.columnId;
              const newColId = msg.columnId;
              const updatedCard = { ...card, columnId: newColId, order: msg.order };

              // Remove from source; for same-column reorder, base off source without the card
              const sourceIds = s.columnCardIds[oldColId].filter((id) => id !== msg.cardId);
              const targetBase =
                oldColId === newColId
                  ? sourceIds
                  : s.columnCardIds[newColId].filter((id) => id !== msg.cardId);
              const targetIds = [
                ...targetBase.slice(0, msg.order),
                msg.cardId,
                ...targetBase.slice(msg.order),
              ];

              return {
                cards: { ...s.cards, [msg.cardId]: updatedCard },
                columnCardIds: {
                  ...s.columnCardIds,
                  [oldColId]: sourceIds,
                  [newColId]: targetIds,
                },
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
        await fetch(`${API_BASE}/api/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, columnId }),
        });
      },

      async updateCard(cardId, values) {
        const prev = get().cards[cardId];
        // Optimistic patch
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
          await fetch(`${API_BASE}/api/cards/${cardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
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
        // Optimistic removal
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
          await fetch(`${API_BASE}/api/cards/${cardId}`, { method: 'DELETE' });
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

        // Optimistic move
        const prevCards = s.cards;
        const prevColIds = s.columnCardIds;
        set(
          (st) => ({
            cards: { ...st.cards, [cardId]: { ...card, columnId: targetColId, order: targetOrder } },
            columnCardIds: {
              ...st.columnCardIds,
              [card.columnId]: st.columnCardIds[card.columnId].filter((id) => id !== cardId),
              [targetColId]: [...st.columnCardIds[targetColId], cardId],
            },
          }),
          false,
          'moveCard:optimistic',
        );
        try {
          await fetch(`${API_BASE}/api/cards/${cardId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columnId: targetColId, order: targetOrder }),
          });
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
