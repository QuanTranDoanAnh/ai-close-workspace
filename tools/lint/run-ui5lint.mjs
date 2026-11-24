#!/usr/bin/env node
/**
 * Runs the UI5 linter in every app folder (rule FE gate "Legacy and deprecated API use").
 * The UI5 linter works per UI5 project, so it is started once per app.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import config from './standards.config.mjs';
import { parseArgs } from './lib/common.mjs';

const args = parseArgs();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let failed = false;
let ran = 0;

for (const app of Object.keys(config.apps)) {
  const dir = path.join(args.root, 'app', app);
  if (!fs.existsSync(path.join(dir, 'webapp'))) continue;
  ran++;
  console.log(`ui5lint app/${app}`);
  const res = spawnSync(npx, ['ui5lint', ...args.rest], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) failed = true;
}

if (!ran) console.log('run-ui5lint: no app with a webapp folder found, nothing to check');
process.exit(failed ? 1 : 0);
