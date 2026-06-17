import { describe, it, expect, beforeEach } from 'vitest';
import { BoardStore } from '../store';

describe('BoardStore', () => {
  let s: BoardStore;
  beforeEach(() => { s = new BoardStore(); });

  const card = (overrides = {}) => ({
    title: 'T', description: 'D', assignee: 'A', columnId: 'todo' as const, ...overrides,
  });

  describe('createCard', () => {
    it('adds card to the correct column', () => {
      const c = s.createCard(card());
      const board = s.getBoard();
      expect(board.cards[c.id]).toBeDefined();
      expect(board.columns['todo'].cardIds).toContain(c.id);
    });

    it('sets order equal to current column length', () => {
      const c1 = s.createCard(card());
      const c2 = s.createCard(card());
      expect(c1.order).toBe(0);
      expect(c2.order).toBe(1);
    });
  });

  describe('updateCard', () => {
    it('returns null for unknown id', () => {
      expect(s.updateCard('x', { title: 'new' })).toBeNull();
    });

    it('patches only the supplied fields', () => {
      const c = s.createCard(card());
      const updated = s.updateCard(c.id, { title: 'New' })!;
      expect(updated.title).toBe('New');
      expect(updated.description).toBe('D');
    });

    it('advances updatedAt', async () => {
      const c = s.createCard(card());
      await new Promise((r) => setTimeout(r, 5));
      const updated = s.updateCard(c.id, { title: 'New' })!;
      expect(updated.updatedAt > c.updatedAt).toBe(true);
    });
  });

  describe('deleteCard', () => {
    it('returns false for unknown id', () => {
      expect(s.deleteCard('x')).toBe(false);
    });

    it('removes card from store and column', () => {
      const c = s.createCard(card());
      s.deleteCard(c.id);
      const board = s.getBoard();
      expect(board.cards[c.id]).toBeUndefined();
      expect(board.columns['todo'].cardIds).not.toContain(c.id);
    });

    it('recomputes order of remaining cards', () => {
      const c1 = s.createCard(card());
      const c2 = s.createCard(card());
      const c3 = s.createCard(card());
      s.deleteCard(c1.id);
      const board = s.getBoard();
      expect(board.cards[c2.id].order).toBe(0);
      expect(board.cards[c3.id].order).toBe(1);
    });
  });

  describe('moveCard', () => {
    it('returns null for unknown id', () => {
      expect(s.moveCard('x', 'done', 0)).toBeNull();
    });

    it('moves card to a different column', () => {
      const c = s.createCard(card());
      s.moveCard(c.id, 'done', 0);
      const board = s.getBoard();
      expect(board.columns['todo'].cardIds).not.toContain(c.id);
      expect(board.columns['done'].cardIds).toContain(c.id);
      expect(board.cards[c.id].columnId).toBe('done');
    });

    it('clamps order to column length', () => {
      const c = s.createCard(card());
      const moved = s.moveCard(c.id, 'done', 999)!;
      expect(moved.order).toBe(0);
    });

    it('recomputes order for cards left behind in the source column', () => {
      const c1 = s.createCard(card());
      const c2 = s.createCard(card());
      const c3 = s.createCard(card());
      s.moveCard(c1.id, 'done', 0);
      const board = s.getBoard();
      expect(board.cards[c2.id].order).toBe(0);
      expect(board.cards[c3.id].order).toBe(1);
    });

    it('inserts card at the correct position within destination column', () => {
      const a = s.createCard(card({ columnId: 'done' as const }));
      const b = s.createCard(card({ columnId: 'done' as const }));
      const c = s.createCard(card());
      s.moveCard(c.id, 'done', 1); // insert between a and b
      const board = s.getBoard();
      expect(board.columns['done'].cardIds[1]).toBe(c.id);
    });
  });

  describe('getBoard', () => {
    it('returns a deep clone — external mutations do not affect internal state', () => {
      const board = s.getBoard();
      board.columns['todo'].cardIds.push('fake');
      expect(s.getBoard().columns['todo'].cardIds).toHaveLength(0);
    });
  });
});
