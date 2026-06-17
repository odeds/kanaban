import type { Card, ColumnId } from '@kanaban/shared';
import { COLUMN_IDS, COLUMN_TITLES } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { Column } from '@/components/column/Column';
import { PresenceBar } from '@/components/presence/PresenceBar';

export interface BoardProps {
  cards: Record<string, Card>;
  columnCardIds: Record<ColumnId, string[]>;
  userIds: string[];
  onCreateCard: (columnId: ColumnId, values: CardFormValues) => void;
  onEditCard: (cardId: string, values: CardFormValues) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: 'left' | 'right') => void;
}

export function Board({ cards, columnCardIds, userIds, onCreateCard, onEditCard, onDeleteCard, onMoveCard }: BoardProps) {
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        <PresenceBar userIds={userIds} />
      </div>

      <div className="flex gap-4 flex-1 items-start">
        {COLUMN_IDS.map((id, index) => {
          const columnCards = (columnCardIds[id] ?? [])
            .map((cardId) => cards[cardId])
            .filter(Boolean) as Card[];

          return (
            <Column
              key={id}
              id={id}
              title={COLUMN_TITLES[id]}
              cards={columnCards}
              isFirst={index === 0}
              isLast={index === COLUMN_IDS.length - 1}
              onCreateCard={onCreateCard}
              onEditCard={onEditCard}
              onDeleteCard={onDeleteCard}
              onMoveCard={onMoveCard}
            />
          );
        })}
      </div>
    </div>
  );
}
