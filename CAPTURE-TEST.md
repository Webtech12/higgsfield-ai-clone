# Capture test

Status: **green**. Both canaries were captured automatically, prompt and response, in two separate Claude Code sessions.

## Tool and model

- **Tool:** Claude Code 2.1.280, the VS Code extension (`anthropic.claude-code-2.1.280-win32-x64`), on Windows 11.
- **Model:** Claude Opus 5.5, logged as `claude-opus-5-5`. It is configured as `opus[1m]`, the 1M-context variant.
- **Planner vs executor:** one model does both. Opus 5.5 plans and executes in the main conversation. During setup I used one helper subagent for docs research. Subagent traffic is neither a prompt the user typed nor a final response, so it is not captured: the hook ignores any event that carries an `agent_id`.

## Mechanism

Claude Code hooks, configured in **[`.claude/settings.json`](.claude/settings.json)**. That file is committed and loads in every session opened in this repo. Every hook runs the same script, [`.claude/hooks/agent-log.js`](.claude/hooks/agent-log.js), which is plain Node with no dependencies. It is launched in exec form, which spawns `node` directly with the script path as its argument and no shell in between:

```json
{ "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-log.js"], "timeout": 10 }
```

| Hook event | What it writes |
|---|---|
| `UserPromptSubmit` | `PROMPT` entry: the hook's `prompt` field, stored verbatim |
| `Stop` | `RESPONSE` entry: the hook's `last_assistant_message`, which is the final response text only (no thinking, tool calls or intermediate text) |
| `StopFailure` | `RESPONSE` entry recording the API error that ended the turn |
| `SessionEnd` | If the last prompt's turn never reached `Stop`, a `RESPONSE` entry containing a `[capture note]`. The next `UserPromptSubmit` does the same, so an interrupted turn leaves a visible gap rather than silently missing a response. |
| `SessionStart`, `PostModelSwitch` | No entry. They track the session's current model, which `PROMPT` entries use. |

Each `RESPONSE` entry takes its model from the assistant message recorded in the session transcript, so a mid-build model switch, or a one-turn fallback model, is visible per entry. Other details:

- **Timestamps:** UTC ISO-8601.
- **File layout:** one file per session, named `YYYY-MM-DD_HH-MM-SS_<session-id>.md`, in the format from the brief. The frontmatter counters are rewritten on each entry; existing entries are never modified.
- **Line endings:** [`.gitattributes`](.gitattributes) sets `.agent-logs/** -text`, so git's `core.autocrlf` on this Windows machine cannot rewrite logged bytes.
- **Git ignore:** `.agent-logs/` is not gitignored.

## Where the canaries landed

| Canary | Session | Log file |
|---|---|---|
| 1 | `bbda624a` (the setup session) | [`.agent-logs/2026-09-23_11-29-07_bbda624a-a430-411b-82f8-c19e452117b1.md`](.agent-logs/2026-09-23_11-29-07_bbda624a-a430-411b-82f8-c19e452117b1.md), entries `num=2` |
| 2 | `19823e89` (a new conversation tab) | [`.agent-logs/2026-09-23_12-29-34_19823e89-ac49-4d99-b3dc-17e9f0fba66e.md`](.agent-logs/2026-09-23_12-29-34_19823e89-ac49-4d99-b3dc-17e9f0fba66e.md), entries `num=1` |

### Canary 1, raw

````text
[LOG_ENTRY type=PROMPT num=2 session=bbda624a]
timestamp: 2026-09-23T12:21:40.905Z
model: claude-opus-5-5

CAPTURE TEST — 8x assignment, sherwin


[LOG_ENTRY type=RESPONSE num=2 session=bbda624a]
timestamp: 2026-09-23T12:24:02.685Z
model: claude-opus-5-5

Canary 1 has landed. The prompt and the earlier exchange are both in [.agent-logs/2026-09-23_11-29-07_bbda624a-a430-411b-82f8-c19e452117b1.md](.agent-logs/2026-09-23_11-29-07_bbda624a-a430-411b-82f8-c19e452117b1.md), and the hook error log is empty.

| # | Entry | Timestamp (UTC) | Model | How it got there |
|---|---|---|---|---|
| 1 | PROMPT: the setup brief | 11:29:07.348Z | claude-opus-5-5 | Recovered word-for-word from the transcript by its ID, because the hooks were installed mid-turn |
| 1 | RESPONSE: my setup reply | 12:19:46.743Z | claude-opus-5-5 | End-of-turn hook |
| 2 | PROMPT: `CAPTURE TEST — 8x assignment, sherwin` | 12:21:40.905Z | claude-opus-5-5 | Prompt hook, live |

This reply will be written as RESPONSE 2 once this turn ends. I can't confirm that from inside the turn; I'll check it next time.

Two things that looked wrong but aren't:
- **Garbled dash:** when I printed the file through PowerShell, the em dash showed up as `â€”`. That's only how PowerShell displayed it. The raw bytes on disk are the correct character, so the log is exact.
- **Example entries:** the file contains `[LOG_ENTRY … session=3f9c1a20]` lines. Those are the format examples inside your pasted brief, stored as part of prompt 1. They're indented, and the script never reads them as real entries.

Next:
1. Open a **new Claude Code conversation** (new tab) and send `CAPTURE TEST — 8x assignment, sherwin`. That session should create its own log file in `.agent-logs/`.
2. Come back here and say **"canary 2 sent"**. I'll check both files and write `CAPTURE-TEST.md` with both canary entries pasted raw. Then I'll commit it with the logs.

The `author` field still says `sherry`; tell me if your GitHub handle is different.
````

### Canary 2, raw

````text
[LOG_ENTRY type=PROMPT num=1 session=19823e89]
timestamp: 2026-09-23T12:29:34.689Z
model: claude-opus-5-5

CAPTURE TEST — 8x assignment, sherwin


[LOG_ENTRY type=RESPONSE num=1 session=19823e89]
timestamp: 2026-09-23T12:29:50.546Z
model: claude-opus-5-5

The second canary was captured. This session wrote a new log file, [.agent-logs/2026-09-23_12-29-34_19823e89-ac49-4d99-b3dc-17e9f0fba66e.md](.agent-logs/2026-09-23_12-29-34_19823e89-ac49-4d99-b3dc-17e9f0fba66e.md), separate from the first session's file:

- **Entry:** PROMPT 1 in session `19823e89`, at `2026-09-23T12:29:34.689Z`, using model `claude-opus-5-5`.
- **Text:** `CAPTURE TEST — 8x assignment, sherwin`, saved exactly as typed, em dash included.
- **Response:** The stop hook adds RESPONSE 1 when this turn ends, so it isn't in the file yet.

Go back to the first session and say "canary 2 sent". That session will check both files, write `CAPTURE-TEST.md`, and commit the logs.
````

## What I tried first that did not work, and other surprises

1. **The docs research summary was wrong.** A docs-research subagent reported that the per-event hook payloads were "not documented", and also which shell runs hooks on Windows. Downloading the raw docs page (`code.claude.com/docs/en/hooks.md`) showed the opposite: `Stop` provides `last_assistant_message`, `UserPromptSubmit` provides `prompt`, and hooks have an exec form (`command` plus `args`) that runs with no shell. I built on the raw docs, not the summary. The docs also warn that the transcript may not yet contain the final message when `Stop` fires, which is why the response comes from `last_assistant_message` and not from parsing the transcript.
2. **My first model-tracking design was wrong.** Writing the tests showed a problem before anything went live. The first version treated each response's model as "the session's model", so a single turn served by a fallback model would have mislabelled every later prompt. The fix: only `SessionStart` and `PostModelSwitch` set the session model, and responses report the model the transcript recorded for that turn.
3. **The first prompt was never seen by `UserPromptSubmit`.** The hooks were installed partway through the setup turn, so that hook didn't fire for the setup brief. To cover this, `Stop` checks its `prompt_id` against the prompts already logged. If the prompt is missing, it recovers the text verbatim from the session transcript, and did so for `num=1` of session `bbda624a`. The recovered prompt was byte-identical to the transcript text in a dry run before going live.
4. **`SessionStart` did not include a model.** It fired with `source: "startup"` but no `model` field; the docs say the field is optional. Canary 2's prompt was therefore labelled from the script's last-model-seen fallback. Its response was labelled from the transcript.
5. **PowerShell showed a garbled em dash.** Printing the log with PowerShell 5.1's `Get-Content` displayed the em dash as `â€”`. Checking the bytes (`e2 80 94`) confirmed the file itself is correct UTF-8.

Before the canaries, the hooks were verified two other ways:

- **Scratchpad test harness.** The script was run against synthetic hook events, in sandboxes outside the repo. Cases covered:
  - verbatim prompts, including text that mimics log entries and frontmatter
  - a duplicate `Stop`
  - interrupts, a `/model` switch and an API error
  - subagent events and malformed input, which fail with a non-blocking exit 1 and never exit 2
  - a 32 MB transcript, which took under 0.6 s in the worst case
- **Live `PostToolUse` probe.** A temporary probe hook proved three things in the running session: settings hot-reload, the exec-form command works on Windows, and `${CLAUDE_PROJECT_DIR}` is substituted. The probe was removed before commit `64d0ec6`.
