import { describe, it, expect } from 'vitest';
import { makeBoard, reorderColumns, resolveMove } from '../columnUtils';
import type { Card, ColumnId } from '@kanaban/shared';

function cols(todo: string[], inProgress: string[], done: string[]): Record<ColumnId, string[]> {
  return { todo, 'in-progress': inProgress, done };
}

function card(columnId: ColumnId): Card {
  return { id: 'c1', title: '', description: '', assignee: '', columnId, order: 0, createdAt: '', updatedAt: '' };
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

describe('resolveMove', () => {
  it('returns null when moving left from the first column', () => {
    expect(resolveMove(cols(['c1'], [], []), card('todo'), 'left')).toBeNull();
  });

  it('returns null when moving right from the last column', () => {
    expect(resolveMove(cols([], [], ['c1']), card('done'), 'right')).toBeNull();
  });

  it('moves right from todo into in-progress, appending at end', () => {
    const result = resolveMove(cols(['c1'], ['a', 'b'], []), card('todo'), 'right');
    expect(result).toEqual({ targetColId: 'in-progress', targetOrder: 2 });
  });

  it('moves left from in-progress into todo, appending at end', () => {
    const result = resolveMove(cols(['a'], ['c1'], []), card('in-progress'), 'left');
    expect(result).toEqual({ targetColId: 'todo', targetOrder: 1 });
  });

  it('moves right from in-progress into done, appending at end', () => {
    const result = resolveMove(cols([], ['c1'], ['a', 'b', 'c']), card('in-progress'), 'right');
    expect(result).toEqual({ targetColId: 'done', targetOrder: 3 });
  });

  it('moves left from done into in-progress, appending at end', () => {
    const result = resolveMove(cols([], ['a'], ['c1']), card('done'), 'left');
    expect(result).toEqual({ targetColId: 'in-progress', targetOrder: 1 });
  });

  it('targets order 0 when destination column is empty', () => {
    const result = resolveMove(cols(['c1'], [], []), card('todo'), 'right');
    expect(result).toEqual({ targetColId: 'in-progress', targetOrder: 0 });
  });
});

describe('makeBoard', () => {
  it('populates columns with the correct titles and cardIds', () => {
    const cards = { c1: card('todo') };
    const board = makeBoard(cards, cols(['c1'], [], []));
    expect(board.columns['todo']).toEqual({ id: 'todo', title: 'To Do', cardIds: ['c1'] });
    expect(board.columns['in-progress']).toEqual({ id: 'in-progress', title: 'In Progress', cardIds: [] });
    expect(board.columns['done']).toEqual({ id: 'done', title: 'Done', cardIds: [] });
  });

  it('passes through the cards map unchanged', () => {
    const cards = { c1: card('todo') };
    const board = makeBoard(cards, cols(['c1'], [], []));
    expect(board.cards).toBe(cards);
  });

  it('produces all three columns even when all are empty', () => {
    const board = makeBoard({}, cols([], [], []));
    expect(Object.keys(board.columns)).toEqual(['todo', 'in-progress', 'done']);
  });
});
