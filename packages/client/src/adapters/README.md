# State Adapters

This folder contains multiple implementations of the same board state, each using a different state management philosophy. The UI layer (`<Board>` and its children) is shared and knows nothing about which adapter is active.

## Adapters

| Folder | Library | Philosophy |
|---|---|---|
| `zustand/` | [Zustand](https://github.com/pmndrs/zustand) | State is just data — update it directly |
| `redux/thunks/` | [Redux Toolkit](https://redux-toolkit.js.org/) | Named actions → reducers; async side effects as thunk closures |
| `redux/saga/` | [Redux Toolkit](https://redux-toolkit.js.org/) + [Redux Saga](https://redux-saga.js.org/) | Same RTK store; async side effects as declarative generator sagas |

The two Redux variants share a single slice definition at `redux/slice.ts`. Each adapter folder has its own README with implementation details, pros, and cons.

## Switching adapters

Set `VITE_STATE_ADAPTER` at dev/build time:

```bash
# Zustand (default — no variable needed)
npm run dev -w packages/client

# Redux + Thunks
VITE_STATE_ADAPTER=thunks npm run dev -w packages/client

# Redux + Saga
VITE_STATE_ADAPTER=saga npm run dev -w packages/client
```

## Core philosophies

**Zustand** asks: *"What should the state be?"*

```ts
moveCard(cardId, direction);
// → set({ cards: ..., columnCardIds: ... })
```

**Redux Thunks** asks: *"What event just happened?"* and runs async logic as closures:

```ts
dispatch(moveCard(cardId, direction));
// → dispatch(board/cardMovedOptimistic)   ← thunk fires directly
// → dispatch(board/cardMoved)             ← WS echo arrives
```

**Redux Saga** asks the same question but runs async logic as generator sagas:

```ts
dispatch({ type: 'saga/moveCard', payload });
// → saga intercepts → yield put(board/cardMovedOptimistic)
// → yield call(api.moveCard, ...)
// → channel emits board/cardMoved via yield take()
```

## Shared infrastructure

| File | Purpose |
|---|---|
| `types.ts` | `AdapterState` contract — the interface `<Board>` consumes |
| `useTransportEffect.ts` | Hook that initialises transport on mount and tears it down on unmount |
| `redux/slice.ts` | RTK slice shared by both Redux adapters — reducers live here, effects don't |
