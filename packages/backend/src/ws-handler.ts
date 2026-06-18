import type { FastifyRequest } from 'fastify';
import type { RawData, WebSocket } from './broadcast';
import { ClientMessage, isValidColumnId } from '@kanaban/shared';
import { store } from './store';
import { presence } from './presence';
import { addClient, removeClient, broadcast, sendTo } from './broadcast';

export function handleWsConnection(socket: WebSocket, _req: FastifyRequest): void {
  addClient(socket);

  const userId = presence.generate();

  // Tell this client its assigned identity
  sendTo(socket, { type: 'session:init', userId });
  // Send current board state
  sendTo(socket, { type: 'board:state', board: store.getBoard() });
  // Send all-time user list and current online presence
  sendTo(socket, { type: 'users:update', userIds: presence.getAllUsers() });
  sendTo(socket, { type: 'presence:update', userIds: presence.getOnlineUsers() });

  // Broadcast updated lists to everyone else
  broadcast({ type: 'users:update', userIds: presence.getAllUsers() });
  broadcast({ type: 'presence:update', userIds: presence.getOnlineUsers() });

  socket.on('message', (rawData: RawData) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(rawData.toString()) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'card:create': {
        const card = store.createCard({
          title: msg.title,
          description: msg.description,
          assignee: msg.assignee,
          columnId: msg.columnId,
        });
        broadcast({ type: 'card:created', card });
        break;
      }

      case 'card:update': {
        const card = store.updateCard(msg.cardId, {
          title: msg.title,
          description: msg.description,
          assignee: msg.assignee,
        });
        if (card) broadcast({ type: 'card:updated', card });
        break;
      }

      case 'card:delete': {
        if (store.deleteCard(msg.cardId)) {
          broadcast({ type: 'card:deleted', cardId: msg.cardId });
        }
        break;
      }

      case 'card:move': {
        if (!isValidColumnId(msg.columnId)) break;
        const card = store.moveCard(msg.cardId, msg.columnId, msg.order);
        if (card) {
          broadcast({
            type: 'card:moved',
            cardId: card.id,
            columnId: card.columnId,
            order: card.order,
          });
        }
        break;
      }
    }
  });

  socket.on('close', () => {
    removeClient(socket);
    presence.leave(userId);
    broadcast({ type: 'presence:update', userIds: presence.getOnlineUsers() });
  });
}
