import type { ColumnId } from '@kanaban/shared';

export const EMPTY_COLUMNS: Record<ColumnId, string[]> = { todo: [], 'in-progress': [], done: [] };
