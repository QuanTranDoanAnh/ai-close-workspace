/**
 * UI5 linter configuration. Copy this file into each app folder (app/<name>/ui5lint.config.mjs).
 * The UI5 linter runs with all of its rules by default. Do not switch rules off here:
 * a finding that cannot be fixed needs an entry in docs/fiori-deviations.md.
 */
export default {
  ignores: ['dist/**', 'webapp/test/**', 'webapp/localService/**'],
};
