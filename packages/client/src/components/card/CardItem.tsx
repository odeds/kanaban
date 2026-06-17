import { useState } from 'react';
import type { Card } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';
import { CardDialog } from '@/components/card-form/CardDialog';
import { CardBody } from './CardBody';
import { CardActions } from './CardActions';
import { CardMoveControls } from './CardMoveControls';

interface CardItemProps {
  card: Card;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onEdit: (cardId: string, values: CardFormValues) => void;
  onDelete: (cardId: string) => void;
  onMoveLeft: (cardId: string) => void;
  onMoveRight: (cardId: string) => void;
}

export function CardItem({ card, canMoveLeft, canMoveRight, onEdit, onDelete, onMoveLeft, onMoveRight }: CardItemProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="rounded-md border bg-card p-3 shadow-sm flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <CardBody title={card.title} description={card.description} assignee={card.assignee} />
          <CardActions onEdit={() => setEditOpen(true)} onDelete={() => onDelete(card.id)} />
        </div>
        <div className="flex justify-end border-t pt-2">
          <CardMoveControls
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onMoveLeft={() => onMoveLeft(card.id)}
            onMoveRight={() => onMoveRight(card.id)}
          />
        </div>
      </div>

      <CardDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => onEdit(card.id, values)}
        mode="edit"
        initialValues={{ title: card.title, description: card.description, assignee: card.assignee }}
      />
    </>
  );
}
