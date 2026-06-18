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
    <div className="flex w-full justify-between">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={!canMoveLeft}
        onClick={onMoveLeft}
        aria-label="Move to previous column"
        title="Move to previous column"
        data-testid="move-left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={!canMoveRight}
        onClick={onMoveRight}
        aria-label="Move to next column"
        title="Move to next column"
        data-testid="move-right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
