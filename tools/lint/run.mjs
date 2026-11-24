#!/usr/bin/env node
/**
 * Runs every lint step, continues after failures, and prints one summary.
 * Usage:
 *   node tools/lint/run.mjs                 all steps
 *   node tools/lint/run.mjs --only es,cds   selected steps
 *   node tools/lint/run.mjs --list          show the step keys
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const targets = ['db', 'srv', 'app', 'test', 'mock-bank', 'tools', 'eslint.config.mjs'];

const steps = [
  { key: 'es', name: 'ESLint: TypeScript, CDS, seed data', cmd: npx, args: ['eslint', '--no-error-on-unmatched-pattern', ...targets] },
  { key: 'format', name: 'Prettier: formatting', cmd: npx, args: ['prettier', '--check', '--ignore-unknown', '.'] },
  { key: 'types', name: 'TypeScript compiler (strict)', cmd: node, args: [path.join(here, 'run-tsc.mjs')] },
  { key: 'cds', name: 'CDS model standards', cmd: node, args: [path.join(here, 'check-cds-model.mjs')] },
  { key: 'files', name: 'File and folder names', cmd: node, args: [path.join(here, 'check-files.mjs')] },
  { key: 'fiori', name: 'SAP Fiori gates', cmd: node, args: [path.join(here, 'check-fiori.mjs')] },
  { key: 'i18n', name: 'Translatable texts', cmd: node, args: [path.join(here, 'check-i18n.mjs')] },
  { key: 'btp', name: 'SAP BTP artefacts', cmd: node, args: [path.join(here, 'check-btp.mjs')] },
  { key: 'ui5', name: 'UI5 linter', cmd: node, args: [path.join(here, 'run-ui5lint.mjs')] },
];

const argv = process.argv.slice(2);
if (argv.includes('--list')) {
  for (const s of steps) console.log(`${s.key.padEnd(8)} ${s.name}`);
  process.exit(0);
}
const onlyIndex = argv.indexOf('--only');
const only = onlyIndex >= 0 ? argv[onlyIndex + 1].split(',') : null;
const selected = only ? steps.filter((s) => only.includes(s.key)) : steps;

const results = [];
for (const step of selected) {
  console.log(`\n=== ${step.name} ===`);
  const res = spawnSync(step.cmd, step.args, { stdio: 'inherit', shell: process.platform === 'win32' });
  results.push({ step, status: res.status ?? 1 });
}

console.log('\n=== Summary ===');
for (const { step, status } of results) console.log(`${status === 0 ? 'pass' : 'FAIL'}  ${step.key.padEnd(8)} ${step.name}`);
process.exit(results.some((r) => r.status !== 0) ? 1 : 0);
