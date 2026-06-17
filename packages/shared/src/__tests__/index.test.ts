import { describe, it, expect } from 'vitest';
import { isValidColumnId, COLUMN_TITLES, COLUMN_IDS } from '../index';

describe('isValidColumnId', () => {
  it('accepts all valid column ids', () => {
    expect(isValidColumnId('todo')).toBe(true);
    expect(isValidColumnId('in-progress')).toBe(true);
    expect(isValidColumnId('done')).toBe(true);
  });

  it('rejects unknown ids', () => {
    expect(isValidColumnId('backlog')).toBe(false);
    expect(isValidColumnId('')).toBe(false);
    expect(isValidColumnId('TODO')).toBe(false);
  });
});

describe('COLUMN_TITLES', () => {
  it('has a title for every column id', () => {
    for (const id of COLUMN_IDS) {
      expect(COLUMN_TITLES[id]).toBeTruthy();
    }
  });
});
