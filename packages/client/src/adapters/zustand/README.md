# Zustand Adapter

Real-time board state implemented with [Zustand](https://github.com/pmndrs/zustand).

## Files

| File | Role |
|---|---|
| `store.ts` | Zustand store — state shape, `applyServerMsg`, mutations, transport init |
| `useZustandAdapter.ts` | Hook that wires the store to the `AdapterState` contract consumed by `<Board>` |

## How it works

1. `useZustandAdapter` mounts → calls `initTransport()` inside a `useEffect`.
2. `initTransport` opens the WebSocket, registers `applyServerMsg` as the message handler, and sends `presence:join` on connect (and on every reconnect).
3. Mutations (`createCard`, `updateCard`, `deleteCard`, `moveCard`) call the REST API. `updateCard`/`deleteCard`/`moveCard` apply an **optimistic update first** and roll back on fetch error. `createCard` skips optimism — the new card arrives authoritatively via the `card:created` WebSocket broadcast.
4. Every server broadcast (including the echo back to the originating client) goes through `applyServerMsg`, which applies the authoritative state. Optimistic values are overwritten cleanly on the next server event.

## Pros

**Simple mental model** — `set()` is the only primitive. No actions, reducers, or action-creator factories. Each WebSocket event maps to one `set()` call.

**Optimistic updates are natural** — update state immediately, call the REST API, roll back with another `set()` if the request fails. No middleware or saga needed.

**No Provider required** — the store is a module-level singleton. Transport can be initialised outside the React tree; the hook just subscribes.

**Selective re-renders** — components subscribe to state slices via selectors, so a presence update does not re-render the card list.

**Rich middleware** — `devtools` wires every named `set()` call into Redux DevTools for time-travel inspection. `immer` and `subscribeWithSelector` are available if needed.

**Tiny footprint** — ~2 KB gzip. Zero runtime dependencies beyond React.

## Cons

**Manual rollback** — there is no framework concept of "pending" vs "committed" state. You must snapshot before mutation and restore on error; it is easy to miss edge cases.

**No server reconciliation** — when the server echoes `card:created` back to the originating client, you must handle the duplicate (here: `createCard` is intentionally non-optimistic to avoid temp-ID complexity).

**No conflict detection** — two clients editing the same card simultaneously results in a silent last-write-wins; the store has no merge logic.

**Singleton pitfalls** — Vitest, HMR, and multiple tabs all share the same module instance. Tests must reset the store between runs (`store.setState(initialState)`).

**Subscription leak risk** — `wsTransport.subscribe()` must be cleaned up in the `useEffect` return. React StrictMode's double-invoke exercises this path, which helps catch leaks in development.

**Weak action history** — Redux DevTools integration works, but WebSocket events only appear as named `set()` calls, not typed actions. The audit trail is thinner than with a Redux action log.
