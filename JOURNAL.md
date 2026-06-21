# Project Journal

A running log of decisions and reflections made throughout the project.
Each entry corresponds to a step or PR.

---

## Step 1 — Research & Planning

**Date:** 2026-06-17 *(pre-repo)*
**Duration:** ~15 min
**PR:** —

Before opening the repo I had a conversation with ChatGPT to think through the task and get a feel for the state management comparison. The main question was which approaches would make for a meaningful comparison — different enough in philosophy to surface real trade-offs, but all realistic choices for a production app. The session helped narrow down the candidate libraries and frame what "different philosophy" actually means in this context.

---

## Step 2 — Monorepo Bootstrap

**Date:** 2026-06-17
**Duration:** ~15 min
**PR:** [#1](https://github.com/odeds/kanaban/pull/1)

Set up the monorepo with three npm workspace packages — `backend`, `client`, and `shared` — along with a root `tsconfig.base.json`, Docker support, and a basic CI workflow. The goal was a solid foundation to build on rather than anything functional. Also added the `/journal` skill so future steps can be logged consistently.

---

## Step 3 — Backend & Client Stack Setup

**Date:** 2026-06-17
**Duration:** ~15 min
**PR:** [#2](https://github.com/odeds/kanaban/pull/2)

Decided on the tech stack for backend and client. Chose Fastify for the backend because it performs well for real-time use cases and has stronger community support than Express. Considered Hono but ruled it out — it excels in edge and serverless environments, which isn't the target here, so Fastify was the better fit. On the client side, went with Vite + React + Tailwind CSS v4, with shadcn/ui for components and Base UI for headless primitives.

---

## Step 4 — Data Layer & WebSocket Bridge
**Date:** 2026-06-17
**Duration:** ~1h 15min
**PR:** [#3](https://github.com/odeds/kanaban/pull/3)

This step focused on adding the data layer to the backend and wiring up WebSocket communication between client and server, with minimal tests covering the critical paths. I also updated the `shared` package to use TypeBox for both sides of the wire, so schema definitions aren't duplicated between client and backend.

---

## Step 5 — Shared UI Components
**Date:** 2026-06-17
**Duration:** ~30 min
**PR:** [#4](https://github.com/odeds/kanaban/pull/4)

This step focused on building the shared UI layer that the state adapters will consume. The components are intentionally dumb — they receive data and callbacks via props and hold no app state of their own. For card movement, I chose left/right arrow buttons rather than drag-and-drop, since drag-and-drop is explicitly out of scope. Alongside the board components, I installed the building blocks they rely on: shadcn/ui for styled atoms and Base UI for accessible, aria-compatible headless primitives. I also skipped Storybook — in my experience it tends to go unused, and with LLMs it's trivial to generate component stories later if they're ever needed.

---

## Step 6 — Zustand State Adapter
**Date:** 2026-06-17
**Duration:** ~45 min
**PR:** [#5](https://github.com/odeds/kanaban/pull/5)

This step introduced the adapter infrastructure that all state implementations will plug into, then replaced the placeholder stub with a real Zustand adapter. I chose Zustand as the first adapter because it keeps state management close to its simplest possible form — state is just data, and updates are plain function calls. There's no ceremony around actions, reducers, or subscriptions; the store is a flat object you read and mutate directly. That makes it a useful baseline: easy to reason about, and a clean reference point for comparing the approaches that follow.

---

## Step 7 — Redux State Adapter
**Date:** 2026-06-18
**Duration:** ~45 min
**PR:** [#6](https://github.com/odeds/kanaban/pull/6)

This step had two parts: implementing the Redux adapter and auditing what could be shared between adapters. The Redux implementation uses Redux Toolkit — a slice with named reducers for every server message type, plain thunks for mutations, and a self-contained `<ReduxAdapter>` component that owns its own `<Provider>`. The named actions are the point: unlike Zustand, every state change is an identifiable event in the action log.

The reuse audit turned up more duplication than expected. `EMPTY_COLUMNS`, `generateUserId`, the REST fetch calls, the `card:moved` reordering algorithm, and the transport `useEffect` pattern were all identical across both adapters. These were extracted into shared files — `columnUtils.ts`, `constants.ts`, `lib/api.ts`, and `useTransportEffect.ts` — so adapters only contain code that's actually specific to their state management philosophy. The reordering logic also got unit tests since it's the most algorithmic piece.

---

## Step 8 — UI/UX Polish, Testing & Docs
**Date:** 2026-06-18
**Duration:** ~2 hr
**PR:** [#7](https://github.com/odeds/kanaban/pull/7)

With both adapters working, I spent a session on UI/UX improvements, correctness fixes, manual testing, and documentation. On the UX side I switched the card assignee from a free-text input to a dropdown of real users, moved user-ID generation from the client to the server, and added localStorage persistence for userId so identity survives a page refresh — the client sends the stored id as a query param on connect, and the server reuses it if it recognises it. I also reworked the theme to a clean light palette with subtle color accents, centered the board in a max-width container, enlarged the move arrows and split them to opposite sides of each card, and added tooltips to the icon buttons. I manually tested the full real-time flow across two browser windows — create, edit, delete, move, presence, and optimistic updates all syncing live. I finished by drafting the README and adding unit tests for `PresenceManager`: the `generate(hint?)` logic has a real behavioral branch worth pinning — reuse a known user or generate fresh. Scope was kept deliberately narrow: test the algorithmic pieces that are easy to break silently, skip the plumbing.

---

## Step 9 — Redux Saga Adapter
**Date:** 2026-06-21
**Duration:** ~1 hr
**PR:** [#8](https://github.com/odeds/kanaban/pull/8)

In this step I added a third state adapter using Redux Saga (`VITE_STATE_ADAPTER=saga`). The core refactor was pulling the RTK slice into a shared `redux/slice.ts` consumed by both Redux adapters — reducers are identical regardless of how effects are orchestrated, so there was no reason to duplicate them. I then restructured `adapters/redux/` into `thunks/` and `saga/` sub-folders. The adapter selection in App.tsx is now lazy-loaded, since it's determined at build time via an env var and only one bundle is ever needed. I also extracted the `resolveMove` logic that was duplicated across all three adapters into a shared helper, and added unit tests for it along with `makeBoard`.

---

## Closing Remarks — Comparison & Recommendation

For this app, I'd choose Zustand. The board's state is small — a card dictionary, three ordered id-lists, two user lists, and a status flag — and the dominant pattern is optimistic-update-then-reconcile against the WebSocket broadcast. Zustand expresses that as a direct `set()` with manual rollback in a `try/catch`. Redux Toolkit models the same flow as a pair of named actions (an optimistic action, then the WS echo), which buys an inspectable action log and time-travel debugging but costs boilerplate — a slice, a reducer per message type, middleware, and a Provider — that this app's complexity doesn't repay.

The most interesting structural finding from having three adapters is that Thunks and Saga share an *identical* `slice.ts`. Reducers are pure state transitions that don't care how side effects are orchestrated, so the entire Thunks → Saga swap happens purely in the effects layer. That reframes the comparison: Thunks and Saga are different answers to "how should effects be structured?", while Zustand is a different answer to "should state and effects be separated at all?"

The recommendation flips to Redux once the async gets hard: cancel an in-flight request when the user types again, retry with backoff, run a multi-step workflow and roll back everything on failure. That's exactly where Saga's `takeLatest`/`race`/cancellation turn 50 lines of fragile hand-rolled logic into 3 declarative lines. Thunks remain the middle ground — Redux's structure and DevTools without generators. Saga earns its complexity only when the effects do.

A few honest trade-offs I noticed while building. First, Zustand's manual rollback is easy to get subtly wrong — every optimistic mutation has to capture the previous state and restore it on failure; Redux centralizes that discipline but doesn't eliminate it. Second, the Steps 7 (and also 9) reuse audit showed roughly half of each adapter was identical plumbing — REST calls, the reordering algorithm, the transport effect, shared constants — so the genuinely philosophy-specific code is small. That's a finding in itself: for an app this size, the state library is a smaller decision than it first appears. Third, Redux's value here is observability, not correctness — all three adapters produce identical UI behavior.
