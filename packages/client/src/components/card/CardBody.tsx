import { Badge } from '@/components/ui/badge';

interface CardBodyProps {
  title: string;
  description: string;
  assignee: string;
}

export function CardBody({ title, description, assignee }: CardBodyProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold leading-tight">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      )}
      {assignee && (
        <Badge variant="secondary" className="w-fit text-xs">{assignee}</Badge>
      )}
    </div>
  );
}
