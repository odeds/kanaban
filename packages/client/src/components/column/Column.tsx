import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Card, ColumnId } from '@kanaban/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardItem } from '@/components/card/CardItem';
import { CardDialog } from '@/components/card-form/CardDialog';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { ColumnHeader } from './ColumnHeader';

interface ColumnProps {
  id: ColumnId;
  title: string;
  cards: Card[];
  isFirst: boolean;
  isLast: boolean;
  onCreateCard: (columnId: ColumnId, values: CardFormValues) => void;
  onEditCard: (cardId: string, values: CardFormValues) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: 'left' | 'right') => void;
}

export function Column({ id, title, cards, isFirst, isLast, onCreateCard, onEditCard, onDeleteCard, onMoveCard }: ColumnProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 min-w-0 rounded-lg border bg-muted/40 p-3">
      <ColumnHeader title={title} count={cards.length} />

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="flex flex-col gap-2 pb-2">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              canMoveLeft={!isFirst}
              canMoveRight={!isLast}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onMoveLeft={(cardId) => onMoveCard(cardId, 'left')}
              onMoveRight={(cardId) => onMoveCard(cardId, 'right')}
            />
          ))}
        </div>
      </ScrollArea>

      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full text-muted-foreground"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add card
      </Button>

      <CardDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(values) => onCreateCard(id, values)}
        mode="create"
      />
    </div>
  );
}
