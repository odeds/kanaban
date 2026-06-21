import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AdapterState } from '@/adapters/types';
import type { AppDispatch, RootState } from './store';
import { SAGA_ACTIONS } from './sagas';
import type { ColumnId } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useSagaAdapter(): AdapterState {
  const dispatch = useAppDispatch();

  const cards = useAppSelector((s) => s.board.cards);
  const columnCardIds = useAppSelector((s) => s.board.columnCardIds);
  const userIds = useAppSelector((s) => s.board.userIds);
  const allUserIds = useAppSelector((s) => s.board.allUserIds);

  return {
    cards,
    columnCardIds,
    userIds,
    allUserIds,
    onCreateCard: (columnId: ColumnId, values: CardFormValues) =>
      dispatch({ type: SAGA_ACTIONS.CREATE_CARD, payload: { columnId, values } }),
    onEditCard: (cardId: string, values: CardFormValues) =>
      dispatch({ type: SAGA_ACTIONS.UPDATE_CARD, payload: { cardId, values } }),
    onDeleteCard: (cardId: string) =>
      dispatch({ type: SAGA_ACTIONS.DELETE_CARD, payload: { cardId } }),
    onMoveCard: (cardId: string, direction: 'left' | 'right') =>
      dispatch({ type: SAGA_ACTIONS.MOVE_CARD, payload: { cardId, direction } }),
  };
}
