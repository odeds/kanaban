# State Adapters

This folder contains multiple implementations of the same board state, each using a different state management philosophy. The UI layer (`<Board>` and its children) is shared and knows nothing about which adapter is active.

## Adapters

| Folder | Library | Philosophy |
|---|---|---|
| `zustand/` | [Zustand](https://github.com/pmndrs/zustand) | State is just data — update it directly |
| `redux/` | [Redux Toolkit](https://redux-toolkit.js.org/) | State changes are named events — dispatch an action, run a reducer |

Each adapter folder has its own README with implementation details, pros, and cons.

## Switching adapters

Set `VITE_STATE_ADAPTER` at dev/build time:

```bash
# Zustand (default — no variable needed)
npm run dev -w packages/client

# Redux
VITE_STATE_ADAPTER=redux npm run dev -w packages/client
```

## Zustand vs Redux — core philosophy

**Zustand** asks: *"What should the state be?"*

```ts
moveCard(cardId, direction);
// → set({ cards: ..., columnCardIds: ... })
```

You describe the desired state. The "why" lives only in the call stack.

**Redux** asks: *"What event just happened?"*

```ts
dispatch(moveCard(cardId, direction));
// → dispatch(board/cardMovedOptimistic)
// → dispatch(board/cardMoved)  ← from WS echo
```

Every change is a named, inspectable action. The action log tells the story of what happened without reading the code.

### When Redux pays off

- You need an audit trail (who moved what, when)
- You want time-travel debugging via Redux DevTools
- Middleware needs to intercept mutations (analytics, permissions, logging)
- Multiple teams contribute to the same state

### When Zustand pays off

- State is simple: a few collections and some UI flags
- Optimistic updates are the norm and manual rollback is acceptable
- You want minimal boilerplate
- No Provider setup required

## Shared infrastructure

| File | Purpose |
|---|---|
| `types.ts` | `AdapterState` contract — the interface `<Board>` consumes |
| `useTransportEffect.ts` | Shared hook that initialises transport on mount and tears it down on unmount |
