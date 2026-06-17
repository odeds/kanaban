import { Badge } from '@/components/ui/badge';

interface ColumnHeaderProps {
  title: string;
  count: number;
}

export function ColumnHeader({ title, count }: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <Badge variant="secondary" className="text-xs tabular-nums">{count}</Badge>
    </div>
  );
}
