import { Type, Static } from '@sinclair/typebox';

// ── ColumnId ──────────────────────────────────────────────────────────────────

export const ColumnIdSchema = Type.Union([
  Type.Literal('todo'),
  Type.Literal('in-progress'),
  Type.Literal('done'),
]);
export type ColumnId = Static<typeof ColumnIdSchema>;

export const COLUMN_IDS: readonly ColumnId[] = ['todo', 'in-progress', 'done'];
export const COLUMN_TITLES: Record<ColumnId, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

// ── Card ──────────────────────────────────────────────────────────────────────

export const CardSchema = Type.Object(
  {
    id: Type.String(),
    title: Type.String(),
    description: Type.String(),
    assignee: Type.String(),
    columnId: ColumnIdSchema,
    order: Type.Integer({ minimum: 0 }),
    createdAt: Type.String(),
    updatedAt: Type.String(),
  },
  { additionalProperties: false },
);
export type Card = Static<typeof CardSchema>;

// ── Column ────────────────────────────────────────────────────────────────────

export const ColumnSchema = Type.Object(
  {
    id: ColumnIdSchema,
    title: Type.String(),
    cardIds: Type.Array(Type.String()),
  },
  { additionalProperties: false },
);

// ── Board ─────────────────────────────────────────────────────────────────────

export const BoardSchema = Type.Object(
  {
    columns: Type.Object({
      'todo': ColumnSchema,
      'in-progress': ColumnSchema,
      'done': ColumnSchema,
    }),
    cards: Type.Record(Type.String(), CardSchema),
  },
  { additionalProperties: false },
);
export type Board = Static<typeof BoardSchema>;

// ── WebSocket message types ───────────────────────────────────────────────────
// Plain TypeScript unions — used for WS protocol only, not HTTP schema validation.

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

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isValidColumnId(id: string): id is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(id);
}
