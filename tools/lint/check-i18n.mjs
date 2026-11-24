#!/usr/bin/env node
/**
 * Checks translatable texts (rules I18N-01 to I18N-06).
 * Covers the text files of the UI5 apps and the _i18n folders of the CDS model.
 */
import path from 'node:path';
import config from './standards.config.mjs';
import { Report, parseArgs, walk, read } from './lib/common.mjs';

const args = parseArgs();
const report = new Report('check-i18n', args.root);
const files = walk(args.root);

const KEY_RE = /^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)*$/;
const TYPE_RE = new RegExp(`^#\\s*(${config.i18nTextTypes.join('|')})(,\\s*\\d+)?(\\s*:.*)?$`);

/** Parses a .properties file into entries with line numbers and the comment line above each key. */
function parseProperties(file) {
  const lines = read(args.root, file).split(/\r?\n/);
  const entries = [];
  let lastComment = null;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      lastComment = null;
      return;
    }
    if (line.startsWith('#') || line.startsWith('!')) {
      lastComment = line;
      return;
    }
    const m = line.match(/^([^=:\s]+)\s*[=:]\s*(.*)$/);
    if (m) entries.push({ key: m[1], value: m[2], line: i + 1, comment: lastComment });
    lastComment = null;
  });
  return entries;
}

function checkBundle(file, usedKeys, scopeLabel) {
  const entries = parseProperties(file);
  const seen = new Map();
  for (const e of entries) {
    if (!KEY_RE.test(e.key)) {
      report.error(
        'I18N-01',
        file,
        e.line,
        `Key '${e.key}' must be lowerCamelCase segments separated by dots, for example 'plan.step.status'.`,
      );
    }
    if (!e.comment || !TYPE_RE.test(e.comment)) {
      report.error(
        'I18N-02',
        file,
        e.line,
        `Key '${e.key}' needs a text-type comment on the line above, for example '#XBUT: Approve a proposal'.`,
      );
    }
    if (seen.has(e.key)) report.error('I18N-03', file, e.line, `Key '${e.key}' is defined twice (first at line ${seen.get(e.key)}).`);
    else seen.set(e.key, e.line);
    if (!e.value.trim()) report.error('I18N-06', file, e.line, `Key '${e.key}' has no text.`);
  }
  if (usedKeys) {
    for (const [key, where] of usedKeys) {
      if (!seen.has(key)) report.error('I18N-04', where.file, where.line, `Text key '${key}' is not defined in ${scopeLabel}.`);
    }
    for (const [key, line] of seen) {
      if (!usedKeys.has(key)) report.warn('I18N-05', file, line, `Text key '${key}' is not used.`);
    }
  }
  return seen;
}

function collect(regex, text, file, into) {
  const lines = text.split(/\r?\n/);
  lines.forEach((l, i) => {
    let m;
    const re = new RegExp(regex.source, 'g');
    while ((m = re.exec(l))) if (!into.has(m[1])) into.set(m[1], { file, line: i + 1 });
  });
}

/* ---------- UI5 apps ---------- */
for (const app of Object.keys(config.apps)) {
  const webapp = `app/${app}/webapp`;
  const bundle = `${webapp}/i18n/i18n.properties`;
  if (!files.includes(bundle)) continue;
  const used = new Map();
  for (const f of files.filter((x) => x.startsWith(webapp + '/'))) {
    if (/\.(view|fragment)\.xml$/.test(f)) collect(/\{i18n>([^}\s]+)\}/, read(args.root, f), f, used);
    else if (f.endsWith('manifest.json')) collect(/\{\{([^}\s]+)\}\}/, read(args.root, f), f, used);
    else if (f.endsWith('.ts')) collect(/getText\(\s*["'`]([^"'`]+)["'`]/, read(args.root, f), f, used);
  }
  const defined = checkBundle(bundle, used, bundle);

  /* I18N-07: translations define the same keys as the default file */
  for (const f of files.filter((x) => x.startsWith(`${webapp}/i18n/`) && /i18n_.+\.properties$/.test(x))) {
    const keys = new Set(parseProperties(f).map((e) => e.key));
    for (const key of defined.keys()) if (!keys.has(key)) report.warn('I18N-07', f, 0, `Translation is missing key '${key}'.`);
    for (const key of keys) if (!defined.has(key)) report.error('I18N-07', f, 0, `Key '${key}' does not exist in i18n.properties.`);
  }
}

/* ---------- CDS model texts ---------- */
const modelBundles = files.filter((f) => /^(db|srv)\/(.*\/)?_i18n\/i18n\.properties$/.test(f) || f === '_i18n/i18n.properties');
const modelUsed = new Map();
for (const f of files.filter((x) => x.endsWith('.cds') && /^(db|srv|app)\//.test(x))) {
  collect(/\{i18n>([^}\s]+)\}/, read(args.root, f), f, modelUsed);
}
if (modelBundles.length) {
  const all = new Set();
  for (const b of modelBundles) for (const key of checkBundle(b, null, b).keys()) all.add(key);
  for (const [key, where] of modelUsed) {
    if (!all.has(key)) report.error('I18N-04', where.file, where.line, `Text key '${key}' is not defined in any _i18n/i18n.properties.`);
  }
} else if (modelUsed.size) {
  const [key, where] = [...modelUsed][0];
  report.error(
    'I18N-04',
    where.file,
    where.line,
    `Text key '${key}' is used, but there is no _i18n/i18n.properties under ${path.posix.dirname(where.file)}/ or db/.`,
  );
}

process.exit(report.finish(args.json));
