import type { ClientMessage, ServerMessage } from '@kanaban/shared';

type MessageHandler = (msg: ServerMessage) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'reconnecting') => void;

class WsTransport {
  private ws: WebSocket | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1_000;
  private shouldReconnect = false;

  private activeUrl: string;

  constructor(private readonly url: string) {
    this.activeUrl = url;
  }

  connect(userId?: string): void {
    this.shouldReconnect = true;
    this.activeUrl = userId ? `${this.url}?userId=${encodeURIComponent(userId)}` : this.url;
    this.openConnection();
  }

  private openConnection(): void {
    const ws = new WebSocket(this.activeUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 1_000;
      this.notify('connected');
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.messageHandlers.forEach((h) => h(msg));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      this.notify('disconnected');
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private scheduleReconnect(): void {
    this.notify('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
      this.openConnection();
    }, this.reconnectDelay);
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Subscribe to server messages. Returns an unsubscribe function. */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** Subscribe to connection status changes. Returns an unsubscribe function. */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        // Closing a CONNECTING socket triggers a browser warning; defer until open.
        ws.onopen = () => ws.close();
      } else {
        ws.onopen = null;
        ws.close();
      }
    }
  }

  private notify(status: Parameters<StatusHandler>[0]): void {
    this.statusHandlers.forEach((h) => h(status));
  }
}

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws';

export const wsTransport = new WsTransport(WS_URL);
