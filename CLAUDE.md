# CLAUDE.md

@AGENTS.md

`AGENTS.md` (imported above) is the single source of truth for this repo: product, stack, modules,
architecture rules, standards, commands and process. Do not duplicate its content here.
If you cannot see its contents, stop and read `AGENTS.md` before doing anything else.

## Claude Code specifics

- **Plan first.** For any task touching more than 2 files, use plan mode (or write a short plan listing
  files, responsibilities and tests) and wait for approval before editing.
- **Stay in scope.** Do exactly the task asked. If you notice something else worth changing, list it
  at the end as a suggestion instead of doing it.
- **Verify, don't assume.** After changes, run `pnpm lint && pnpm typecheck && pnpm test`, and
  `pnpm test:integration` when touching credits, production, identity merge or repositories.
  Report the results honestly, including failures.
- **Library APIs.** For Better Auth, Inngest, fal.ai, Drizzle, TanStack Query and Next.js, check the
  installed version's docs/types instead of relying on memory. Never invent fal model IDs; use only
  the IDs in the routing module's registry.
- **Git.** One logical change per commit, Conventional Commit messages, and `.agent-logs/` staged in
  every commit. Never commit secrets or `.env*` files. Never force-push.
- **Summaries.** End each task with: what changed (files), how it was verified, and any follow-ups.
