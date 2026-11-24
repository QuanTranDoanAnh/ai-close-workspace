#!/usr/bin/env node
/**
 * PreToolUse hook for Edit and Write.
 * Blocks three things that instructions alone cannot guarantee:
 *   1. edits to generated or vendored folders,
 *   2. files that hold local credentials,
 *   3. lint and compiler suppressions without a stated reason (development standards, section 13.5).
 */
import { readInput, projectDir, relativePath, deny } from './lib.mjs';

const input = readInput();
const root = projectDir(input);
const toolInput = input.tool_input || {};
const file = relativePath(root, toolInput.file_path);
if (!file) process.exit(0);

const GENERATED = /^(gen|dist|node_modules|mta_archives|coverage|@cds-models)\//;
if (GENERATED.test(file) || /\/(dist|node_modules)\//.test(file)) {
  deny(`'${file}' is generated or vendored. Change the source and rebuild instead.`);
}

const SECRETS = /(^|\/)(\.env(\..+)?|default-env\.json|\.cdsrc-private\.json)$/;
if (SECRETS.test(file)) {
  deny(`'${file}' holds local credentials and is never written by Claude (rules BTP-06, BTP-07). Ask the user to maintain it.`);
}

// Suppression comments matter in source files only; documentation may mention them.
if (!/\.(ts|mts|cts|js|mjs|cjs|xml|cds|ya?ml)$/.test(file)) process.exit(0);

const text = String(toolInput.content ?? toolInput.new_string ?? '');
const problems = [];
for (const line of text.split(/\r?\n/)) {
  if (/eslint-disable/.test(line) && !/eslint-disable[\w-]*(\s+[@\w/,\s-]+)?\s+--\s+\S/.test(line)) {
    problems.push('an eslint-disable comment without a reason (write: // eslint-disable-next-line <rule> -- <reason>)');
  }
  if (/@ts-ignore/.test(line)) problems.push('@ts-ignore (fix the type, or use @ts-expect-error with a reason)');
  if (/@ts-expect-error\s*$/.test(line.trim())) problems.push('@ts-expect-error without a reason');
  if (/ui5lint-disable/.test(line) && !/--\s+\S/.test(line)) problems.push('a ui5lint-disable comment without a reason');
  if (/@ts-nocheck/.test(line)) problems.push('@ts-nocheck');
}
if (problems.length) {
  deny(
    `This change adds ${[...new Set(problems)].join('; ')}. ` +
      'Findings are fixed, not suppressed. A suppression of a Must rule also needs a row in the deviation log ' +
      '(docs/development-standards.md, section 13.5). If the rule truly cannot be met, stop and ask the user.',
  );
}
process.exit(0);
