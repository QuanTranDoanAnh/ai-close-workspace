/**
 * Shared helpers for the Claude Code hook scripts.
 * Hooks receive one JSON object on stdin and answer through exit code, stdout and stderr.
 * Reference: https://code.claude.com/docs/en/hooks
 */
import fs from 'node:fs';
import path from 'node:path';

/** Reads and parses the hook input. Returns {} when stdin is empty or not JSON. */
export function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Project root: the directory Claude Code was started in. */
export function projectDir(input = {}) {
  return path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
}

/** Path of a file relative to the project root, with forward slashes. Returns null outside the project. */
export function relativePath(root, file) {
  if (!file) return null;
  const abs = path.resolve(root, file);
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

/** Denies a tool call (PreToolUse) with a reason that Claude sees. */
export function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

/** Small JSON state file under .claude/.state/ (not committed). */
export function loadState(root, name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, '.claude', '.state', `${name}.json`), 'utf8'));
  } catch {
    return {};
  }
}

export function saveState(root, name, state) {
  const dir = path.join(root, '.claude', '.state');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(state, null, 2) + '\n');
}
