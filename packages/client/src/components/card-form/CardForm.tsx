import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CardFormValues {
  title: string;
  description: string;
  assignee: string;
}

interface CardFormProps {
  initialValues?: Partial<CardFormValues>;
  users: string[];
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function CardForm({ initialValues, users, onSubmit, onCancel, submitLabel = 'Save' }: CardFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [assignee, setAssignee] = useState(initialValues?.assignee ?? '');
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setAssignee(initialValues?.assignee ?? '');
    setTitleError(false);
  }, [initialValues]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setTitleError(true); return; }
    onSubmit({ title: title.trim(), description: description.trim(), assignee });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
          placeholder="Card title"
          aria-invalid={titleError}
          data-testid="input-title"
        />
        {titleError && <p className="text-xs text-destructive" data-testid="title-error">Title is required</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to be done?"
          rows={3}
          data-testid="input-description"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Assignee</label>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          data-testid="input-assignee"
          className={cn(
            "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "text-foreground dark:bg-input/30",
          )}
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="form-cancel">Cancel</Button>
        <Button type="submit" data-testid="form-submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
