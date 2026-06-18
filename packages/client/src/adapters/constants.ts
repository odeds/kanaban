import type { ColumnId } from '@kanaban/shared';

export const EMPTY_COLUMNS: Record<ColumnId, string[]> = { todo: [], 'in-progress': [], done: [] };

export const generateUserId = () => `user-${Math.random().toString(36).slice(2, 8)}`;
