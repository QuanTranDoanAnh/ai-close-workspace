#!/usr/bin/env node
/**
 * Checks the compiled CDS model against the naming and modelling standards
 * (rules CDS-01 to CDS-14 and SRV-01 to SRV-07 in docs/development-standards.md).
 * It complements `cds lint`, which covers the generic CAP rules.
 */
import fs from 'node:fs';
import path from 'node:path';
import cds from '@sap/cds';
import config from './standards.config.mjs';
import { Report, parseArgs, walk, isCamel, isKebab, isPascal, isUpperSnake, lastWord, looksPlural, singular } from './lib/common.mjs';

const args = parseArgs();
const report = new Report('check-cds-model', args.root);

// Load every .cds file, also those CAP would not pick up by itself, so that misplaced files are reported too.
const sources = ['db', 'srv', 'app']
  .filter((d) => fs.existsSync(path.join(args.root, d)))
  .flatMap((d) => walk(args.root, d).filter((f) => f.endsWith('.cds')))
  .map((f) => path.join(args.root, f));
if (!sources.length) {
  console.log('check-cds-model: no .cds files under db/, srv/ or app/, nothing to check');
  process.exit(0);
}

cds.root = args.root;
let csn;
try {
  csn = await cds.load(sources, { docs: true });
} catch (e) {
  report.error('CDS-00', '', 0, `Model does not compile: ${String(e.message).split('\n')[0]}`);
  process.exit(report.finish(args.json));
}

const defs = csn.definitions;
const locOf = (def) => {
  const l = def && def.$location;
  return l && l.file ? { file: path.resolve(args.root, l.file), line: l.line } : { file: '', line: 0 };
};
const isOwn = (def) => {
  const { file } = locOf(def);
  return file && !file.includes('node_modules');
};
const rel = (file) => path.relative(args.root, file).split(path.sep).join('/');
const serviceNames = Object.keys(defs).filter((n) => defs[n].kind === 'service');
const serviceOf = (name) => serviceNames.find((s) => name.startsWith(s + '.'));
const isGenerated = (name) => /(\.texts|_texts|\.drafts|DraftAdministrativeData)$/.test(name);
const resolveType = (el) => (el.type && defs[el.type] ? resolveType(defs[el.type]) || defs[el.type] : el);
const isAssoc = (el) => el.type === 'cds.Association' || el.type === 'cds.Composition';

/* ---------- services ---------- */
const servicesPerFile = new Map();
for (const name of serviceNames) {
  const def = defs[name];
  if (!isOwn(def)) continue;
  const { file, line } = locOf(def);
  const short = name.split('.').pop();

  if (!isPascal(short) || !short.endsWith('Service')) {
    report.error('SRV-01', file, line, `Service '${name}' must be PascalCase and end with 'Service'.`);
  }
  if (name.includes('.')) {
    report.error('SRV-01', file, line, `Service '${name}' must be defined without a namespace.`);
  }
  if (def['@requires'] === undefined && def['@restrict'] === undefined) {
    report.error('SRV-02', file, line, `Service '${name}' has no @requires or @restrict annotation.`);
  }
  if (path.posix.dirname(rel(file)) !== 'srv') {
    report.error('CDS-14', file, line, `Service '${name}' must be defined directly in srv/, next to its handler file.`);
  }
  const expected = short.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() + '.cds';
  if (path.basename(file) !== expected) {
    report.error('SRV-07', file, line, `Service '${name}' must be defined in a file named '${expected}'.`);
  }
  servicesPerFile.set(file, [...(servicesPerFile.get(file) || []), name]);
}
for (const [file, names] of servicesPerFile) {
  if (names.length > 1) report.error('SRV-07', file, 0, `One service per file. Found: ${names.join(', ')}.`);
}

/* ---------- definitions ---------- */
for (const [name, def] of Object.entries(defs)) {
  if (!isOwn(def) || isGenerated(name)) continue;
  const { file, line } = locOf(def);
  const service = serviceOf(name);
  const short = name.split('.').pop();

  if (def.kind === 'entity') {
    checkReserved(short, `Entity '${name}'`, file, line);
    if (!isPascal(short)) report.error('CDS-02', file, line, `Entity '${name}' must be PascalCase without underscores.`);
    if (!service) {
      const ns = name.slice(0, name.length - short.length - 1);
      if (!config.namespaces.includes(ns)) {
        report.error('CDS-01', file, line, `Entity '${name}' must be in one of the namespaces: ${config.namespaces.join(', ')}.`);
      }
      if (!rel(file).startsWith('db/')) report.error('CDS-14', file, line, `Entity '${name}' must be defined under db/.`);
      if (!looksPlural(short) && !config.entityPluralExceptions.includes(short)) {
        report.error('CDS-03', file, line, `Entity '${name}' must have a plural name.`);
      }
      if (!Object.values(def.elements || {}).some((e) => e.key)) {
        report.error('CDS-12', file, line, `Entity '${name}' has no key.`);
      }
    } else if (!def.query && !def.projection) {
      report.error('SRV-03', file, line, `Entity '${name}' must be a projection on a db entity. Services define no persistence.`);
    }
    checkElements(name, def, service);
    for (const [aName, action] of Object.entries(def.actions || {})) {
      if (!isCamel(aName)) {
        const l = locOf(action);
        report.error('SRV-04', l.file || file, l.line || line, `Bound ${action.kind} '${name}.${aName}' must be camelCase.`);
      }
    }
  } else if (def.kind === 'type' || def.kind === 'aspect') {
    if (!isPascal(short)) report.error('CDS-04', file, line, `${def.kind} '${name}' must be PascalCase.`);
    else if (looksPlural(short)) report.warn('CDS-04', file, line, `${def.kind} '${name}' should have a singular name.`);
    if (def.enum) checkEnum(name, def, file, line);
    if (def.elements) checkElements(name, def, service);
  } else if (def.kind === 'action' || def.kind === 'function') {
    if (!isCamel(short)) report.error('SRV-04', file, line, `${def.kind} '${name}' must be camelCase.`);
  } else if (def.kind === 'event') {
    if (!isPascal(short))
      report.error('SRV-05', file, line, `Event '${name}' must be PascalCase in past tense, for example 'RunCompleted'.`);
  }
}

function checkEnum(owner, def, file, line) {
  for (const value of Object.keys(def.enum)) {
    if (!isUpperSnake(value)) report.error('CDS-11', file, line, `Enum value '${value}' of '${owner}' must be UPPER_SNAKE_CASE.`);
  }
}

function checkElements(owner, def, service) {
  const ownerShort = owner.split('.').pop();
  const ownerSingular = singular(lastWord(ownerShort)).toLowerCase();
  const isProjection = Boolean(def.query || def.projection);
  for (const [eName, el] of Object.entries(def.elements || {})) {
    const l = locOf(el);
    const file = l.file || locOf(def).file;
    const line = l.line || locOf(def).line;
    if (!isOwnFile(file)) continue;

    if (!(service && isProjection)) checkReserved(eName, `Element '${ownerShort}.${eName}'`, file, line);
    if (eName !== 'ID' && !isCamel(eName)) {
      report.error('CDS-05', file, line, `Element '${ownerShort}.${eName}' must be camelCase. Only the key 'ID' is upper case.`);
    }

    if (service) {
      if (config.labelledServices.includes(service)) checkLabel(owner, eName, el, file, line);
      if (isProjection) continue; // naming of projected elements is checked on the db entity
    }

    const prefix = new RegExp(`^${ownerSingular}[A-Z_]`);
    if (ownerSingular.length > 2 && prefix.test(eName)) {
      report.error('CDS-06', file, line, `Element '${ownerShort}.${eName}' repeats the entity name. Drop the '${ownerSingular}' prefix.`);
    }

    if (isAssoc(el)) {
      const toMany = el.cardinality && el.cardinality.max === '*';
      if (toMany && !looksPlural(eName))
        report.error('CDS-08', file, line, `To-many association '${ownerShort}.${eName}' must have a plural name.`);
      if (!toMany && looksPlural(eName))
        report.error('CDS-08', file, line, `To-one association '${ownerShort}.${eName}' must have a singular name.`);
      continue;
    }

    const resolved = resolveType(el);
    const baseType = resolved.type || el.type;
    if (baseType === 'cds.Boolean' && !/^(is|has|can|should)[A-Z]/.test(eName)) {
      report.warn('CDS-07', file, line, `Boolean '${ownerShort}.${eName}' should start with is, has, can or should.`);
    }
    if (config.enumElements.includes(eName) && !el.enum && !resolved.enum) {
      report.error(
        'CDS-10',
        file,
        line,
        `Element '${ownerShort}.${eName}' must use an enum type, not a plain ${String(baseType).replace('cds.', '')}.`,
      );
    }
    if (el.enum) checkEnum(`${ownerShort}.${eName}`, el, file, line);
    if (baseType === 'cds.String' && !resolved.length && !el.length && !resolved.enum && !el.enum) {
      report.warn('CDS-13', file, line, `String '${ownerShort}.${eName}' should declare a length.`);
    }
    if (baseType === 'cds.Decimal' && (resolved.precision ?? el.precision) === undefined) {
      report.error('CDS-13', file, line, `Decimal '${ownerShort}.${eName}' must declare precision and scale.`);
    }
  }
}

function checkReserved(name, what, file, line) {
  if (config.reservedWords.includes(name.toUpperCase())) {
    report.error('CDS-09', file, line, `${what} uses the SQL reserved word '${name}'. Choose another name.`);
  }
}

function checkLabel(owner, eName, el, file, line) {
  if (config.unlabelledElements.includes(eName) || isAssoc(el)) return;
  const label = el['@title'] ?? el['@Common.Label'];
  const ownerShort = owner.split('.').pop();
  if (label === undefined) {
    report.error('SRV-06', file, line, `Element '${ownerShort}.${eName}' is shown in a Fiori elements app and needs a @title.`);
  } else if (typeof label !== 'string' || !/^\{i18n>[^}]+\}$/.test(label)) {
    report.error('SRV-06', file, line, `@title of '${ownerShort}.${eName}' must be an i18n reference such as '{i18n>${eName}}'.`);
  }
}

function isOwnFile(file) {
  return file && !file.includes('node_modules');
}

/* ---------- cds file names ---------- */
for (const file of csn.$sources || []) {
  if (file.includes('node_modules')) continue;
  const base = path.basename(file, '.cds');
  if (!isKebab(base)) report.error('FILE-01', file, 0, `CDS file '${path.basename(file)}' must be kebab-case.`);
}

process.exit(report.finish(args.json));
