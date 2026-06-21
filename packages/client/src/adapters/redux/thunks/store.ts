import { configureStore } from '@reduxjs/toolkit';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { ColumnId, ServerMessage } from '@kanaban/shared';
import { wsTransport } from '@/lib/ws-transport';
import { api } from '@/lib/api';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { actions, boardReducer } from '../slice';
import { makeBoard, resolveMove } from '@/adapters/columnUtils';
import { USER_ID_STORAGE_KEY } from '@/adapters/constants';

export const store = configureStore({
  reducer: { board: boardReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType | Promise<ReturnType>,
  RootState,
  unknown,
  UnknownAction
>;

// ── Thunks ────────────────────────────────────────────────────────────────────

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
        localStorage.setItem(USER_ID_STORAGE_KEY, msg.userId);
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
    const move = resolveMove(state.columnCardIds, card, direction);
    if (!move) return;
    const { targetColId, targetOrder } = move;

    const prevCards = state.cards;
    const prevColIds = state.columnCardIds;
    dispatch(actions.cardMovedOptimistic({ cardId, targetColId, targetOrder }));
    try {
      await api.moveCard(cardId, targetColId, targetOrder);
    } catch {
      dispatch(actions.boardStateReceived(makeBoard(prevCards, prevColIds)));
    }
  };

// ── Transport ─────────────────────────────────────────────────────────────────

export function initTransport(): () => void {
  const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY) ?? undefined;
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
