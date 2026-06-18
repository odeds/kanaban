import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AdapterState } from '@/adapters/types';
import { useTransportEffect } from '@/adapters/useTransportEffect';
import {
  store,
  initTransport,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
} from './store';
import type { AppDispatch } from './store';

type RootState = ReturnType<typeof store.getState>;

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useReduxAdapter(): AdapterState {
  const dispatch = useAppDispatch();

  const cards = useAppSelector((s) => s.board.cards);
  const columnCardIds = useAppSelector((s) => s.board.columnCardIds);
  const userIds = useAppSelector((s) => s.board.userIds);

  useTransportEffect(initTransport);

  return {
    cards,
    columnCardIds,
    userIds,
    onCreateCard: (columnId, values) => dispatch(createCard(columnId, values)),
    onEditCard: (cardId, values) => dispatch(updateCard(cardId, values)),
    onDeleteCard: (cardId) => dispatch(deleteCard(cardId)),
    onMoveCard: (cardId, direction) => dispatch(moveCard(cardId, direction)),
  };
}
