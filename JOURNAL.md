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
**PR:** *(TBD)*

This step focused on adding the data layer to the backend and wiring up WebSocket communication between client and server, with minimal tests covering the critical paths. I also updated the `shared` package to use TypeBox for both sides of the wire, so schema definitions aren't duplicated between client and backend.

---

## Step 5 — Shared UI Components
**Date:** 2026-06-17
**Duration:** ~30 min
**PR:** [#4](https://github.com/odeds/kanaban/pull/4)

This step focused on building the shared UI layer that the state adapters will consume. The components are intentionally dumb — they receive data and callbacks via props and hold no app state of their own. For card movement, I chose left/right arrow buttons rather than drag-and-drop, since drag-and-drop is explicitly out of scope. Alongside the board components, I installed the building blocks they rely on: shadcn/ui for styled atoms and Base UI for accessible, aria-compatible headless primitives. I also skipped Storybook — in my experience it tends to go unused, and with LLMs it's trivial to generate component stories later if they're ever needed.

---
