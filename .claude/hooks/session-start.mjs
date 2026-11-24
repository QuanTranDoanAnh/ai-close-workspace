#!/usr/bin/env node
/**
 * SessionStart hook.
 * Puts the current state of the work into Claude's context at the start of a session and after
 * compaction, so that a fresh session knows where the build stands without re-reading everything.
 * Plain text on stdout is added to the context. Keep it short.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, saveState } from './lib.mjs';

const input = readInput();
const root = projectDir(input);
const lines = [];

const git = (args) => {
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return res.status === 0 ? res.stdout.trim() : '';
};
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length;
if (branch) lines.push(`Git: branch ${branch}, ${dirty} uncommitted file(s).`);
else lines.push('Not a git repository yet: the lint gate needs one. Ask the user to run "git init" and commit the seed.');

// Baseline for the lint gate: commits made from here on are linted when Claude finishes.
if (input.source === 'startup' || input.source === 'clear') {
  try {
    saveState(root, 'session', { session: input.session_id, head: git(['rev-parse', 'HEAD']) });
  } catch {
    /* state is a convenience, never a reason to fail */
  }
}

const statusFile = path.join(root, 'docs', 'work', 'STATUS.md');
if (fs.existsSync(statusFile)) {
  const rows = fs
    .readFileSync(statusFile, 'utf8')
    .split('\n')
    .filter((l) => /^\|\s*(INT|F)-\d+/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()));
  const by = (status) => rows.filter((r) => (r[4] || '').toLowerCase().startsWith(status));
  const ids = (list) => list.map((r) => r[1]).join(', ') || 'none';
  lines.push(`Work items: ${by('done').length} done, ${by('not started').length} not started.`);
  lines.push(`In progress: ${ids(rows.filter((r) => !/^(done|not started)/i.test(r[4] || '')))}.`);
  const next = by('not started')[0];
  if (next) lines.push(`Next in build order: ${next[1]} (${next[2]}).`);
}

if (!fs.existsSync(path.join(root, 'tools', 'lint', 'run.mjs'))) {
  lines.push('Lint kit is not installed yet (tools/lint/ missing). Work item F-01 installs it. Until then the lint gate is inactive.');
}

lines.push('Workflow: one work item per session. /work-status, then /specify-intent <ID>, then /implement-intent <ID> in a fresh session.');
if (input.source === 'compact')
  lines.push('Context was compacted: re-read docs/work/<ID>/spec.md and plan.md of the item in progress before continuing.');

process.stdout.write(`Close Workspace status\n${lines.map((l) => `- ${l}`).join('\n')}\n`);
process.exit(0);
