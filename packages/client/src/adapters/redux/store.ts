import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk } from './types';
import type { Board, Card, ColumnId, ServerMessage } from '@kanaban/shared';
import { COLUMN_IDS } from '@kanaban/shared';
import { wsTransport } from '@/lib/ws-transport';
import { api } from '@/lib/api';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { EMPTY_COLUMNS } from '@/adapters/constants';
import { reorderColumns } from '@/adapters/columnUtils';

interface BoardState {
  cards: Record<string, Card>;
  columnCardIds: Record<ColumnId, string[]>;
  userIds: string[];
  allUserIds: string[];
  status: 'connected' | 'disconnected' | 'reconnecting';
  userId: string;
}

const initialState: BoardState = {
  cards: {},
  columnCardIds: { ...EMPTY_COLUMNS },
  userIds: [],
  allUserIds: [],
  status: 'disconnected',
  userId: '',
};

// ── Slice ──────────────────────────────────────────────────────────────────────

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    // Server message reducers — each WebSocket event becomes a named action
    boardStateReceived(state, action: PayloadAction<Board>) {
      const columnCardIds = { ...EMPTY_COLUMNS };
      for (const id of COLUMN_IDS) {
        columnCardIds[id] = [...action.payload.columns[id].cardIds];
      }
      state.cards = { ...action.payload.cards };
      state.columnCardIds = columnCardIds;
    },

    cardCreated(state, action: PayloadAction<Card>) {
      const card = action.payload;
      state.cards[card.id] = card;
      state.columnCardIds[card.columnId].push(card.id);
    },

    cardUpdated(state, action: PayloadAction<Card>) {
      state.cards[action.payload.id] = action.payload;
    },

    cardDeleted(state, action: PayloadAction<string>) {
      const card = state.cards[action.payload];
      if (!card) return;
      delete state.cards[action.payload];
      state.columnCardIds[card.columnId] = state.columnCardIds[card.columnId].filter(
        (id) => id !== action.payload,
      );
    },

    cardMoved(
      state,
      action: PayloadAction<{ cardId: string; columnId: ColumnId; order: number }>,
    ) {
      const { cardId, columnId: newColId, order } = action.payload;
      const card = state.cards[cardId];
      if (!card) return;
      state.cards[cardId] = { ...card, columnId: newColId, order };
      Object.assign(
        state.columnCardIds,
        reorderColumns(
          state.columnCardIds as unknown as Record<ColumnId, string[]>,
          cardId,
          card.columnId,
          newColId,
          order,
        ),
      );
    },

    sessionInitReceived(state, action: PayloadAction<string>) {
      state.userId = action.payload;
    },

    presenceUpdated(state, action: PayloadAction<string[]>) {
      state.userIds = action.payload;
    },

    allUsersUpdated(state, action: PayloadAction<string[]>) {
      state.allUserIds = action.payload;
    },

    statusChanged(
      state,
      action: PayloadAction<'connected' | 'disconnected' | 'reconnecting'>,
    ) {
      state.status = action.payload;
    },

    // Optimistic reducers — applied before the REST call completes
    cardUpdatedOptimistic(
      state,
      action: PayloadAction<{ cardId: string; values: CardFormValues }>,
    ) {
      const { cardId, values } = action.payload;
      if (state.cards[cardId]) {
        Object.assign(state.cards[cardId], values, { updatedAt: new Date().toISOString() });
      }
    },

    cardDeletedOptimistic(state, action: PayloadAction<string>) {
      const card = state.cards[action.payload];
      if (!card) return;
      delete state.cards[action.payload];
      state.columnCardIds[card.columnId] = state.columnCardIds[card.columnId].filter(
        (id) => id !== action.payload,
      );
    },

    cardMovedOptimistic(
      state,
      action: PayloadAction<{ cardId: string; targetColId: ColumnId; targetOrder: number }>,
    ) {
      const { cardId, targetColId, targetOrder } = action.payload;
      const card = state.cards[cardId];
      if (!card) return;
      state.cards[cardId] = { ...card, columnId: targetColId, order: targetOrder };
      Object.assign(
        state.columnCardIds,
        reorderColumns(
          state.columnCardIds as unknown as Record<ColumnId, string[]>,
          cardId,
          card.columnId,
          targetColId,
          targetOrder,
        ),
      );
    },
  },
});

const actions = boardSlice.actions;

export const store = configureStore({
  reducer: { board: boardSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ── Thunks ────────────────────────────────────────────────────────────────────

// Each server message type dispatches a distinct named action — the key Redux
// difference: the action log shows exactly what events shaped the state.
export function applyServerMsg(msg: ServerMessage): AppThunk {
  return (dispatch) => {
    switch (msg.type) {
      case 'board:state':
        dispatch(actions.boardStateReceived(msg.board));
        break;
      case 'card:created':
        dispatch(actions.cardCreated(msg.card));
        break;
      case 'card:updated':
        dispatch(actions.cardUpdated(msg.card));
        break;
      case 'card:deleted':
        dispatch(actions.cardDeleted(msg.cardId));
        break;
      case 'card:moved':
        dispatch(actions.cardMoved({ cardId: msg.cardId, columnId: msg.columnId, order: msg.order }));
        break;
      case 'session:init':
        localStorage.setItem('kanaban:userId', msg.userId);
        dispatch(actions.sessionInitReceived(msg.userId));
        break;
      case 'presence:update':
        dispatch(actions.presenceUpdated(msg.userIds));
        break;
      case 'users:update':
        dispatch(actions.allUsersUpdated(msg.userIds));
        break;
    }
  };
}

export const createCard =
  (columnId: ColumnId, values: CardFormValues): AppThunk =>
  async () => {
    // No optimistic update: state arrives via card:created WS broadcast.
    await api.createCard(columnId, values);
  };

export const updateCard =
  (cardId: string, values: CardFormValues): AppThunk =>
  async (dispatch, getState) => {
    const prev = (getState() as RootState).board.cards[cardId];
    dispatch(actions.cardUpdatedOptimistic({ cardId, values }));
    try {
      await api.updateCard(cardId, values);
    } catch {
      if (prev) dispatch(actions.cardUpdated(prev));
    }
  };

export const deleteCard =
  (cardId: string): AppThunk =>
  async (dispatch, getState) => {
    const state = (getState() as RootState).board;
    const card = state.cards[cardId];
    if (!card) return;
    dispatch(actions.cardDeletedOptimistic(cardId));
    try {
      await api.deleteCard(cardId);
    } catch {
      dispatch(actions.cardCreated(card));
    }
  };

export const moveCard =
  (cardId: string, direction: 'left' | 'right'): AppThunk =>
  async (dispatch, getState) => {
    const state = (getState() as RootState).board;
    const card = state.cards[cardId];
    if (!card) return;
    const colIndex = COLUMN_IDS.indexOf(card.columnId);
    const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= COLUMN_IDS.length) return;
    const targetColId = COLUMN_IDS[targetIndex];
    const targetOrder = state.columnCardIds[targetColId].length;

    const prevCards = state.cards;
    const prevColIds = state.columnCardIds;
    dispatch(actions.cardMovedOptimistic({ cardId, targetColId, targetOrder }));
    try {
      await api.moveCard(cardId, targetColId, targetOrder);
    } catch {
      dispatch(actions.boardStateReceived({
        columns: {
          todo: { id: 'todo', title: 'To Do', cardIds: prevColIds.todo },
          'in-progress': { id: 'in-progress', title: 'In Progress', cardIds: prevColIds['in-progress'] },
          done: { id: 'done', title: 'Done', cardIds: prevColIds.done },
        },
        cards: prevCards,
      }));
    }
  };

// ── Transport ─────────────────────────────────────────────────────────────────

export function initTransport(): () => void {
  const storedUserId = localStorage.getItem('kanaban:userId') ?? undefined;
  wsTransport.connect(storedUserId);

  const unsubMsg = wsTransport.subscribe((msg) => store.dispatch(applyServerMsg(msg)));
  const unsubStatus = wsTransport.onStatus((status) => {
    store.dispatch(actions.statusChanged(status));
  });

  return () => {
    unsubMsg();
    unsubStatus();
    wsTransport.disconnect();
  };
}
