import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardMoveControlsProps {
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export function CardMoveControls({ canMoveLeft, canMoveRight, onMoveLeft, onMoveRight }: CardMoveControlsProps) {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        disabled={!canMoveLeft}
        onClick={onMoveLeft}
        aria-label="Move to previous column"
        data-testid="move-left"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        disabled={!canMoveRight}
        onClick={onMoveRight}
        aria-label="Move to next column"
        data-testid="move-right"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
