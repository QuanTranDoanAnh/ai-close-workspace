#!/usr/bin/env node
/**
 * PreToolUse hook for Edit and Write: write areas per subagent.
 *
 * Each subagent may change only its own layer. The areas are listed in roles.json, keyed by the
 * subagent name. The main session (no agent_type in the hook input) is not restricted.
 * This keeps parallel subagents from editing the same files and keeps reviewers read-only.
 * Note: this guards the file tools. It does not parse Bash commands.
 */
import fs from 'node:fs';
import { readInput, projectDir, relativePath, deny } from './lib.mjs';

const input = readInput();
const role = input.agent_type;
if (!role) process.exit(0);

let roles = {};
try {
  roles = JSON.parse(fs.readFileSync(new URL('./roles.json', import.meta.url), 'utf8'));
} catch {
  process.exit(0);
}
const allowed = roles[role];
if (!allowed) process.exit(0); // built-in or unlisted subagent: no area defined

const root = projectDir(input);
const target = (input.tool_input || {}).file_path;
if (!target) process.exit(0);

const file = relativePath(root, target);
if (file === null) deny(`'${target}' is outside the project. The ${role} agent writes only under: ${allowed.join(', ')}.`);

const ok = allowed.some((prefix) => (prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix));
if (!ok) {
  deny(
    `The ${role} agent may write only under: ${allowed.join(', ')}. '${file}' belongs to another role. ` +
      'Do not work around this. Describe the change that is needed there in your result, and the orchestrator will delegate it.',
  );
}
process.exit(0);
