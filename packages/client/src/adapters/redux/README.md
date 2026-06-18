# Redux Adapter

Real-time board state implemented with [Redux Toolkit](https://redux-toolkit.js.org/) (RTK) and [React Redux](https://react-redux.js.org/).

## Files

| File | Role |
|---|---|
| `store.ts` | RTK slice (reducers), thunk action creators, module-level store, `initTransport` |
| `types.ts` | `AppThunk` type shared across the adapter |
| `useReduxAdapter.ts` | Inner hook — `useDispatch` + `useSelector` + transport init |
| `ReduxAdapter.tsx` | Self-contained component — wraps `<Board>` in `<Provider store={store}>` |

## How it works

1. `<ReduxAdapter>` renders a `<Provider>` that makes the store available to the React tree, then renders `<ReduxBoard>` which calls `useReduxAdapter`.
2. `useReduxAdapter` mounts → calls `initTransport()` in a `useEffect`.
3. `initTransport` opens the WebSocket, subscribes to incoming messages, and dispatches `applyServerMsg(msg)` for each one. On connect it also dispatches the `presence:join` message.
4. `applyServerMsg` is a thunk that switches on `msg.type` and dispatches a **named slice action** for each event type — `board/cardCreated`, `board/cardMoved`, etc. Every event is a distinct entry in the action log.
5. Mutations (`createCard`, `updateCard`, `deleteCard`, `moveCard`) are plain thunks. Optimistic mutations first dispatch an `*Optimistic` action (e.g. `board/cardUpdatedOptimistic`), call the REST API, and dispatch a rollback action on failure. The action log records the full sequence.

### Action flow

```
UI
 ↓ dispatch(updateCard(id, values))
Thunk
 ↓ dispatch(board/cardUpdatedOptimistic)  ← immediate UI update
 ↓ fetch PATCH /api/cards/:id
 ↓ (success) — WS echo arrives → dispatch(board/cardUpdated)  ← authoritative update
 ↓ (error)   — dispatch(board/cardUpdated) with prev value    ← rollback
```

## Pros

**Auditable action log** — every state change is a named, inspectable event. Redux DevTools shows `board/cardCreated`, `board/cardMovedOptimistic`, etc. with the full payload.

**Predictable state transitions** — reducers are pure functions; given the same action sequence you always get the same state. Easy to reason about and reproduce bugs.

**Standardised optimistic/rollback pattern** — optimistic and rollback actions are named and appear in the log, making failure paths visible in DevTools.

**Time-travel debugging** — Redux DevTools can replay or rewind the action sequence to reproduce any board state.

**Middleware interception** — any dispatch can be intercepted by middleware (logging, analytics, permissions) without touching the reducer or the UI.

**Testable reducers** — reducers are pure functions; you can test every transition in isolation without a React tree.

## Cons

**Provider required** — unlike Zustand's module singleton, Redux requires a `<Provider>` in the React tree. This is by design (explicit dependency injection) but adds a wrapper component.

**More files and boilerplate** — a slice, action types, thunks, and typed hooks where Zustand achieves the same in a single `create()` call.

**Optimistic update pattern is less obvious** — dispatching an `*Optimistic` action, then a separate rollback action, requires discipline. Zustand's snapshot-and-restore is more direct.

**Immer is built in but not free** — the slice uses Immer's mutable style inside reducers, which is convenient but means reducers must never return a new value *and* mutate — one or the other.
