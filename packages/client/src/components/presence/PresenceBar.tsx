import { Badge } from '@/components/ui/badge';

interface PresenceBarProps {
  userIds: string[];
}

export function PresenceBar({ userIds }: PresenceBarProps) {
  if (userIds.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs text-muted-foreground">Online:</span>
      {userIds.map((userId) => (
        <Badge key={userId} variant="outline" className="gap-1.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {userId}
        </Badge>
      ))}
    </div>
  );
}
