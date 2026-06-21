import type { Board, Card, ColumnId } from '@kanaban/shared';
import { COLUMN_IDS, COLUMN_TITLES } from '@kanaban/shared';

export function reorderColumns(
  columnCardIds: Record<ColumnId, string[]>,
  cardId: string,
  fromColId: ColumnId,
  toColId: ColumnId,
  toOrder: number,
): Record<ColumnId, string[]> {
  const sourceIds = columnCardIds[fromColId].filter((id) => id !== cardId);
  const targetBase =
    fromColId === toColId ? sourceIds : columnCardIds[toColId].filter((id) => id !== cardId);
  const targetIds = [...targetBase.slice(0, toOrder), cardId, ...targetBase.slice(toOrder)];
  return {
    ...columnCardIds,
    [fromColId]: sourceIds,
    [toColId]: targetIds,
  };
}

export function resolveMove(
  columnCardIds: Record<ColumnId, string[]>,
  card: Card,
  direction: 'left' | 'right',
): { targetColId: ColumnId; targetOrder: number } | null {
  const colIndex = COLUMN_IDS.indexOf(card.columnId);
  const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
  if (targetIndex < 0 || targetIndex >= COLUMN_IDS.length) return null;
  const targetColId = COLUMN_IDS[targetIndex];
  const targetOrder = columnCardIds[targetColId].length;
  return { targetColId, targetOrder };
}

export function makeBoard(
  cards: Record<string, Card>,
  columnCardIds: Record<ColumnId, string[]>,
): Board {
  const columns = {} as Board['columns'];
  for (const id of COLUMN_IDS) {
    columns[id] = { id, title: COLUMN_TITLES[id], cardIds: columnCardIds[id] };
  }
  return { columns, cards };
}
