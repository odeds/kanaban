import { eventChannel } from 'redux-saga';
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
} from 'redux-saga/effects';
import type { EventChannel } from 'redux-saga';
import type { Card, ColumnId, ServerMessage } from '@kanaban/shared';
import { wsTransport } from '@/lib/ws-transport';
import { api } from '@/lib/api';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { actions } from '../slice';
import { makeBoard, resolveMove } from '@/adapters/columnUtils';
import { USER_ID_STORAGE_KEY } from '@/adapters/constants';
import type { RootState } from './store';

// ── Saga action types ─────────────────────────────────────────────────────────
export const SAGA_ACTIONS = {
  CREATE_CARD: 'saga/createCard',
  UPDATE_CARD: 'saga/updateCard',
  DELETE_CARD: 'saga/deleteCard',
  MOVE_CARD:   'saga/moveCard',
} as const;

export type CreateCardAction = {
  type: typeof SAGA_ACTIONS.CREATE_CARD;
  payload: { columnId: ColumnId; values: CardFormValues };
};
export type UpdateCardAction = {
  type: typeof SAGA_ACTIONS.UPDATE_CARD;
  payload: { cardId: string; values: CardFormValues };
};
export type DeleteCardAction = {
  type: typeof SAGA_ACTIONS.DELETE_CARD;
  payload: { cardId: string };
};
export type MoveCardAction = {
  type: typeof SAGA_ACTIONS.MOVE_CARD;
  payload: { cardId: string; direction: 'left' | 'right' };
};

// ── Transport channel ─────────────────────────────────────────────────────────
// A single eventChannel emits both server messages and connection status changes
// so that all transport events are consumed via yield take() with guaranteed
// subscription ordering: onStatus is registered before connect() is called,
// ensuring the initial 'connected' notification is never missed.

type TransportEvent =
  | { kind: 'message'; msg: ServerMessage }
  | { kind: 'status'; status: 'connected' | 'disconnected' | 'reconnecting' };

function createTransportChannel(): EventChannel<TransportEvent> {
  return eventChannel((emit) => {
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY) ?? undefined;
    const unsubStatus = wsTransport.onStatus((status) => emit({ kind: 'status', status }));
    wsTransport.connect(storedUserId);
    const unsubMsg = wsTransport.subscribe((msg) => emit({ kind: 'message', msg }));
    return () => {
      unsubMsg();
      unsubStatus();
      wsTransport.disconnect();
    };
  });
}

// ── Transport watcher ─────────────────────────────────────────────────────────

function* watchTransport() {
  const channel = (yield call(createTransportChannel)) as EventChannel<TransportEvent>;
  try {
    while (true) {
      const event = (yield take(channel)) as TransportEvent;
      if (event.kind === 'message') {
        yield call(applyServerMessage, event.msg);
      } else {
        yield put(actions.statusChanged(event.status));
      }
    }
  } finally {
    channel.close();
  }
}

function* applyServerMessage(msg: ServerMessage): Generator {
  switch (msg.type) {
    case 'board:state':
      yield put(actions.boardStateReceived(msg.board));
      break;
    case 'card:created':
      yield put(actions.cardCreated(msg.card));
      break;
    case 'card:updated':
      yield put(actions.cardUpdated(msg.card));
      break;
    case 'card:deleted':
      yield put(actions.cardDeleted(msg.cardId));
      break;
    case 'card:moved':
      yield put(actions.cardMoved({ cardId: msg.cardId, columnId: msg.columnId, order: msg.order }));
      break;
    case 'session:init':
      localStorage.setItem(USER_ID_STORAGE_KEY, msg.userId);
      yield put(actions.sessionInitReceived(msg.userId));
      break;
    case 'presence:update':
      yield put(actions.presenceUpdated(msg.userIds));
      break;
    case 'users:update':
      yield put(actions.allUsersUpdated(msg.userIds));
      break;
  }
}

// ── Worker sagas ──────────────────────────────────────────────────────────────

function* createCardWorker(action: CreateCardAction) {
  yield call(api.createCard, action.payload.columnId, action.payload.values);
}

function* updateCardWorker(action: UpdateCardAction): Generator {
  const { cardId, values } = action.payload;
  const prev = (yield select((s: RootState) => s.board.cards[cardId])) as Card | undefined;

  yield put(actions.cardUpdatedOptimistic({ cardId, values }));
  try {
    yield call(api.updateCard, cardId, values);
  } catch {
    if (prev) yield put(actions.cardUpdated(prev));
  }
}

function* deleteCardWorker(action: DeleteCardAction): Generator {
  const { cardId } = action.payload;
  const card = (yield select((s: RootState) => s.board.cards[cardId])) as Card | undefined;
  if (!card) return;

  yield put(actions.cardDeletedOptimistic(cardId));
  try {
    yield call(api.deleteCard, cardId);
  } catch {
    yield put(actions.cardCreated(card));
  }
}

function* moveCardWorker(action: MoveCardAction): Generator {
  const { cardId, direction } = action.payload;
  const state = (yield select((s: RootState) => s.board)) as RootState['board'];
  const card = state.cards[cardId];
  if (!card) return;

  const move = resolveMove(state.columnCardIds, card, direction);
  if (!move) return;
  const { targetColId, targetOrder } = move;

  const prevCards = state.cards;
  const prevColIds = state.columnCardIds;

  yield put(actions.cardMovedOptimistic({ cardId, targetColId, targetOrder }));
  try {
    yield call(api.moveCard, cardId, targetColId, targetOrder);
  } catch {
    yield put(actions.boardStateReceived(makeBoard(prevCards, prevColIds)));
  }
}

// ── Root saga ─────────────────────────────────────────────────────────────────

export function* rootSaga() {
  yield all([
    fork(watchTransport),
    takeEvery(SAGA_ACTIONS.CREATE_CARD, createCardWorker),
    takeEvery(SAGA_ACTIONS.UPDATE_CARD, updateCardWorker),
    takeEvery(SAGA_ACTIONS.DELETE_CARD, deleteCardWorker),
    takeEvery(SAGA_ACTIONS.MOVE_CARD, moveCardWorker),
  ]);
}
