/**
 * ESLint flat configuration for the Close Workspace solution.
 * Rule IDs in comments refer to docs/development-standards.md.
 *
 * Layers:
 *   1. CDS models and seed data      -> @sap/eslint-plugin-cds (CAP's own rules)
 *   2. All TypeScript                -> typescript-eslint, naming convention, async safety
 *   3. Service layer by folder       -> architecture boundaries
 *   4. UI5 apps                      -> Fiori code rules
 *   5. Tests and tooling             -> relaxed
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import cds from '@sap/eslint-plugin-cds';

/* ---------- TS-01: naming convention ---------- */
const naming = [
  'error',
  { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'import', format: ['camelCase', 'PascalCase'] },
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
  // const { Runs, Proposals } = cds.entities
  { selector: 'variable', modifiers: ['destructured'], format: null },
  { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
  { selector: 'enumMember', format: ['UPPER_CASE'] },
  { selector: 'classProperty', modifiers: ['static', 'readonly'], format: ['UPPER_CASE', 'camelCase'] },
  // OData payloads, CQN objects and annotation keys follow external names
  { selector: ['objectLiteralProperty', 'objectLiteralMethod', 'typeProperty'], format: null },
];

/* ---------- SRV-10: architecture boundaries ---------- */
const AI_SDK = { group: ['@sap-ai-sdk/*'], message: 'SRV-10: only srv/adapters/model may import the AI SDK. Use the ModelPort.' };
const AGENT_FRAMEWORK = {
  group: ['@langchain/*', 'langchain', 'langchain/*'],
  message: 'SRV-10: agent frameworks are used in srv/agents only.',
};
const CAP = {
  group: ['@sap/cds', '@sap/cds/*', '@cap-js/*'],
  message: 'SRV-11: this module is plain TypeScript and must not depend on CAP.',
};
const dir = (name, why) => ({ group: [`**/${name}/**`, `**/${name}`], message: `SRV-10: ${why}` });
const handlers = (why) => ({ group: ['**/*-service', '**/*-service.js', '**/*-service.ts'], message: `SRV-10: ${why}` });
const restrict = (...patterns) => ['error', { patterns }];

const srvFiles = (sub) => [`**/srv/${sub}/**/*.ts`];

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/gen/', '**/dist/', '**/coverage/', '**/@cds-models/', '.lint-selftest/', '**/resources/']),

  /* ===== 1. CDS models and seed data ===== */
  cds.configs.recommended,
  {
    name: 'standards/cds',
    files: ['**/*.cds'],
    rules: {
      '@sap/cds/start-entities-uppercase': 'error', // CDS-02
      '@sap/cds/no-db-keywords': 'error', // CDS-09
      '@sap/cds/no-dollar-prefixed-names': 'error',
      '@sap/cds/auth-use-requires': 'error', // SRV-02
      '@sap/cds/sql-null-comparison': 'error',
      '@sap/cds/no-join-on-draft': 'error',
    },
  },
  {
    name: 'standards/csv',
    files: ['**/*.csv'],
    rules: { '@sap/cds/valid-csv-header': 'error' }, // FILE-07
  },

  /* ===== 2. All TypeScript ===== */
  {
    name: 'standards/typescript',
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/naming-convention': naming, // TS-01
      '@typescript-eslint/no-explicit-any': 'error', // TS-02
      '@typescript-eslint/consistent-type-imports': 'error', // TS-03
      '@typescript-eslint/no-floating-promises': 'error', // TS-04
      '@typescript-eslint/no-misused-promises': 'error', // TS-04
      '@typescript-eslint/await-thenable': 'error', // TS-04
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error', // TS-05
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'error', // TS-06
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme'], location: 'start' }],
      complexity: ['warn', 12], // TS-07
      'max-params': ['warn', 4], // TS-07
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }], // TS-07
      'max-depth': ['warn', 4], // TS-07
    },
  },

  /* ===== 3. Service layer ===== */
  {
    name: 'standards/srv',
    files: ['**/srv/**/*.ts', '**/mock-bank/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { '@sap/cds': cds },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error', // TS-08
      'no-restricted-properties': ['error', { object: 'process', property: 'env', message: 'SRV-12: read configuration through cds.env.' }],
      'no-restricted-imports': restrict(AI_SDK, AGENT_FRAMEWORK),
      '@sap/cds/no-shared-handler-variable': 'error', // SRV-13
      '@sap/cds/no-deep-sap-cds-import': 'error', // SRV-13
      '@sap/cds/no-cross-service-import': 'error', // SRV-13
      '@sap/cds/case-sensitive-well-known-events': 'error', // SRV-13
    },
  },
  {
    name: 'standards/srv/pure',
    files: [...srvFiles('policy'), ...srvFiles('impact')],
    rules: {
      'no-restricted-imports': restrict(
        AI_SDK,
        AGENT_FRAMEWORK,
        CAP,
        dir('adapters', 'policy and impact must not reach into adapters.'),
        dir('agents', 'policy and impact must not depend on agents.'),
        handlers('policy and impact must not depend on service handlers.'),
        dir('conversation', 'policy and impact must not depend on the conversation handler.'),
        dir('orchestrator', 'policy and impact must not depend on the orchestrator.'),
      ),
      // SRV-11: deterministic, so that rules R1 to R3, R9, R10 and R13 are unit-testable
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'SRV-11: policy and impact code must be deterministic.' },
        { object: 'Date', property: 'now', message: 'SRV-11: pass the time in as a parameter.' },
        { object: 'process', property: 'env', message: 'SRV-12: pass configuration in as a parameter.' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'SRV-11: pass the time in as a parameter.' },
      ],
    },
  },
  {
    name: 'standards/srv/ports',
    files: srvFiles('ports'),
    rules: {
      'no-restricted-imports': restrict(
        AI_SDK,
        AGENT_FRAMEWORK,
        dir('adapters', 'ports are interfaces and must not know adapters.'),
        dir('agents', 'ports must not depend on agents.'),
        handlers('ports must not depend on service handlers.'),
      ),
      'no-restricted-syntax': ['error', { selector: 'ClassDeclaration', message: 'SRV-10: ports contain interfaces and types only.' }],
    },
  },
  {
    name: 'standards/srv/agents',
    files: srvFiles('agents'),
    rules: {
      'no-restricted-imports': restrict(
        AI_SDK,
        dir('adapters', 'agents reach systems through ports, never through adapters.'),
        handlers('agents must not depend on service handlers.'),
      ),
    },
  },
  {
    name: 'standards/srv/adapters',
    files: srvFiles('adapters'),
    ignores: ['**/srv/adapters/model/**'],
    rules: {
      'no-restricted-imports': restrict(
        AI_SDK,
        AGENT_FRAMEWORK,
        dir('agents', 'adapters must not depend on agents.'),
        handlers('adapters must not depend on service handlers.'),
      ),
    },
  },
  {
    name: 'standards/srv/adapters/model',
    files: ['**/srv/adapters/model/**/*.ts'],
    rules: {
      'no-restricted-imports': restrict(
        dir('agents', 'adapters must not depend on agents.'),
        handlers('adapters must not depend on service handlers.'),
      ),
    },
  },

  /* ===== 4. UI5 apps ===== */
  {
    name: 'standards/ui5',
    files: ['**/app/**/webapp/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, sap: 'readonly' } },
    rules: {
      // FE-03: no direct DOM access
      'no-restricted-globals': [
        'error',
        ...['document', 'jQuery', '$'].map((name) => ({ name, message: 'FE-03: no direct DOM access. Use control APIs.' })),
        ...['alert', 'confirm', 'prompt'].map((name) => ({ name, message: 'FE-14: use sap.m.MessageBox or sap.m.MessageToast.' })),
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.property.name='getDomRef']", message: 'FE-03: no direct DOM access.' },
        { selector: "MemberExpression[property.name='innerHTML']", message: 'FE-03: no direct DOM access.' },
        {
          selector: "CallExpression[callee.property.name='addStyleClass'][arguments.0.type='Literal']:not([arguments.0.value=/^sapUi/])",
          message: 'FE-04: only standard SAPUI5 margin, padding and density classes.',
        },
        {
          selector: "CallExpression[callee.object.name=/^Message(Toast|Box)$/][arguments.0.type='Literal']",
          message: 'FE-18: texts come from the i18n model, not from literals.',
        },
        {
          selector: "CallExpression[callee.property.name=/^set(Text|Title|Tooltip|Placeholder)$/][arguments.0.type='Literal']",
          message: 'FE-18: texts come from the i18n model, not from literals.',
        },
      ],
      'no-restricted-imports': restrict(
        { group: ['**/srv/**', '**/db/**'], message: 'UI-05: apps talk to services through OData only.' },
        { group: ['jquery', 'sap/ui/thirdparty/*'], message: 'FE-03: no jQuery or third-party libraries.' },
        { group: ['node:*', 'fs', 'path'], message: 'UI-05: no Node.js modules in browser code.' },
      ),
    },
  },

  /* ===== 5. Tests and tooling ===== */
  {
    name: 'standards/tests',
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'max-lines': 'off',
      'no-restricted-imports': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    name: 'standards/tooling',
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node, sourceType: 'module' },
    rules: { 'no-console': 'off', eqeqeq: ['error', 'always'], 'prefer-const': 'error' },
  },
]);
