import type { RawData, WebSocket } from 'ws';
import { ServerMessage } from '@kanaban/shared';

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket): void {
  clients.add(ws);
}

export function removeClient(ws: WebSocket): void {
  clients.delete(ws);
}

export function broadcast(msg: ServerMessage): void {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(data);
    }
  }
}

export function sendTo(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(msg));
  }
}

export type { RawData, WebSocket };
