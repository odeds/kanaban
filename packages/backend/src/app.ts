import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
