import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { store } from '../store';

describe('REST routes', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    store.reset();
    app = buildApp();
  });
  afterEach(() => app.close());

  const createCard = (overrides = {}) =>
    app.inject({
      method: 'POST',
      url: '/api/cards',
      payload: { title: 'T', description: 'D', assignee: 'A', columnId: 'todo', ...overrides },
    });

  // ── GET /api/board ──────────────────────────────────────────────────────────

  describe('GET /api/board', () => {
    it('returns all three columns and empty cards on a fresh store', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/board' });
      expect(res.statusCode).toBe(200);
      const { columns, cards } = res.json();
      expect(Object.keys(columns)).toEqual(['todo', 'in-progress', 'done']);
      expect(cards).toEqual({});
    });
  });

  // ── POST /api/cards ─────────────────────────────────────────────────────────

  describe('POST /api/cards', () => {
    it('creates a card and returns 201 with the card body', async () => {
      const res = await createCard({ title: 'Hello', columnId: 'in-progress' });
      expect(res.statusCode).toBe(201);
      const card = res.json();
      expect(card.id).toBeDefined();
      expect(card.title).toBe('Hello');
      expect(card.columnId).toBe('in-progress');
      expect(card.order).toBe(0);
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/cards',
        payload: { description: 'D', assignee: 'A', columnId: 'todo' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when columnId is not a valid column', async () => {
      const res = await createCard({ columnId: 'backlog' });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /api/cards/:id ────────────────────────────────────────────────────

  describe('PATCH /api/cards/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/cards/ghost',
        payload: { title: 'x' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('patches only the supplied fields and returns the updated card', async () => {
      const { id } = (await createCard()).json();
      const res = await app.inject({
        method: 'PATCH', url: `/api/cards/${id}`,
        payload: { title: 'Updated' },
      });
      expect(res.statusCode).toBe(200);
      const card = res.json();
      expect(card.title).toBe('Updated');
      expect(card.description).toBe('D');
    });
  });

  // ── DELETE /api/cards/:id ───────────────────────────────────────────────────

  describe('DELETE /api/cards/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/cards/ghost' });
      expect(res.statusCode).toBe(404);
    });

    it('removes the card and reflects that in GET /api/board', async () => {
      const { id } = (await createCard()).json();
      const del = await app.inject({ method: 'DELETE', url: `/api/cards/${id}` });
      expect(del.statusCode).toBe(200);
      expect(del.json().ok).toBe(true);

      const board = (await app.inject({ method: 'GET', url: '/api/board' })).json();
      expect(board.cards[id]).toBeUndefined();
      expect(board.columns['todo'].cardIds).not.toContain(id);
    });
  });

  // ── PATCH /api/cards/:id/move ───────────────────────────────────────────────

  describe('PATCH /api/cards/:id/move', () => {
    it('returns 404 for an unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/cards/ghost/move',
        payload: { columnId: 'done', order: 0 },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for an invalid columnId', async () => {
      const { id } = (await createCard()).json();
      const res = await app.inject({
        method: 'PATCH', url: `/api/cards/${id}/move`,
        payload: { columnId: 'nope', order: 0 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('moves the card and updates columnId', async () => {
      const { id } = (await createCard()).json();
      const res = await app.inject({
        method: 'PATCH', url: `/api/cards/${id}/move`,
        payload: { columnId: 'done', order: 0 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().columnId).toBe('done');

      const board = (await app.inject({ method: 'GET', url: '/api/board' })).json();
      expect(board.columns['done'].cardIds).toContain(id);
      expect(board.columns['todo'].cardIds).not.toContain(id);
    });
  });
});
