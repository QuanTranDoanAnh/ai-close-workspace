#!/usr/bin/env node
/**
 * Checks a commit message against the Conventional Commits profile of this project (rule GIT-01).
 * Usage as a commit-msg hook:  node tools/lint/check-commit-msg.mjs "$1"
 * Usage in CI:                 git log -1 --pretty=%B | node tools/lint/check-commit-msg.mjs -
 */
import fs from 'node:fs';
import config from './standards.config.mjs';

const source = process.argv[2];
if (!source) {
  console.error('usage: check-commit-msg.mjs <file | ->');
  process.exit(2);
}
const message = fs.readFileSync(source === '-' ? 0 : source, 'utf8');
const lines = message.split(/\r?\n/).filter((l) => !l.startsWith('#'));
const subject = (lines[0] || '').trim();
const { types, scopes, maxSubjectLength } = config.commit;
const problems = [];

if (/^(Merge|Revert) /.test(subject)) process.exit(0);

const m = subject.match(/^([a-z]+)\(([a-z0-9-]+)\)(!)?: (.+)$/);
if (!m) {
  problems.push("Subject must look like 'type(scope): summary', for example 'feat(policy): hold postings above the limit'.");
} else {
  const [, type, scope, , summary] = m;
  if (!types.includes(type)) problems.push(`Type '${type}' is not one of: ${types.join(', ')}.`);
  if (!scopes.includes(scope)) problems.push(`Scope '${scope}' is not one of: ${scopes.join(', ')}.`);
  if (/^[A-Z]/.test(summary)) problems.push('Summary must start with a lower-case verb in the imperative.');
  if (/\.$/.test(summary)) problems.push('Summary must not end with a period.');
}
if (subject.length > maxSubjectLength) problems.push(`Subject has ${subject.length} characters. The limit is ${maxSubjectLength}.`);
if (lines.length > 1 && lines[1].trim() !== '') problems.push('Leave the second line empty.');

if (problems.length) {
  console.error('GIT-01 commit message rejected:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
