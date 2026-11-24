#!/usr/bin/env node
/**
 * Self-test of the lint kit.
 * Writes a passing and a failing fixture project to .lint-selftest/, runs every check on both,
 * and fails if the passing project produces an error or the failing project misses an expected rule.
 * Run it after every change to a check or to eslint.config.mjs:  npm run lint:selftest
 * Pass --keep to leave the fixture projects on disk for inspection.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { good, bad, expected, commitMessages } from './selftest/fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const work = path.join(repo, '.lint-selftest');
const keep = process.argv.includes('--keep');
let failures = 0;

const ok = (msg) => console.log(`  pass  ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

function materialise(name, files) {
  const root = path.join(work, name);
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

function runCheck(tool, root) {
  const res = spawnSync(process.execPath, [path.join(here, `${tool}.mjs`), '--root', root, '--json'], { encoding: 'utf8', cwd: repo });
  const line = res.stdout.trim().split('\n').pop() || '';
  try {
    return JSON.parse(line);
  } catch {
    return {
      errors: 1,
      warnings: 0,
      findings: [
        {
          severity: 'error',
          rule: 'CRASH',
          file: '',
          line: 0,
          message: (res.stderr || res.stdout).trim().split('\n').slice(0, 3).join(' | '),
        },
      ],
    };
  }
}

fs.rmSync(work, { recursive: true, force: true });
const goodRoot = materialise('good', good);
const badRoot = materialise('bad', bad);

/* ---------- custom checks ---------- */
for (const tool of ['check-cds-model', 'check-files', 'check-fiori', 'check-i18n', 'check-btp']) {
  console.log(tool);
  const g = runCheck(tool, goodRoot);
  if (g.errors === 0) ok('good project has no errors');
  else {
    fail(`good project has ${g.errors} error(s)`);
    for (const f of g.findings.filter((x) => x.severity === 'error')) console.log(`        ${f.rule} ${f.file}:${f.line} ${f.message}`);
  }
  const b = runCheck(tool, badRoot);
  const found = new Set(b.findings.map((f) => f.rule));
  const missing = expected[tool].filter((r) => !found.has(r));
  if (!missing.length) ok(`bad project triggers all ${expected[tool].length} expected rules`);
  else fail(`bad project does not trigger: ${missing.join(', ')}`);
  const crash = b.findings.find((f) => f.rule === 'CRASH' || f.rule === 'CDS-00');
  if (crash) fail(`check did not run cleanly: ${crash.message}`);
}

/* ---------- ESLint ---------- */
console.log('eslint');
const eslint = new ESLint({ cwd: repo, ignore: false });
const lint = async (root) => {
  const results = await eslint.lintFiles([path.join(path.relative(repo, root), '**/*.{ts,cds,csv}').split(path.sep).join('/')]);
  return results.flatMap((r) => r.messages.map((m) => ({ ...m, file: path.relative(repo, r.filePath) })));
};
const goodMessages = (await lint(goodRoot)).filter((m) => m.severity === 2);
if (!goodMessages.length) ok('good project has no errors');
else {
  fail(`good project has ${goodMessages.length} error(s)`);
  for (const m of goodMessages) console.log(`        ${m.ruleId} ${m.file}:${m.line} ${m.message}`);
}
const badMessages = await lint(badRoot);
const badRules = new Set(badMessages.map((m) => m.ruleId));
const fatal = badMessages.filter((m) => m.fatal);
if (fatal.length) fail(`ESLint could not parse: ${fatal.map((m) => `${m.file}: ${m.message}`).join(' | ')}`);
const missingRules = expected.eslint.filter((r) => !badRules.has(r));
if (!missingRules.length) ok(`bad project triggers all ${expected.eslint.length} expected rules`);
else fail(`bad project does not trigger: ${missingRules.join(', ')}`);

/* ---------- TypeScript compiler ---------- */
console.log('tsc');
const tsc = spawnSync(process.execPath, [path.join(here, 'run-tsc.mjs'), '--root', goodRoot], { encoding: 'utf8', cwd: repo });
if (tsc.status === 0) ok('good project compiles in strict mode');
else fail(`good project does not compile: ${(tsc.stdout + tsc.stderr).trim().split('\n').slice(0, 6).join(' | ')}`);

/* ---------- UI5 linter ---------- */
console.log('ui5lint');
const ui5 = (root) => spawnSync(process.execPath, [path.join(here, 'run-ui5lint.mjs'), '--root', root], { encoding: 'utf8', cwd: repo });
const ui5Good = ui5(goodRoot);
if (ui5Good.status === 0) ok('good project has no findings');
else fail(`good project has findings: ${(ui5Good.stdout + ui5Good.stderr).trim().split('\n').slice(-6).join(' | ')}`);
if (ui5(badRoot).status !== 0) ok('bad project is rejected');
else fail('bad project was accepted');

/* ---------- commit messages ---------- */
console.log('check-commit-msg');
const commit = (msg) =>
  spawnSync(process.execPath, [path.join(here, 'check-commit-msg.mjs'), '-'], { input: msg, encoding: 'utf8' }).status;
if (commitMessages.good.every((m) => commit(m) === 0)) ok('good messages are accepted');
else fail('a good message was rejected');
if (commitMessages.bad.every((m) => commit(m) === 1)) ok('bad messages are rejected');
else fail('a bad message was accepted');

if (!keep) fs.rmSync(work, { recursive: true, force: true });
console.log(failures ? `\nself-test FAILED: ${failures} problem(s)` : '\nself-test passed');
process.exit(failures ? 1 : 0);
