import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardForm, CardFormValues } from './CardForm';

interface CardDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CardFormValues) => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<CardFormValues>;
}

export function CardDialog({ open, onClose, onSubmit, mode, initialValues }: CardDialogProps) {
  function handleSubmit(values: CardFormValues) {
    onSubmit(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add card' : 'Edit card'}</DialogTitle>
        </DialogHeader>
        <CardForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={mode === 'create' ? 'Add card' : 'Save changes'}
        />
      </DialogContent>
    </Dialog>
  );
}
