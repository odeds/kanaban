import { useShallow } from 'zustand/react/shallow';
import type { AdapterState } from '@/adapters/types';
import { useTransportEffect } from '@/adapters/useTransportEffect';
import { useZustandStore } from './store';

export function useZustandAdapter(): AdapterState {
  const { cards, columnCardIds, userIds, allUserIds, createCard, updateCard, deleteCard, moveCard } =
    useZustandStore(
      useShallow((s) => ({
        cards: s.cards,
        columnCardIds: s.columnCardIds,
        userIds: s.userIds,
        allUserIds: s.allUserIds,
        createCard: s.createCard,
        updateCard: s.updateCard,
        deleteCard: s.deleteCard,
        moveCard: s.moveCard,
      })),
    );

  // initTransport is a stable store method — access via getState to keep it out of the selector.
  useTransportEffect(useZustandStore.getState().initTransport);

  return {
    cards,
    columnCardIds,
    userIds,
    allUserIds,
    onCreateCard: createCard,
    onEditCard: updateCard,
    onDeleteCard: deleteCard,
    onMoveCard: moveCard,
  };
}
