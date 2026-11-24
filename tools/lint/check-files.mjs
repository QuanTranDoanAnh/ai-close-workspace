#!/usr/bin/env node
/**
 * Checks file and folder names and locations (rules FILE-01 to FILE-10).
 */
import path from 'node:path';
import config from './standards.config.mjs';
import { Report, parseArgs, walk, exists, isKebab, isPascal } from './lib/common.mjs';

const args = parseArgs();
const report = new Report('check-files', args.root);

const dirs = [];
const files = walk(args.root, '.', [], dirs);
const base = (f) => path.posix.basename(f);
const under = (f, dir) => f.startsWith(dir + '/');

/* FILE-04: folder names */
for (const dir of dirs) {
  const top = dir.split('/')[0];
  if (!['srv', 'db', 'test', 'app', 'mock-bank', 'tools'].includes(top)) continue;
  const name = base(dir);
  if (under(dir, 'app') && /\/webapp(\/|$)/.test(dir)) {
    // UI5 folders: lower case words, sub-folders of view and controller may group by feature
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) report.error('FILE-04', dir, 0, `Folder '${name}' in a UI5 app must be lowerCamelCase.`);
    continue;
  }
  if (name === '_i18n' || name === 'i18n') continue;
  if (!isKebab(name)) report.error('FILE-04', dir, 0, `Folder '${name}' must be kebab-case.`);
}

/* FILE-10: app folder names */
for (const dir of dirs.filter((d) => /^app\/[^/]+$/.test(d))) {
  const name = base(dir);
  if (!/^[a-z][a-z0-9]*$/.test(name)) report.error('FILE-10', dir, 0, `App folder '${name}' must be one lower-case word.`);
  else if (!config.apps[name]) report.warn('FILE-10', dir, 0, `App '${name}' is not registered in tools/lint/standards.config.mjs.`);
}

const viewNames = new Set(
  files.filter((f) => /\/webapp\/view\/.+\.view\.xml$/.test(f)).map((f) => `${f.split('/webapp/')[0]}|${base(f).replace('.view.xml', '')}`),
);

for (const file of files) {
  const name = base(file);

  /* FILE-01: CDS files */
  if (name.endsWith('.cds') && (under(file, 'db') || under(file, 'srv') || under(file, 'app'))) {
    if (!isKebab(name.replace(/\.cds$/, ''))) report.error('FILE-01', file, 0, `CDS file '${name}' must be kebab-case.`);
  }

  /* FILE-09: TypeScript only */
  if (/\.(js|cjs|mjs)$/.test(name) && (under(file, 'srv') || under(file, 'test') || /\/webapp\//.test(file))) {
    report.error('FILE-09', file, 0, `'${name}' must be written in TypeScript. JavaScript is allowed only for tooling and configuration.`);
  }

  /* FILE-02, FILE-03: service-layer TypeScript */
  if (name.endsWith('.ts') && (under(file, 'srv') || under(file, 'mock-bank'))) {
    const stem = name.replace(/\.d\.ts$/, '').replace(/\.ts$/, '');
    const parts = stem.split('.');
    if (!isKebab(parts[0]) || parts.length > 2 || (parts[1] && !/^[a-z]+$/.test(parts[1]))) {
      report.error(
        'FILE-02',
        file,
        0,
        `'${name}' must be kebab-case with at most one role suffix, for example 'policy-engine.ts' or 'ledger.port.ts'.`,
      );
    }
    for (const [dir, suffixes] of Object.entries(config.fileRoleSuffix)) {
      if (under(file, dir) && name !== 'index.ts' && !suffixes.some((s) => name.endsWith(s))) {
        report.error('FILE-03', file, 0, `Files in ${dir}/ must end with ${suffixes.join(' or ')}.`);
      }
    }
    if (name.endsWith('.test.ts')) report.error('FILE-08', file, 0, 'Tests belong in test/, mirroring the srv/ folder structure.');
  }

  /* FILE-08: tests */
  if (under(file, 'test') && name.endsWith('.ts')) {
    const helper = /^test\/(helpers|fixtures)\//.test(file);
    if (!helper && !name.endsWith('.test.ts')) {
      report.error('FILE-08', file, 0, `'${name}' must end with .test.ts, or move to test/helpers/ or test/fixtures/.`);
    }
    if (!isKebab(name.replace(/(\.test)?\.ts$/, ''))) report.error('FILE-02', file, 0, `'${name}' must be kebab-case.`);
  }

  /* FILE-05: UI5 views, fragments, controllers */
  if (/\/webapp\//.test(file)) {
    const app = file.split('/webapp/')[0];
    const m = name.match(/^(.+)\.(view|fragment)\.xml$/) || name.match(/^(.+)\.(controller)\.ts$/);
    if (m && !isPascal(m[1]))
      report.error(
        'FILE-05',
        file,
        0,
        `'${name}' must start with a PascalCase name, for example 'Workspace.${m[2]}.${m[2] === 'controller' ? 'ts' : 'xml'}'.`,
      );
    if (name.endsWith('.view.xml') && !/\/webapp\/view\//.test(file)) report.error('FILE-05', file, 0, 'Views belong in webapp/view/.');
    if (name.endsWith('.fragment.xml') && !/\/webapp\/(view|fragment)\//.test(file))
      report.error('FILE-05', file, 0, 'Fragments belong in webapp/view/ or webapp/fragment/.');
    if (name.endsWith('.controller.ts')) {
      if (!/\/webapp\/controller\//.test(file)) report.error('FILE-05', file, 0, 'Controllers belong in webapp/controller/.');
      const stem = name.replace('.controller.ts', '');
      if (stem !== 'BaseController' && !viewNames.has(`${app}|${stem}`)) {
        report.error('FILE-05', file, 0, `Controller '${stem}' has no view named '${stem}.view.xml'.`);
      }
    }
    if (name.endsWith('.xml') && /\/webapp\/(view|fragment)\//.test(file) && !/\.(view|fragment)\.xml$/.test(name)) {
      report.error('FILE-05', file, 0, `'${name}' must end with .view.xml or .fragment.xml.`);
    }

    /* FILE-06: i18n files */
    if (name.endsWith('.properties')) {
      if (!/\/webapp\/i18n\//.test(file)) report.error('FILE-06', file, 0, 'Text files belong in webapp/i18n/.');
      if (!/^i18n(_[a-z]{2}(_[A-Z]{2})?)?\.properties$/.test(name)) {
        report.error('FILE-06', file, 0, `'${name}' must be named i18n.properties or i18n_<language>[_<REGION>].properties.`);
      }
    }
  }

  /* FILE-07: seed data */
  if (/^(db|test)\/data\/.+\.csv$/.test(file)) {
    const m = name.match(/^([a-z][a-z0-9.]*)-([A-Za-z0-9]+)(\.texts|_texts)?\.csv$/);
    if (!m) report.error('FILE-07', file, 0, `'${name}' must be named <namespace>-<Entity>.csv.`);
    else {
      if (!config.namespaces.includes(m[1]))
        report.error('FILE-07', file, 0, `Namespace '${m[1]}' in '${name}' is not one of: ${config.namespaces.join(', ')}.`);
      if (!isPascal(m[2])) report.error('FILE-07', file, 0, `Entity part '${m[2]}' in '${name}' must be PascalCase.`);
    }
  }
}

/* FILE-11: project files of an app */
for (const [app, settings] of Object.entries(config.apps)) {
  if (!exists(args.root, `app/${app}/webapp`)) continue;
  const required = settings.type === 'freestyle' ? ['ui5.yaml', 'tsconfig.json', 'ui5lint.config.mjs'] : ['ui5.yaml'];
  for (const file of required) {
    if (!exists(args.root, `app/${app}/${file}`))
      report.error('FILE-11', `app/${app}`, 0, `Missing ${file}. Templates are in tools/lint/templates/.`);
  }
}

/* FILE-06: every app has a default text file */
for (const app of Object.keys(config.apps)) {
  if (exists(args.root, `app/${app}/webapp`) && !exists(args.root, `app/${app}/webapp/i18n/i18n.properties`)) {
    report.error('FILE-06', `app/${app}/webapp`, 0, 'Missing webapp/i18n/i18n.properties.');
  }
}

process.exit(report.finish(args.json));
