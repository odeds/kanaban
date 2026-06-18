# Kanaban

A real-time collaborative Kanban board (a heavily simplified Trello), built as a test bed for comparing **two different client-side state-management philosophies** against the same UI and backend.

The app is the vehicle; the comparison is the deliverable. See [JOURNAL.md](JOURNAL.md) for the design journal and recommendation, and [`packages/client/src/adapters/README.md`](packages/client/src/adapters/README.md) for the head-to-head between the two state layers.

## What it does

- A single board with three fixed columns: **To Do**, **In Progress**, **Done**
- Cards with a title, description, and assignee
- Create, edit, delete, and move cards (move via left/right arrow buttons — drag-and-drop is intentionally out of scope)
- Real-time sync: every change fans out to all connected clients over WebSockets
- Presence: a live indicator of who is connected, plus an all-time user list used by the assignee picker
- Optimistic updates: local actions render immediately, before the server confirms

## Quick start

### Option A — Docker (full stack in one command)

```bash
docker-compose up
```

- Client: http://localhost:3000
- Backend: http://localhost:3001

### Option B — Local dev (hot reload)

```bash
npm install
npm run dev
```

`npm run dev` runs backend and client together via `concurrently`:

- Client (Vite): http://localhost:5173
- Backend (Fastify): http://localhost:3001

To see real-time sync and presence, open the client in **two browser windows/tabs**.

## Switching state-management implementations

The state layer is selected at build/dev time with the `VITE_STATE_ADAPTER` environment variable. The UI and backend client are identical across both.

```bash
# Zustand (default — no variable needed)
npm run dev

# Redux Toolkit
VITE_STATE_ADAPTER=redux npm run dev
```

| Value | Adapter | Philosophy |
|---|---|---|
| _(unset)_ / `zustand` | Zustand | State is just data — mutate it directly |
| `redux` | Redux Toolkit | State changes are named, inspectable events |

The active adapter is shown as a badge next to the board title so you can confirm which one is running. A pre-wired `client-redux` profile also exists in `.claude/launch.json` for the preview tooling.

## Architecture: commands over REST, events over WebSocket

The transport deliberately splits writes from real-time notification:

- **Client → Server (writes):** plain REST calls (`POST`/`PATCH`/`DELETE /api/cards/...`). The client never sends mutations over the socket.
- **Server → Client (events):** the server applies the mutation to its in-memory store, then **broadcasts** the resulting event to every connected client over the WebSocket. The originating client reconciles the broadcast against its optimistic state.

This keeps the request/response path simple (standard HTTP semantics, easy to test with `curl`) while the socket is a pure one-way event stream. The user identity is assigned **by the server** on connect, so a user persists in the all-time list even after disconnecting.

State is held **in memory** on the server. There is no database; restarting the backend resets the board. This is per the brief.

## WebSocket event protocol

Clients connect to `ws://localhost:3001/ws`. On connect the server assigns an identity and pushes the current board and presence. All subsequent messages are **server → client**; the client does not emit over the socket.

### Server → client messages (`ServerMessage`)

| `type` | Payload | When |
|---|---|---|
| `session:init` | `{ userId: string }` | Once, on connect — the server-assigned identity for this client |
| `board:state` | `{ board: Board }` | Once, on connect — full board snapshot |
| `users:update` | `{ userIds: string[] }` | All-time users (online or not); drives the assignee picker |
| `presence:update` | `{ userIds: string[] }` | Currently-connected users; drives the presence bar |
| `card:created` | `{ card: Card }` | A card was created |
| `card:updated` | `{ card: Card }` | A card's title/description/assignee changed |
| `card:deleted` | `{ cardId: string }` | A card was deleted |
| `card:moved` | `{ cardId: string, columnId: ColumnId, order: number }` | A card moved column/position |

`presence:update` is re-broadcast when anyone connects or disconnects; `users:update` grows as new identities appear and never shrinks.

> Note: a `ClientMessage` union and an inbound socket handler exist on the backend from an earlier iteration, but the current client performs all mutations over REST. The inbound handler is unused by this client and kept only as a reference for a socket-first variant.

### REST endpoints

Mutations and the initial fetch go over HTTP. Each successful write triggers the matching WebSocket broadcast above.

| Method | Path | Body | Purpose |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check → `{ status: "ok" }` |
| `GET` | `/api/board` | — | Full board snapshot (columns + cards) |
| `POST` | `/api/cards` | `{ title, description, assignee, columnId }` | Create a card → broadcasts `card:created` |
| `PATCH` | `/api/cards/:id` | `{ title?, description?, assignee? }` | Edit a card → broadcasts `card:updated` |
| `DELETE` | `/api/cards/:id` | — | Delete a card → broadcasts `card:deleted` |
| `PATCH` | `/api/cards/:id/move` | `{ columnId, order }` | Move a card → broadcasts `card:moved` |

### Core types

```ts
type ColumnId = 'todo' | 'in-progress' | 'done';

interface Card {
  id: string;
  title: string;
  description: string;
  assignee: string;
  columnId: ColumnId;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

Types and their schemas live in `@kanaban/shared` (TypeBox), so the client and backend share a single source of truth across the wire.

## Monorepo layout

npm workspaces, three packages under `packages/`:

| Package | Role |
|---|---|
| `@kanaban/shared` | Types + WS/REST schemas consumed by both sides |
| `@kanaban/backend` | Fastify server: REST endpoints, WebSocket fan-out, in-memory store |
| `@kanaban/client` | React + Vite + Tailwind UI, with swappable state adapters |

## Commands

Run from the repo root:

```bash
npm install        # install all workspace deps
npm run dev        # backend + client with hot reload
npm run build      # build all packages
npm run typecheck  # type-check all packages
npm run test       # run all tests
npm run lint       # lint all packages
```

## Tech stack

- **Backend:** Node.js, Fastify, `@fastify/websocket`, TypeBox (chosen over Express for real-time performance; over Hono since this isn't an edge/serverless target)
- **Client:** Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui + Base UI primitives
- **State adapters:** Zustand, Redux Toolkit
- **Tests:** Vitest + Testing Library

## Assumptions & scope

Out of scope per the brief and not implemented: authentication, drag-and-drop, conflict resolution / server rejection, multiple boards, persistence across restarts, and mobile-responsive design. Identity is a server-assigned `user-xxxxxx` id with no login.
