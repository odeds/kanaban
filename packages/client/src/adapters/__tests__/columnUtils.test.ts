import { describe, it, expect } from 'vitest';
import { reorderColumns } from '../columnUtils';
import type { ColumnId } from '@kanaban/shared';

function cols(todo: string[], inProgress: string[], done: string[]): Record<ColumnId, string[]> {
  return { todo, 'in-progress': inProgress, done };
}

describe('reorderColumns', () => {
  it('moves a card to a different column at position 0', () => {
    const result = reorderColumns(cols(['a', 'b'], ['c'], []), 'a', 'todo', 'in-progress', 0);
    expect(result.todo).toEqual(['b']);
    expect(result['in-progress']).toEqual(['a', 'c']);
    expect(result.done).toEqual([]);
  });

  it('appends a card to the end of a target column', () => {
    const result = reorderColumns(cols(['a', 'b'], ['c', 'd'], []), 'a', 'todo', 'in-progress', 2);
    expect(result.todo).toEqual(['b']);
    expect(result['in-progress']).toEqual(['c', 'd', 'a']);
  });

  it('moves into an empty target column', () => {
    const result = reorderColumns(cols(['a', 'b'], [], []), 'a', 'todo', 'done', 0);
    expect(result.todo).toEqual(['b']);
    expect(result.done).toEqual(['a']);
  });

  it('reorders within the same column — moves card forward', () => {
    const result = reorderColumns(cols(['a', 'b', 'c'], [], []), 'a', 'todo', 'todo', 2);
    expect(result.todo).toEqual(['b', 'c', 'a']);
  });

  it('reorders within the same column — moves card backward', () => {
    const result = reorderColumns(cols(['a', 'b', 'c'], [], []), 'c', 'todo', 'todo', 0);
    expect(result.todo).toEqual(['c', 'a', 'b']);
  });

  it('reorders within the same column — moves to middle', () => {
    const result = reorderColumns(cols(['a', 'b', 'c', 'd'], [], []), 'd', 'todo', 'todo', 1);
    expect(result.todo).toEqual(['a', 'd', 'b', 'c']);
  });

  it('does not affect unrelated columns', () => {
    const result = reorderColumns(cols(['a'], ['b'], ['c', 'd']), 'a', 'todo', 'in-progress', 0);
    expect(result.done).toEqual(['c', 'd']);
  });

  it('does not mutate the input', () => {
    const input = cols(['a', 'b'], ['c'], []);
    reorderColumns(input, 'a', 'todo', 'in-progress', 0);
    expect(input.todo).toEqual(['a', 'b']);
    expect(input['in-progress']).toEqual(['c']);
  });
});
