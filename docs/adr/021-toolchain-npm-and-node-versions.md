# ADR-021: Toolchain — npm, Node 24 deployed, Node 26 locally

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** amends [ADR-002](./002-single-nextjs-app-node-runtime.md)

## Context

The development machine runs Node 26.1.0 with npm 11 and has neither pnpm nor corepack; corepack is no longer bundled from Node 25. Vercel Functions support Node 24.x (the default), 22.x and 20.x. Node 26 is available only in Vercel Sandboxes.

## Decision

- Use **npm** as the package manager, with a committed `package-lock.json`.
- Deploy and run CI on **Node 24** (`engines: { "node": "24.x" }`).
- Local development may use Node 26, so code must not use APIs newer than Node 24. CI on Node 24 catches drift.

## Alternatives considered

- **Install pnpm and Node 24 locally**: exact parity, but extra setup inside a 24-hour window.
- **Host somewhere that runs Node 26**: would leave Vercel, which everything else assumes.

## Consequences

Zero local setup. A small risk of Node-version drift, covered by CI.

## Revisit when

Vercel supports Node 26 for Functions (move everything to 26), or drift causes a bug.
