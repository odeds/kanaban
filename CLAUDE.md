# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Home assignment: build a **real-time collaborative Kanban board** (simplified Trello) and use it as a vehicle to compare **2–3 different client-side state management approaches**. The comparison study is the main deliverable, not the app itself.

**Required features:** single board, three fixed columns (To Do / In Progress / Done), cards (title + description + assignee), create/edit/delete/move cards, real-time sync over WebSockets, presence indicator, optimistic updates.

**Out of scope:** auth, drag-and-drop, conflict resolution, persistence across restarts, multiple boards, mobile.

**Key constraint:** state layer must be implemented 2–3 times with meaningfully different philosophies, switchable via env var / build flag / route. UI layer and backend client are shared across implementations.

Progress and decisions are documented in [JOURNAL.md](JOURNAL.md) — update it whenever a meaningful decision is made.

## Monorepo structure

npm workspaces with three packages under `packages/`:

| Package | Scope | Role |
|---|---|---|
| `shared` | `@kanaban/shared` | Types and utilities consumed by both client and backend |
| `backend` | `@kanaban/backend` | Node.js server; depends on `@kanaban/shared` |
| `client` | `@kanaban/client` | Frontend app; depends on `@kanaban/shared` |

Cross-package imports use the workspace protocol (`"@kanaban/shared": "*"` in `package.json`). npm resolves these to symlinks in `node_modules`.

## Commands

Run from the repo root unless noted.

```bash
npm install              # install all workspace deps
npm run build            # build all packages
npm run typecheck        # type-check all packages (no emit)
npm run test             # run all tests
npm run lint             # lint all packages
```

Single-package operations (from root):
```bash
npm run build -w packages/shared
npm run typecheck -w packages/client
npm test -w packages/backend -- --testPathPattern=foo
```

Or `cd` into a package and run scripts directly.

## TypeScript setup

`tsconfig.base.json` at root holds shared compiler options. Each package has its own `tsconfig.json` that extends it and adds:
- `outDir`, `rootDir`, `module`, `target` (package-specific)
- Client uses `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"` (bundler-first)
- Backend and shared use `module: "CommonJS"`, `target: "ES2020"` (Node.js)

## Journaling

Every step / PR should have a corresponding entry in [JOURNAL.md](JOURNAL.md). Use the `/journal` skill to append a new entry with the correct format, time, and decisions.

## Docker

```bash
docker-compose up          # build and start backend (port 3001) + client (port 3000)
docker-compose up backend  # start only the backend
```

Both Dockerfiles use the monorepo root as build context (required for access to `packages/shared`). They live at `packages/backend/Dockerfile` and `packages/client/Dockerfile`.

## CI

`.github/workflows/ci.yml` — runs `npm ci` on every push/PR. Add `typecheck`, `lint`, and `test` steps as those scripts are wired up.

## Conventions

- **One PR per step** — keep diffs focused and reviewable.
- **Decisions go in JOURNAL.md, not in code comments** — trade-off reasoning lives in the journal, not inline.
- **`shared` is the source of truth for types** — don't duplicate type definitions between client and backend.
- **State layer lives only in `client`** — backend and shared are not aware of which state approach is active.
