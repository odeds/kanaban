import type { Card, ColumnId } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';

export interface AdapterState {
  cards: Record<string, Card>;
  columnCardIds: Record<ColumnId, string[]>;
  userIds: string[];
  onCreateCard: (columnId: ColumnId, values: CardFormValues) => void;
  onEditCard: (cardId: string, values: CardFormValues) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: 'left' | 'right') => void;
}
