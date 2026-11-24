#!/usr/bin/env node
/**
 * Points git at the hooks in .githooks/. Runs on `npm install` through the prepare script.
 * Does nothing, and never fails, outside a git working copy.
 */
import { spawnSync } from 'node:child_process';

const res = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
if (res.status === 0) console.log('git hooks: using .githooks/');
