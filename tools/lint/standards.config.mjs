/**
 * Project-specific settings for the custom standards checks.
 * Rule IDs refer to docs/development-standards.md.
 * Change values here, not in the check scripts.
 */
export default {
  /** CDS namespaces allowed for persistence definitions (CDS-01). */
  namespaces: ['closeworkspace', 'sim'],

  /** Reverse-domain prefix of every UI5 app ID (UI-03). Replace with your own. */
  appIdPrefix: 'com.example.closeworkspace',

  /** MTA ID and prefix of all modules, resources and the xsappname (BTP-01 to BTP-03). */
  mtaId: 'closeworkspace',

  /** Display prefix of every role collection (BTP-04). */
  roleCollectionPrefix: 'Close Workspace ',

  /** Entity names that are valid although they do not look plural (CDS-03). Keep this list short. */
  entityPluralExceptions: [],

  /**
   * SQL reserved words that must not be used as entity or element names (CDS-09).
   * A curated list for SAP HANA and SQLite, not an exhaustive one. Extend it when a deployment fails on a name.
   */
  reservedWords: [
    'ADD',
    'ALL',
    'ALTER',
    'AND',
    'AS',
    'ASC',
    'BEGIN',
    'BETWEEN',
    'BY',
    'CASE',
    'CHECK',
    'COLUMN',
    'CONSTRAINT',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURSOR',
    'DECLARE',
    'DEFAULT',
    'DELETE',
    'DESC',
    'DISTINCT',
    'DROP',
    'ELSE',
    'END',
    'EXCEPT',
    'EXISTS',
    'FALSE',
    'FOR',
    'FOREIGN',
    'FROM',
    'FULL',
    'GROUP',
    'HAVING',
    'IF',
    'IN',
    'INDEX',
    'INNER',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'JOIN',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LOOP',
    'MINUS',
    'NATURAL',
    'NOT',
    'NULL',
    'ON',
    'OR',
    'ORDER',
    'OUT',
    'PRIMARY',
    'REFERENCES',
    'RETURN',
    'RETURNS',
    'RIGHT',
    'ROLLUP',
    'ROWID',
    'SELECT',
    'SET',
    'SQL',
    'START',
    'TABLE',
    'THEN',
    'TO',
    'TOP',
    'TRANSACTION',
    'TRUE',
    'UNION',
    'UNIQUE',
    'UPDATE',
    'USING',
    'VALUES',
    'WHEN',
    'WHERE',
    'WHILE',
    'WITH',
  ],

  /** Element names that must be typed with an enum type (CDS-10). */
  enumElements: ['status', 'mode', 'role', 'actorType', 'reasonCode', 'messageIntent', 'scenario'],

  /** Services whose entities feed Fiori elements apps and therefore need labels on every element (SRV-06). */
  labelledServices: ['GovernanceService', 'DemoAdminService'],

  /** Technical elements that need no label (SRV-06). */
  unlabelledElements: ['ID', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'],

  /** Apps and their kind. Freestyle apps get the full view checks, Fiori elements apps the manifest checks. */
  apps: {
    workspace: { type: 'freestyle' },
    governance: { type: 'fe' },
    admin: { type: 'fe' },
  },

  /** Control libraries allowed in freestyle apps (FE-02). */
  freestyleLibs: ['sap.m', 'sap.f', 'sap.ui.core', 'sap.ui.layout', 'sap.uxap', 'sap.suite.ui.commons'],

  /** Libraries allowed in Fiori elements apps (FE-02). */
  feLibs: ['sap.m', 'sap.f', 'sap.ui.core', 'sap.ushell', 'sap.fe.templates', 'sap.fe.core', 'sap.fe.macros', 'sap.ui.mdc'],

  /** XML namespaces that are not control libraries but are allowed in views. */
  technicalXmlNamespaces: [
    'sap.ui.core.mvc',
    'http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1',
    'http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1',
  ],

  /** Standard SAPUI5 CSS classes allowed in the class attribute (FE-04). */
  cssClassAllow:
    /^sapUi(NoMargin|NoContentPadding|ContentPadding|ResponsiveMargin|ResponsiveContentPadding|ForceWidthAuto|(Tiny|Small|Medium|Large)Margin(Top|Bottom|Begin|End|TopBottom|BeginEnd)?|Size(Compact|Cozy))$/,

  /** Controls that must not be used (FE-03, FE-11, FE-22). */
  forbiddenControls: {
    HTML: 'FE-03',
    FlexibleColumnLayout: 'FE-11',
    ToolPage: 'FE-11',
    SimpleForm: 'FE-22',
  },

  /** Attributes that carry user-visible text and must be bound to i18n (FE-18). */
  textAttributes: [
    'text',
    'title',
    'label',
    'tooltip',
    'placeholder',
    'headerText',
    'noDataText',
    'description',
    'intro',
    'info',
    'subtitle',
    'additionalText',
    'emptyText',
    'valueStateText',
    'sender',
  ],

  /** Event attributes whose handlers must be named .on<Something> (UI-02). */
  eventAttributes: [
    'press',
    'change',
    'liveChange',
    'select',
    'selectionChange',
    'itemPress',
    'submit',
    'post',
    'search',
    'close',
    'afterClose',
    'beforeOpen',
    'afterOpen',
    'updateFinished',
    'navButtonPress',
    'confirm',
    'cancel',
  ],

  /** Text type codes accepted in i18n annotations (I18N-02). */
  i18nTextTypes: [
    'XACT',
    'XBUT',
    'XCKL',
    'XCOL',
    'XFLD',
    'XGRP',
    'XLNK',
    'XLOG',
    'XLST',
    'XMIT',
    'XMSG',
    'XRBL',
    'XSEL',
    'XTIT',
    'XTOL',
    'YINS',
    'YMSG',
    'NOTR',
  ],

  /** Role suffix a TypeScript file must carry, by folder under srv/ (FILE-03). */
  fileRoleSuffix: {
    'srv/ports': ['.port.ts'],
    'srv/adapters': ['.adapter.ts'],
    'srv/agents': ['.agent.ts', '.tool.ts'],
  },

  /** Conventional Commits settings (GIT-01). */
  commit: {
    types: ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'build', 'ci', 'perf'],
    scopes: [
      'workspace',
      'governance',
      'admin',
      'srv',
      'conversation',
      'orchestrator',
      'agents',
      'policy',
      'impact',
      'scheduler',
      'adapters',
      'db',
      'mock-bank',
      'lint',
      'docs',
      'deploy',
      'deps',
    ],
    maxSubjectLength: 72,
  },
};
