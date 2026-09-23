#!/usr/bin/env node
/**
 * Agent capture hook for Claude Code.
 *
 * Appends each prompt, and Claude's final response to it, to
 * .agent-logs/<first-prompt-utc>_<session-id>.md in the 8x session-log format.
 * .claude/settings.json runs this script on the events below; which one fired is
 * read from the hook input on stdin.
 *
 *   UserPromptSubmit   PROMPT entry: the `prompt` field, verbatim
 *   Stop               RESPONSE entry: `last_assistant_message`, the final text only
 *   StopFailure        RESPONSE entry: the API error that ended the turn
 *   SessionEnd         closes out a prompt whose turn never reached Stop (e.g. Esc)
 *   SessionStart,      track the active model so PROMPT entries can name it;
 *   PostModelSwitch    RESPONSE entries use the model recorded in the transcript
 *
 * Nothing is written to stdout (UserPromptSubmit stdout is injected into Claude's
 * context) and the script never exits 2 (that would block the prompt). On failure
 * it exits 1, which Claude Code reports as a non-blocking hook error.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const AUTHOR = 'sherry'; // GitHub handle for the log frontmatter
const TOOL = 'claude-code';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const PROJECT = path.basename(PROJECT_DIR);
const LOG_DIR = path.join(PROJECT_DIR, '.agent-logs');
// Per-session bookkeeping (pending prompt, current model) that doesn't belong in the log.
const STATE_DIR = path.join(os.tmpdir(), 'claude-agent-log');
const LAST_MODEL_FILE = path.join(STATE_DIR, '_last-model.json');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    handle(JSON.parse(raw));
  } catch (err) {
    fail(err);
  }
});

function handle(input) {
  if (input.agent_id) return; // subagent events are not part of the prompt/response record
  const sid = input.session_id;
  if (!sid) throw new Error('hook input has no session_id');
  const event = input.hook_event_name;

  fs.mkdirSync(STATE_DIR, { recursive: true });
  writeJson(path.join(STATE_DIR, `last-${event}.json`), input); // latest raw input, for debugging

  const handled = ['SessionStart', 'PostModelSwitch', 'UserPromptSubmit', 'Stop', 'StopFailure', 'SessionEnd'];
  if (!handled.includes(event)) return;
  const state = readJson(statePath(sid), null) || {};
  state.promptIds = state.promptIds || [];

  switch (event) {
    case 'SessionStart':
      setSessionModel(state, input.model);
      break;
    case 'PostModelSwitch':
      setSessionModel(state, input.to_model);
      break;
    case 'UserPromptSubmit':
      closeUnanswered(input, state,
        'before the next prompt was submitted. That happens when a turn is interrupted (Esc), ' +
        'when a new message is sent while Claude is still working, or when a prompt is handled ' +
        'locally without a model reply.');
      logPrompt(input, state, promptText(input), now(), input.prompt_id);
      break;
    case 'Stop':
      recoverPrompt(input, state);
      logResponse(input, state, finalText(input), responseModel(input, state));
      break;
    case 'StopFailure':
      recoverPrompt(input, state);
      logResponse(input, state, failureText(input), responseModel(input, state));
      break;
    case 'SessionEnd':
      closeUnanswered(input, state,
        'before the session ended. That happens when the session is closed mid-turn or right ' +
        'after an interrupted turn (Esc), or when a prompt is handled locally without a model reply.');
      break;
  }
  writeJson(statePath(sid), state);
}

// ---- entries ---------------------------------------------------------------

function logPrompt(input, state, text, ts, promptId) {
  const model = promptModel(input, state);
  const log = openLog(input.session_id, ts);
  const num = Number(log.meta.total_exchanges || 0) + 1;
  log.meta.total_exchanges = num;
  log.meta.first_prompt_time = log.meta.first_prompt_time || ts;
  log.meta.last_prompt_time = ts;
  appendEntry(log, 'PROMPT', num, ts, model, text);
  state.pending = { num, at: ts, model };
  if (promptId) state.promptIds.push(promptId);
}

function logResponse(input, state, text, model) {
  const ts = now();
  const log = openLog(input.session_id, ts);
  const num = state.pending ? state.pending.num : Number(log.meta.total_exchanges || 0);
  // Stop can fire more than once for a turn (another hook may make Claude continue);
  // skip an exact repeat, but log a genuinely new final message.
  const key = `${num}:${crypto.createHash('sha1').update(text).digest('hex')}`;
  if (key !== state.lastResponseKey) {
    appendEntry(log, 'RESPONSE', num, ts, model, text);
    state.lastResponseKey = key;
  }
  state.pending = null;
  noteLastModel(model);
}

// A prompt whose turn ended without Stop/StopFailure still gets a RESPONSE entry,
// so a missing response is visible in the log rather than silent.
function closeUnanswered(input, state, explanation) {
  if (!state.pending) return;
  logResponse(input, state,
    `[capture note] No final response was recorded for this prompt: Claude Code's end-of-turn ` +
    `(Stop) hook did not fire ${explanation}`,
    state.pending.model);
}

// If UserPromptSubmit didn't log this turn's prompt (for example, the hooks were
// installed partway through the turn), take the prompt from the transcript instead.
function recoverPrompt(input, state) {
  const id = input.prompt_id;
  if (!id || state.promptIds.includes(id)) return;
  const found = findPrompt(input.transcript_path, id);
  if (found) logPrompt(input, state, found.text, found.timestamp, id);
}

function promptText(input) {
  return typeof input.prompt === 'string'
    ? input.prompt
    : '[capture note] The UserPromptSubmit hook input had no prompt field.';
}

function finalText(input) {
  const text = input.last_assistant_message;
  if (typeof text !== 'string') {
    return '[capture note] The Stop hook input had no last_assistant_message field, so the final response could not be captured.';
  }
  return text || "[capture note] Claude's final message contained no text.";
}

function failureText(input) {
  const detail = [input.error, input.error_details]
    .filter(Boolean)
    .map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
    .join(' - ');
  return `[capture note] The turn ended with an API error (${detail || 'no details'}). Claude Code showed:\n\n` +
    (input.last_assistant_message || '(no message)');
}

// ---- models ----------------------------------------------------------------

// The model a prompt is sent to: the session's current model if a hook reported it,
// else the last model seen in the transcript, else the last model seen anywhere.
function promptModel(input, state) {
  if (state.model) return state.model;
  const last = latestAssistant(input.transcript_path);
  return (last && last.model) || readJson(LAST_MODEL_FILE, {}).model || 'unknown';
}

// The model that wrote the response: the transcript's newest assistant message, if it
// was written during this turn (the transcript can lag behind the conversation).
function responseModel(input, state) {
  const last = latestAssistant(input.transcript_path);
  const turnStart = state.pending && state.pending.at;
  if (last && (!turnStart || last.timestamp >= turnStart)) return last.model;
  return state.model || (last && last.model) || readJson(LAST_MODEL_FILE, {}).model || 'unknown';
}

// Only SessionStart and PostModelSwitch report the session's model. A response's
// model doesn't change it: a fallback model can serve a single turn without
// switching the session.
function setSessionModel(state, model) {
  const name = modelName(model);
  if (!name) return;
  state.model = name;
  noteLastModel(name);
}

// Last model seen in any session: the fallback when a new session's SessionStart
// omits the model (e.g. after /clear) and its transcript is still empty.
function noteLastModel(model) {
  const name = modelName(model);
  if (name && name !== 'unknown') writeJson(LAST_MODEL_FILE, { model: name });
}

// Hooks may report "claude-opus-5-5[1m]" where the transcript says "claude-opus-5-5";
// drop the context-window suffix so the same model isn't logged as a switch.
function modelName(model) {
  if (model && typeof model === 'object') model = model.id || model.display_name;
  return typeof model === 'string' && model ? model.replace(/\[[^\]]*\]$/, '') : null;
}

// ---- transcript (read-only, best effort: its format is internal to Claude Code) ----

function latestAssistant(transcriptPath) {
  let found = null;
  scanTranscript(transcriptPath, e => {
    const model = e.type === 'assistant' && !e.isSidechain && e.message && e.message.model;
    if (!model || model === '<synthetic>') return false;
    found = { model, timestamp: e.timestamp || '' };
    return true;
  });
  return found;
}

function findPrompt(transcriptPath, promptId) {
  let found = null;
  scanTranscript(transcriptPath, e => {
    if (e.type !== 'user' || e.promptId !== promptId || e.isSidechain || e.isMeta) return false;
    if (e.origin && e.origin.kind && e.origin.kind !== 'human') return false;
    const content = e.message && e.message.content;
    let text = null;
    if (typeof content === 'string') text = content;
    else if (Array.isArray(content) && !content.some(b => b.type === 'tool_result')) {
      text = content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    }
    if (!text) return false;
    found = { text, timestamp: e.timestamp || now() };
    return true;
  });
  return found;
}

// Calls visit(entry) for each transcript line, newest first, until it returns true.
// Reads backwards in chunks so long transcripts aren't loaded whole on every turn.
function scanTranscript(file, visit) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
  } catch {
    return;
  }
  const visitLine = buf => {
    if (!buf.length) return false;
    let entry;
    try {
      entry = JSON.parse(buf.toString('utf8'));
    } catch {
      return false; // e.g. a line still being written
    }
    return visit(entry) === true;
  };
  try {
    const CHUNK = 1 << 20;
    let pos = fs.fstatSync(fd).size;
    let carry = Buffer.alloc(0);
    while (pos > 0) {
      const len = Math.min(CHUNK, pos);
      pos -= len;
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, pos);
      const data = Buffer.concat([buf, carry]);
      let end = data.length;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i] !== 0x0a) continue;
        if (visitLine(data.subarray(i + 1, end))) return;
        end = i;
      }
      carry = data.subarray(0, end);
    }
    visitLine(carry);
  } finally {
    fs.closeSync(fd);
  }
}

// ---- log file --------------------------------------------------------------

function openLog(sid, ts) {
  const name = fs.existsSync(LOG_DIR) && fs.readdirSync(LOG_DIR).find(f => f.endsWith(`_${sid}.md`));
  if (!name) {
    const stamp = ts.slice(0, 19).replace('T', '_').replace(/:/g, '-');
    return {
      file: path.join(LOG_DIR, `${stamp}_${sid}.md`),
      meta: { session_id: sid, date: ts.slice(0, 10), model: '', total_exchanges: 0, first_prompt_time: '', last_prompt_time: '' },
      entries: '',
    };
  }
  const file = path.join(LOG_DIR, name);
  const text = fs.readFileSync(file, 'utf8');
  // Frontmatter, then the title block, which ends with a `---` rule; entries follow.
  const head = /^---\r?\n([\s\S]*?)\r?\n---\r?\n[\s\S]*?\r?\n---\r?\n\r?\n/.exec(text);
  if (!head) throw new Error(`cannot parse the header of ${file}`);
  const meta = {};
  for (const line of head[1].split(/\r?\n/)) {
    const i = line.indexOf(': ');
    if (i > 0) meta[line.slice(0, i)] = line.slice(i + 2);
  }
  return { file, meta, entries: text.slice(head[0].length) };
}

function appendEntry(log, type, num, ts, model, text) {
  const { meta } = log;
  const models = (meta.model || '').split(', ').filter(m => m && m !== 'unknown');
  if (model !== 'unknown' && !models.includes(model)) models.push(model);
  meta.model = models.join(', ') || 'unknown';

  const short = meta.session_id.slice(0, 8);
  log.entries +=
    `[LOG_ENTRY type=${type} num=${num} session=${short}]\n` +
    `timestamp: ${ts}\n` +
    `model: ${model}\n\n` +
    `${text}\n\n\n`;

  const header = [
    '---',
    `session_id: ${meta.session_id}`,
    `date: ${meta.date}`,
    `author: ${AUTHOR}`,
    `model: ${meta.model}`,
    `tool: ${TOOL}`,
    `project: ${PROJECT}`,
    `total_exchanges: ${meta.total_exchanges}`,
    `first_prompt_time: ${meta.first_prompt_time}`,
    `last_prompt_time: ${meta.last_prompt_time}`,
    '---',
    '',
    `# Session Log - ${meta.date}`,
    '',
    `Session: \`${short}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\``,
    '',
    '---',
    '',
    '',
  ].join('\n');

  // Write a temp file and rename it over the log, so a hook killed mid-write
  // can never truncate entries that are already there.
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const tmp = path.join(LOG_DIR, `.${path.basename(log.file)}.tmp`);
  fs.writeFileSync(tmp, header + log.entries);
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(tmp, log.file);
      return;
    } catch (err) {
      // Antivirus or the search indexer can hold a fresh file for a moment on Windows.
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
}

// ---- helpers ---------------------------------------------------------------

function statePath(sid) {
  return path.join(STATE_DIR, `${sid}.json`);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function now() {
  return new Date().toISOString();
}

function fail(err) {
  const msg = `agent-log hook failed: ${(err && err.stack) || err}`;
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(path.join(STATE_DIR, 'errors.log'), `${now()} ${msg}\n`);
  } catch {
    // nothing else to do; stderr below still reaches Claude Code
  }
  process.stderr.write(`${msg}\n`);
  process.exitCode = 1;
}
