export type ColumnId = 'todo' | 'in-progress' | 'done';

export const COLUMN_IDS: readonly ColumnId[] = ['todo', 'in-progress', 'done'];

export const COLUMN_TITLES: Record<ColumnId, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

export interface Card {
  id: string;
  title: string;
  description: string;
  assignee: string;
  columnId: ColumnId;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  columns: Record<ColumnId, { id: ColumnId; title: string; cardIds: string[] }>;
  cards: Record<string, Card>;
}

export type ServerMessage =
  | { type: 'board:state'; board: Board }
  | { type: 'card:created'; card: Card }
  | { type: 'card:updated'; card: Card }
  | { type: 'card:deleted'; cardId: string }
  | { type: 'card:moved'; cardId: string; columnId: ColumnId; order: number }
  | { type: 'presence:update'; userIds: string[] };

export type ClientMessage =
  | { type: 'card:create'; title: string; description: string; assignee: string; columnId: ColumnId }
  | { type: 'card:update'; cardId: string; title?: string; description?: string; assignee?: string }
  | { type: 'card:delete'; cardId: string }
  | { type: 'card:move'; cardId: string; columnId: ColumnId; order: number }
  | { type: 'presence:join'; userId: string };

export function isValidColumnId(id: string): id is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(id);
}
