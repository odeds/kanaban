import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Board, Card, ColumnId } from '@kanaban/shared';
import { COLUMN_IDS } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { EMPTY_COLUMNS } from '@/adapters/constants';
import { reorderColumns } from '@/adapters/columnUtils';

export interface BoardState {
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

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
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

export const actions = boardSlice.actions;
export const boardReducer = boardSlice.reducer;
