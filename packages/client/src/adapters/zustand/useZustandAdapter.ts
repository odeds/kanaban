import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { AdapterState } from '@/adapters/types';
import { useZustandStore } from './store';

export function useZustandAdapter(): AdapterState {
  const {
    cards,
    columnCardIds,
    userIds,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    initTransport,
  } = useZustandStore(
    useShallow((s) => ({
      cards: s.cards,
      columnCardIds: s.columnCardIds,
      userIds: s.userIds,
      createCard: s.createCard,
      updateCard: s.updateCard,
      deleteCard: s.deleteCard,
      moveCard: s.moveCard,
      initTransport: s.initTransport,
    })),
  );

  useEffect(() => {
    const cleanup = initTransport();
    return cleanup;
  }, [initTransport]);

  return {
    cards,
    columnCardIds,
    userIds,
    onCreateCard: createCard,
    onEditCard: updateCard,
    onDeleteCard: deleteCard,
    onMoveCard: moveCard,
  };
}
