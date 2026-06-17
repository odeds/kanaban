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
