import { COLUMN_IDS } from '@kanaban/shared';
import type { ColumnId } from '@kanaban/shared';

export const EMPTY_COLUMNS: Record<ColumnId, string[]> = Object.fromEntries(
  COLUMN_IDS.map((id): [ColumnId, string[]] => [id, []]),
) as Record<ColumnId, string[]>;

export const USER_ID_STORAGE_KEY = 'kanaban:userId';
