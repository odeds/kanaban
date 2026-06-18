import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function CardActions({ onEdit, onDelete }: CardActionsProps) {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={onEdit}
        aria-label="Edit card"
        title="Edit card"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={onDelete}
        aria-label="Delete card"
        title="Delete card"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
