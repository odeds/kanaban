import type { ColumnId } from '@kanaban/shared';

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
