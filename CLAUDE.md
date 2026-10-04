# CLAUDE.md

@AGENTS.md

`AGENTS.md` (imported above) is the single source of truth for this repo: product, stack, modules,
architecture rules, standards, commands and process. Do not duplicate its content here.
If you cannot see its contents, stop and read `AGENTS.md` before doing anything else.

## Claude Code specifics

- **Plan per slice.** Follow `docs/plan.md`. Post each slice's plan (files, responsibilities, tests) as a
  chat message, wait for the user's typed approval, then build the whole slice. Ask any decision that
  belongs to the user through AskUserQuestion popups.
- **Stay in scope.** Do exactly the task asked. If you notice something else worth changing, list it
  at the end as a suggestion instead of doing it.
- **Verify, don't assume.** After changes, run `npm run lint && npm run typecheck && npm test`, and
  `npm run test:integration` when touching the credits money path or a repository's SQL.
  Report the results honestly, including failures.
- **Library APIs.** For Better Auth, Inngest, fal.ai, OpenAI, Drizzle, TanStack Query and Next.js 16, check
  the installed version's docs/types instead of relying on memory. Never invent fal or OpenAI model IDs; use
  only the IDs in the routing module's registry and `DIRECTOR_MODEL`.
- **Git.** One logical change per commit and Conventional Commit messages. Never let a formatter or
  linter touch `.claude/`. Never commit secrets or `.env*` files, and never ask for keys in chat.
  Never force-push.
- **Summaries.** End each task with: what changed (files), how it was verified, and any follow-ups.
