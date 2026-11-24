#!/usr/bin/env node
/**
 * Stop and SubagentStop hook: the lint gate.
 *
 * When Claude (or a developer subagent) finishes an iteration, this runs the lint kit on what changed.
 * If a step fails, the hook exits with code 2 and the findings on stderr. Claude Code then keeps the
 * turn going and hands the findings to Claude as its next instruction.
 *
 * Design:
 *   - Runs only when source files changed since the last passing run, committed or not.
 *     Turns that only talk, or only touch documentation, cost nothing.
 *   - Selects the lint steps from the changed paths, so a small change gets a fast gate.
 *   - A subagent is gated on its own write area only (roles.json).
 *   - Never loops forever. Claude may stop with a red gate when
 *       a) nothing changed since the last failed run (Claude is stuck or needs the user), or
 *       b) LINT_GATE_MAX_ATTEMPTS rounds in one turn did not fix it.
 *     In both cases the user sees a warning that the gate is still red.
 *
 * Environment:
 *   LINT_GATE=off              skip the gate
 *   LINT_GATE_FULL=1           always run every step
 *   LINT_GATE_MAX_ATTEMPTS=6   failed rounds per turn before Claude may stop anyway
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, loadState, saveState } from './lib.mjs';

const input = readInput();
const root = projectDir(input);
const runner = path.join(root, 'tools', 'lint', 'run.mjs');
const maxAttempts = Number(process.env.LINT_GATE_MAX_ATTEMPTS || 6);
const role = input.hook_event_name === 'SubagentStop' ? input.agent_type || 'subagent' : null;
const who = role ? `Subagent ${role}` : 'Claude';
const stateName = `lint-gate-${role || 'main'}`;

if (process.env.LINT_GATE === 'off' || !fs.existsSync(runner)) process.exit(0);

function tell(message) {
  process.stdout.write(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });

/* ---------- what changed ---------- */
const status = git(['status', '--porcelain=v1', '-uall']);
if (status.status !== 0) tell('Lint gate inactive: this folder is not a git repository. Run "git init" and commit the seed.');

const state = loadState(root, stateName);
const head = git(['rev-parse', 'HEAD']).stdout.trim();
const session = loadState(root, 'session');
if (state.session !== input.session_id) {
  state.session = input.session_id;
  state.failStreak = 0;
  state.lastFailed = null;
  if (!state.baseHead) state.baseHead = session.session === input.session_id ? session.head : head;
}
if (!input.stop_hook_active) state.failStreak = 0; // a new turn starts a new streak

const changed = new Set(
  status.stdout
    .split('\n')
    .filter((l) => l.length > 3)
    .map((l) => l.slice(3).replace(/^"|"$/g, ''))
    .map((p) => (p.includes(' -> ') ? p.split(' -> ')[1] : p)),
);
if (state.baseHead && head && state.baseHead !== head) {
  const committed = git(['diff', '--name-only', state.baseHead, head]);
  if (committed.status === 0)
    committed.stdout
      .split('\n')
      .filter(Boolean)
      .forEach((p) => changed.add(p));
}

let area = null;
if (role) {
  try {
    area = JSON.parse(fs.readFileSync(new URL('./roles.json', import.meta.url), 'utf8'))[role] || null;
  } catch {
    area = null;
  }
}
const inArea = (p) => !area || area.some((prefix) => (prefix.endsWith('/') ? p.startsWith(prefix) : p === prefix));
const isDocOnly = (p) => /^(docs\/|\.claude\/|\.github\/)/.test(p) || /\.md$/.test(p);
const relevant = [...changed].filter((p) => !isDocOnly(p) && inArea(p)).sort();
if (!relevant.length) process.exit(0);

const hash = crypto.createHash('sha1').update(`${head}\n`);
for (const p of relevant) {
  try {
    const st = fs.statSync(path.join(root, p));
    hash.update(`${p}:${st.size}:${Math.floor(st.mtimeMs)}\n`);
  } catch {
    hash.update(`${p}:gone\n`);
  }
}
const fingerprint = hash.digest('hex');
if (state.passed === fingerprint) process.exit(0);

if (state.lastFailed === fingerprint) {
  saveState(root, stateName, state);
  tell(
    `Lint gate is still RED and nothing changed since the last failed run, so ${who} was allowed to stop. Run "npm run lint" to see the findings.`,
  );
}

/* ---------- which steps ---------- */
function selectSteps(files) {
  if (process.env.LINT_GATE_FULL === '1') return null; // null = all steps
  const steps = new Set(['files']);
  for (const f of files) {
    if (/^(tools\/lint\/|eslint\.config\.mjs$|tsconfig\.json$|package\.json$)/.test(f)) return null;
    if (/\.cds$/.test(f)) ['es', 'cds', 'i18n', 'types'].forEach((s) => steps.add(s));
    if (/\.csv$/.test(f)) steps.add('es');
    if (/^(srv|test|mock-bank)\/.*\.ts$/.test(f)) ['es', 'types', 'format'].forEach((s) => steps.add(s));
    if (/^app\//.test(f)) ['es', 'types', 'fiori', 'i18n', 'ui5', 'format'].forEach((s) => steps.add(s));
    if (/\.properties$/.test(f)) steps.add('i18n');
    if (/^(mta\.yaml|xs-security\.json|\.gitignore)$/.test(f)) steps.add('btp');
    if (/\.(json|ya?ml|mjs|js)$/.test(f)) steps.add('format');
  }
  return [...steps];
}

const steps = selectSteps(relevant);
const args = [runner, ...(steps ? ['--only', steps.join(',')] : [])];
const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 540000, maxBuffer: 32 * 1024 * 1024 });
const output = `${run.stdout || ''}${run.stderr || ''}`;

if (run.status === 0) {
  state.passed = fingerprint;
  state.baseHead = head || state.baseHead;
  state.failStreak = 0;
  state.lastFailed = null;
  saveState(root, stateName, state);
  process.exit(0);
}

/* ---------- failed ---------- */
const failed = [...output.matchAll(/^FAIL\s+(\S+)\s+(.*)$/gm)].map((m) => ({ key: m[1], name: m[2].trim() }));
const failedList = failed.map((f) => f.key).join(', ') || 'lint run did not complete';
state.failStreak = (state.failStreak || 0) + 1;
state.lastFailed = fingerprint;
saveState(root, stateName, state);

if (state.failStreak > maxAttempts) {
  tell(
    `Lint gate is still RED (${failedList}) after ${maxAttempts} rounds in this turn, so ${who} was allowed to stop. Run "npm run lint" to see the findings.`,
  );
}

/** The output of the failing steps, shortened to what Claude needs to act. */
function digest(text, limit = 7000) {
  const sections = text.split(/\n(?==== )/);
  const names = failed.map((f) => f.name);
  const keep = [];
  for (const section of sections) {
    const title = (section.match(/^\s*=== (.*) ===/) || [])[1];
    if (title && names.includes(title)) keep.push(section.trim().split('\n').slice(0, 45).join('\n'));
  }
  let body = keep.join('\n\n');
  if (!body) body = text.split('\n').slice(-60).join('\n');
  return body.length > limit ? `${body.slice(0, limit)}\n... [shortened, run "npm run lint" for the rest]` : body;
}

const lines = [
  `LINT GATE FAILED (round ${state.failStreak} of ${maxAttempts}). Failing steps: ${failedList}.`,
  'Fix every error below, then finish again. Rules:',
  '- Fix the cause. Do not suppress, disable or weaken a rule, and do not edit tools/lint/ or eslint.config.mjs.',
  '- Rule IDs (CDS-03, FE-18, SRV-10, ...) are explained in docs/development-standards.md.',
  '- If a finding needs a decision by the user, say which one and stop without changing files.',
];
if (role)
  lines.push(
    `- You are the ${role} agent. If a finding is in a file outside your write area, do not touch it: name it in your result and finish.`,
  );
lines.push('', digest(output), '');
process.stderr.write(lines.join('\n'));
process.exit(2);
