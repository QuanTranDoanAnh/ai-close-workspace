#!/usr/bin/env node
/**
 * Automated SAP Fiori gates for the UI5 apps.
 * Rule IDs FE-xx are the development rules of the architecture specification, section 6.
 * Rule IDs UI-xx are the UI5 naming rules of docs/development-standards.md.
 */
import config from './standards.config.mjs';
import { Report, parseArgs, walk, read, exists, scanXml, lineAt, isCamel } from './lib/common.mjs';

const args = parseArgs();
const report = new Report('check-fiori', args.root);
const files = walk(args.root, 'app');

for (const [app, settings] of Object.entries(config.apps)) {
  const webapp = `app/${app}/webapp`;
  if (!exists(args.root, webapp)) continue;
  const appFiles = files.filter((f) => f.startsWith(webapp + '/'));
  const allowedLibs = settings.type === 'fe' ? config.feLibs : config.freestyleLibs;

  /* FE-04: no custom style sheets */
  for (const f of appFiles.filter((x) => /\.(css|less|scss|sass)$/.test(x))) {
    report.error('FE-04', f, 0, 'Custom style sheets are not allowed. Use standard controls and the standard margin and padding classes.');
  }

  checkManifest(app, webapp, settings, allowedLibs);

  for (const f of appFiles.filter((x) => /\.(view|fragment)\.xml$/.test(x))) checkView(f, settings, allowedLibs);

  /* FE-23: Fiori elements apps carry no freestyle views or controllers */
  if (settings.type === 'fe') {
    for (const f of appFiles.filter((x) => /\.(view\.xml|controller\.ts)$/.test(x))) {
      report.error(
        'FE-23',
        f,
        0,
        'A Fiori elements app must not contain freestyle views or controllers. Record a deviation if an extension is unavoidable.',
      );
    }
  }
}

function checkManifest(app, webapp, settings, allowedLibs) {
  const file = `${webapp}/manifest.json`;
  if (!exists(args.root, file)) {
    report.error('FE-06', file, 0, 'Missing manifest.json (app descriptor).');
    return;
  }
  let manifest;
  const text = read(args.root, file);
  try {
    manifest = JSON.parse(text);
  } catch (e) {
    report.error('FE-06', file, 0, `manifest.json is not valid JSON: ${e.message}`);
    return;
  }
  const at = (needle) => {
    const i = text.indexOf(needle);
    return i < 0 ? 0 : lineAt(text, i);
  };
  const sapApp = manifest['sap.app'] || {};
  const ui5 = manifest['sap.ui5'] || {};

  const expectedId = `${config.appIdPrefix}.${app}`;
  if (sapApp.id !== expectedId) report.error('UI-03', file, at('"id"'), `sap.app.id must be '${expectedId}', found '${sapApp.id}'.`);
  if (typeof sapApp.title !== 'string' || !/^\{\{.+\}\}$/.test(sapApp.title)) {
    report.error('FE-18', file, at('"title"'), "sap.app.title must be an i18n reference such as '{{appTitle}}'.");
  }
  if (!ui5.dependencies || !ui5.dependencies.minUI5Version) {
    report.error('FE-01', file, at('"dependencies"'), 'sap.ui5.dependencies.minUI5Version must pin the SAPUI5 version.');
  }
  for (const lib of Object.keys((ui5.dependencies && ui5.dependencies.libs) || {})) {
    if (!allowedLibs.includes(lib))
      report.error('FE-02', file, at(`"${lib}"`), `Library '${lib}' is not on the allow-list for a ${settings.type} app.`);
  }
  const density = ui5.contentDensities || {};
  if (density.compact !== true || density.cozy !== true) {
    report.error('FE-09', file, at('"contentDensities"'), 'sap.ui5.contentDensities must declare compact and cozy as true.');
  }
  if (!ui5.models || !ui5.models.i18n)
    report.error('FE-18', file, at('"models"'), "sap.ui5.models must declare the 'i18n' resource model.");
  const inbounds = sapApp.crossNavigation && sapApp.crossNavigation.inbounds;
  if (!inbounds || !Object.keys(inbounds).length) {
    report.error('FE-08', file, at('"sap.app"'), 'sap.app.crossNavigation.inbounds must declare the launchpad navigation target.');
  } else {
    for (const [key, inbound] of Object.entries(inbounds)) {
      if (!/^[A-Z][A-Za-z0-9]*$/.test(inbound.semanticObject || ''))
        report.error('UI-04', file, at(`"${key}"`), `Semantic object '${inbound.semanticObject}' must be PascalCase.`);
      if (!/^[a-z][A-Za-z0-9]*$/.test(inbound.action || ''))
        report.error('UI-04', file, at(`"${key}"`), `Navigation action '${inbound.action}' must be lowerCamelCase.`);
    }
  }
  if (/"theme"\s*:/.test(text)) report.error('FE-05', file, at('"theme"'), 'Do not set a theme in the app. The launchpad provides it.');
  for (const [name, source] of Object.entries(sapApp.dataSources || {})) {
    if (source.type === 'OData' && (!source.settings || source.settings.odataVersion !== '4.0')) {
      report.error('FE-17', file, at(`"${name}"`), `Data source '${name}' must be OData V4.`);
    }
  }
}

function checkView(file, settings, allowedLibs) {
  const text = read(args.root, file);
  const tags = scanXml(text);
  const prefixes = new Map(); // prefix -> namespace URI

  for (const { attrs } of tags) {
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'xmlns') prefixes.set('', value);
      else if (name.startsWith('xmlns:')) prefixes.set(name.slice(6), value);
    }
  }
  for (const [prefix, ns] of prefixes) {
    const line = lineAt(text, text.indexOf(`"${ns}"`));
    if (ns === 'http://www.w3.org/1999/xhtml') {
      report.error('FE-03', file, line, 'HTML in views is not allowed.');
    } else if (!allowedLibs.some((lib) => ns === lib || ns.startsWith(lib + '.')) && !config.technicalXmlNamespaces.includes(ns)) {
      report.error('FE-02', file, line, `Library '${ns}' (xmlns${prefix ? ':' + prefix : ''}) is not on the allow-list.`);
    }
  }

  for (const { tag, attrs, line } of tags) {
    const local = tag.includes(':') ? tag.split(':')[1] : tag;
    const rule = config.forbiddenControls[local];
    if (rule) report.error(rule, file, line, `Control '${local}' must not be used.`);

    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'style') report.error('FE-04', file, line, 'Inline styles are not allowed.');

      if (name === 'class') {
        for (const cls of value.split(/\s+/).filter(Boolean)) {
          if (!config.cssClassAllow.test(cls))
            report.error('FE-04', file, line, `CSS class '${cls}' is not a standard margin, padding or density class.`);
        }
      }

      if (config.textAttributes.includes(name) && value.trim() && !value.includes('{')) {
        report.error('FE-18', file, line, `Attribute ${name}="${value}" is a text literal. Bind it to the i18n model.`);
      }

      if ((name === 'icon' || name === 'activeIcon') && value && !value.includes('{') && !value.startsWith('sap-icon://')) {
        report.error('FE-21', file, line, `Icon '${value}' must come from the SAP icon font (sap-icon://).`);
      }

      if (name === 'id' && !isCamel(value)) {
        report.error(
          'UI-01',
          file,
          line,
          `Control ID '${value}' must be lowerCamelCase and end with the control type, for example 'approveButton'.`,
        );
      }

      if (config.eventAttributes.includes(name) && value.startsWith('.') && !/^\.on[A-Z]\w*$/.test(value.split('(')[0])) {
        report.error('UI-02', file, line, `Event handler '${value}' must be named .on<Subject><Event>, for example '.onApprovePress'.`);
      }

      if (/#[0-9a-fA-F]{3,8}\b/.test(value) && !value.includes('{') && ['color', 'backgroundColor', 'iconColor'].includes(name)) {
        report.error('FE-05', file, line, `Colour literal '${value}' is not allowed. Use semantic states.`);
      }
    }
  }
}

process.exit(report.finish(args.json));
