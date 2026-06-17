import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, Static } from '@sinclair/typebox';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { CardSchema, BoardSchema, ColumnIdSchema, isValidColumnId } from '@kanaban/shared';
import { store } from './store';
import { broadcast } from './broadcast';
import { handleWsConnection } from './ws-handler';

// ── Request body schemas (backend-specific) ───────────────────────────────────

const CreateCardBody = Type.Object(
  {
    title: Type.String({ minLength: 1 }),
    description: Type.String(),
    assignee: Type.String(),
    columnId: ColumnIdSchema,
  },
  { additionalProperties: false },
);

const UpdateCardBody = Type.Object(
  {
    title: Type.Optional(Type.String({ minLength: 1 })),
    description: Type.Optional(Type.String()),
    assignee: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const MoveCardBody = Type.Object(
  {
    columnId: ColumnIdSchema,
    order: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);

const CardIdParam = Type.Object({ id: Type.String() });
const ErrorBody = Type.Object({ error: Type.String() });
const OkBody = Type.Object({ ok: Type.Boolean() });

type CreateCardBody = Static<typeof CreateCardBody>;
type UpdateCardBody = Static<typeof UpdateCardBody>;
type MoveCardBody = Static<typeof MoveCardBody>;
type CardIdParam = Static<typeof CardIdParam>;

// ── App factory ───────────────────────────────────────────────────────────────

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(cors, { origin: true });
  app.register(websocket);

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get(
    '/health',
    { schema: { response: { 200: Type.Object({ status: Type.String() }) } } },
    async () => ({ status: 'ok' }),
  );

  // ── WebSocket ───────────────────────────────────────────────────────────────
  app.register(async (scope) => {
    scope.get('/ws', { websocket: true }, handleWsConnection);
  });

  // ── REST: board ─────────────────────────────────────────────────────────────
  app.get(
    '/api/board',
    { schema: { response: { 200: BoardSchema } } },
    async () => store.getBoard(),
  );

  // ── REST: create card ───────────────────────────────────────────────────────
  app.post(
    '/api/cards',
    { schema: { body: CreateCardBody, response: { 201: CardSchema } } },
    async (req, reply) => {
      const card = store.createCard(req.body);
      broadcast({ type: 'card:created', card });
      return reply.status(201).send(card);
    },
  );

  // ── REST: update card ───────────────────────────────────────────────────────
  app.patch(
    '/api/cards/:id',
    {
      schema: {
        params: CardIdParam,
        body: UpdateCardBody,
        response: { 200: CardSchema, 404: ErrorBody },
      },
    },
    async (req, reply) => {
      const card = store.updateCard(req.params.id, req.body);
      if (!card) return reply.status(404).send({ error: 'Card not found' });
      broadcast({ type: 'card:updated', card });
      return card;
    },
  );

  // ── REST: delete card ───────────────────────────────────────────────────────
  app.delete(
    '/api/cards/:id',
    {
      schema: {
        params: CardIdParam,
        response: { 200: OkBody, 404: ErrorBody },
      },
    },
    async (req, reply) => {
      if (!store.deleteCard(req.params.id)) {
        return reply.status(404).send({ error: 'Card not found' });
      }
      broadcast({ type: 'card:deleted', cardId: req.params.id });
      return { ok: true };
    },
  );

  // ── REST: move card ─────────────────────────────────────────────────────────
  app.patch(
    '/api/cards/:id/move',
    {
      schema: {
        params: CardIdParam,
        body: MoveCardBody,
        response: { 200: CardSchema, 400: ErrorBody, 404: ErrorBody },
      },
    },
    async (req, reply) => {
      const { columnId, order } = req.body;
      if (!isValidColumnId(columnId)) {
        return reply.status(400).send({ error: 'Invalid columnId' });
      }
      const card = store.moveCard(req.params.id, columnId, order);
      if (!card) return reply.status(404).send({ error: 'Card not found' });
      broadcast({ type: 'card:moved', cardId: card.id, columnId: card.columnId, order: card.order });
      return card;
    },
  );

  return app as unknown as FastifyInstance;
}
