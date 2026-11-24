#!/usr/bin/env node
/**
 * Self-test of the guard hooks. Runs each script with simulated hook input and checks the decision.
 * Usage: node .claude/hooks/selftest.mjs
 * The lint gate is not covered here, because it needs a git repository with changes.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const edit = (file, text, agent) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Write',
  tool_input: { file_path: file, content: text },
  ...(agent ? { agent_type: agent } : {}),
});

const cases = [
  ['guard-edits.mjs', 'allows a normal source file', edit('srv/policy/policy-engine.ts', 'export const a = 1;'), 'allow'],
  ['guard-edits.mjs', 'denies a credential file', edit('default-env.json', '{}'), 'deny'],
  ['guard-edits.mjs', 'denies a nested .env file', edit('app/workspace/.env', 'A=1'), 'deny'],
  ['guard-edits.mjs', 'denies a generated folder', edit('gen/srv/server.js', 'x'), 'deny'],
  ['guard-edits.mjs', 'denies eslint-disable without a reason', edit('srv/a.ts', '// eslint-disable-next-line no-console\n'), 'deny'],
  [
    'guard-edits.mjs',
    'allows eslint-disable with a reason',
    edit('srv/a.ts', '// eslint-disable-next-line no-console -- CLI output\n'),
    'allow',
  ],
  ['guard-edits.mjs', 'denies @ts-ignore', edit('srv/a.ts', '// @ts-ignore\n'), 'deny'],
  ['guard-edits.mjs', 'allows documentation that mentions a suppression', edit('docs/notes.md', 'never write eslint-disable'), 'allow'],
  ['restrict-writes.mjs', 'main session is not restricted', edit('srv/a.ts', ''), 'allow'],
  [
    'restrict-writes.mjs',
    'ui-developer may write under app/',
    edit('app/workspace/webapp/view/Workspace.view.xml', '', 'ui-developer'),
    'allow',
  ],
  ['restrict-writes.mjs', 'ui-developer may not write under srv/', edit('srv/workspace-service.ts', '', 'ui-developer'), 'deny'],
  ['restrict-writes.mjs', 'backend-developer may not write under app/', edit('app/admin/annotations.cds', '', 'backend-developer'), 'deny'],
  ['restrict-writes.mjs', 'test-author may not write under srv/', edit('srv/policy/policy-engine.ts', '', 'test-author'), 'deny'],
  ['restrict-writes.mjs', 'spec-verifier may write its report', edit('docs/work/INT-04/verification.md', '', 'spec-verifier'), 'allow'],
  ['restrict-writes.mjs', 'spec-verifier may not write code', edit('srv/a.ts', '', 'spec-verifier'), 'deny'],
  [
    'restrict-writes.mjs',
    'a subagent may not write outside the project',
    edit(path.resolve(root, '..', 'x.ts'), '', 'backend-developer'),
    'deny',
  ],
  ['restrict-writes.mjs', 'an unlisted subagent is not restricted', edit('srv/a.ts', '', 'Explore'), 'allow'],
];

let failures = 0;
for (const [script, name, input, expected] of cases) {
  const res = spawnSync(process.execPath, [path.join(here, script)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  const actual = /"permissionDecision":"deny"/.test(res.stdout) ? 'deny' : res.status === 0 ? 'allow' : `error ${res.status}`;
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${script.padEnd(20)} ${name}${ok ? '' : `  (expected ${expected}, got ${actual})`}`);
}
console.log(`\n${cases.length - failures} of ${cases.length} checks passed.`);
process.exit(failures ? 1 : 0);
