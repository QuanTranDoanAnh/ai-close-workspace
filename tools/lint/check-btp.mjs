#!/usr/bin/env node
/**
 * Checks SAP BTP deployment artefacts (rules BTP-01 to BTP-07):
 * mta.yaml, xs-security.json, package.json and secret handling.
 */
import YAML from 'yaml';
import config from './standards.config.mjs';
import { Report, parseArgs, read, exists, lineAt, isKebab, isPascal } from './lib/common.mjs';

const args = parseArgs();
const report = new Report('check-btp', args.root);
const id = config.mtaId;

/* ---------- mta.yaml ---------- */
if (exists(args.root, 'mta.yaml')) {
  const text = read(args.root, 'mta.yaml');
  const at = (needle) => {
    const i = text.indexOf(needle);
    return i < 0 ? 0 : lineAt(text, i);
  };
  let mta;
  try {
    mta = YAML.parse(text);
  } catch (e) {
    report.error('BTP-01', 'mta.yaml', 0, `mta.yaml is not valid YAML: ${e.message}`);
  }
  if (mta) {
    if (mta.ID !== id) report.error('BTP-01', 'mta.yaml', at('ID:'), `MTA ID must be '${id}', found '${mta.ID}'.`);
    if (!/^\d+\.\d+\.\d+$/.test(String(mta.version || '')))
      report.error('BTP-01', 'mta.yaml', at('version:'), 'MTA version must be a semantic version, for example 1.0.0.');
    for (const kind of ['modules', 'resources']) {
      for (const item of mta[kind] || []) {
        const name = String(item.name || '');
        if (!name.startsWith(id + '-') || !isKebab(name)) {
          report.error(
            'BTP-02',
            'mta.yaml',
            at(`name: ${name}`),
            `${kind === 'modules' ? 'Module' : 'Resource'} '${name}' must be kebab-case and start with '${id}-'.`,
          );
        }
      }
    }
    for (const res of mta.resources || []) {
      const serviceName = res.parameters && res.parameters['service-name'];
      if (serviceName && !String(serviceName).startsWith(id + '-')) {
        report.error(
          'BTP-02',
          'mta.yaml',
          at(`service-name: ${serviceName}`),
          `Service instance '${serviceName}' must start with '${id}-'.`,
        );
      }
    }
  }
}

/* ---------- xs-security.json ---------- */
if (exists(args.root, 'xs-security.json')) {
  const text = read(args.root, 'xs-security.json');
  const at = (needle) => {
    const i = text.indexOf(needle);
    return i < 0 ? 0 : lineAt(text, i);
  };
  let xs;
  try {
    xs = JSON.parse(text);
  } catch (e) {
    report.error('BTP-03', 'xs-security.json', 0, `xs-security.json is not valid JSON: ${e.message}`);
  }
  if (xs) {
    if (xs.xsappname !== id)
      report.error('BTP-03', 'xs-security.json', at('"xsappname"'), `xsappname must be '${id}', found '${xs.xsappname}'.`);
    const scopeNames = new Set();
    for (const scope of xs.scopes || []) {
      const m = String(scope.name || '').match(/^\$XSAPPNAME\.(.+)$/);
      if (!m || !isPascal(m[1])) {
        report.error('BTP-03', 'xs-security.json', at(`"${scope.name}"`), `Scope '${scope.name}' must be '$XSAPPNAME.<PascalCaseRole>'.`);
      } else scopeNames.add(m[1]);
      if (!scope.description)
        report.error('BTP-03', 'xs-security.json', at(`"${scope.name}"`), `Scope '${scope.name}' needs a description.`);
    }
    for (const tpl of xs['role-templates'] || []) {
      if (!isPascal(String(tpl.name || '')))
        report.error('BTP-03', 'xs-security.json', at(`"${tpl.name}"`), `Role template '${tpl.name}' must be PascalCase.`);
      else if (!scopeNames.has(tpl.name))
        report.warn('BTP-03', 'xs-security.json', at(`"${tpl.name}"`), `Role template '${tpl.name}' should have a scope of the same name.`);
    }
    for (const rc of xs['role-collections'] || []) {
      if (!String(rc.name || '').startsWith(config.roleCollectionPrefix)) {
        report.error(
          'BTP-04',
          'xs-security.json',
          at(`"${rc.name}"`),
          `Role collection '${rc.name}' must start with '${config.roleCollectionPrefix}'.`,
        );
      }
    }
  }
}

/* ---------- package.json ---------- */
if (exists(args.root, 'package.json')) {
  const text = read(args.root, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch {
    pkg = null;
  }
  if (pkg) {
    if (!pkg.engines || !pkg.engines.node)
      report.error('BTP-05', 'package.json', 0, 'package.json must pin the Node.js version in engines.node.');
    if (pkg.private !== true) report.error('BTP-05', 'package.json', 0, 'package.json must set "private": true.');
    const secretRe = /"(password|passwd|secret|clientsecret|client_secret|apikey|api_key|token)"\s*:\s*"[^"$][^"]*"/i;
    text.split(/\r?\n/).forEach((l, i) => {
      if (secretRe.test(l))
        report.error(
          'BTP-06',
          'package.json',
          i + 1,
          'Credentials must not be stored in package.json. Use service bindings and destinations.',
        );
    });
    for (const dep of Object.keys(pkg.dependencies || {})) {
      const v = String(pkg.dependencies[dep]);
      if (v === '*' || v === 'latest')
        report.error('BTP-05', 'package.json', 0, `Dependency '${dep}' must pin a version range, not '${v}'.`);
    }
  }
}

/* ---------- local secret files ---------- */
const gitignore = exists(args.root, '.gitignore') ? read(args.root, '.gitignore') : '';
for (const secretFile of ['default-env.json', '.env', '.cdsrc-private.json']) {
  const listed = gitignore.split(/\r?\n/).some((l) => l.trim() === secretFile || l.trim() === '/' + secretFile);
  if (!listed) report.error('BTP-07', '.gitignore', 0, `.gitignore must list '${secretFile}'.`);
}

process.exit(report.finish(args.json));
