# Lint kit

Enforces `docs/development-standards.md`. Rule IDs in the output (`CDS-03`, `FE-18`, `SRV-10`, ...) are the rule IDs of that document and of the specifications.

## Run

```sh
npm run lint            # everything, one summary
npm run lint:selftest   # proves the checks still work
node tools/lint/run.mjs --list
node tools/lint/run.mjs --only cds,files
```

Every custom check accepts `--root <dir>` to lint another folder and `--json` for machine-readable output.

## Steps

| Key | Tool | Covers |
|---|---|---|
| `es` | ESLint with `typescript-eslint` and `@sap/eslint-plugin-cds` | TypeScript rules, architecture boundaries, CAP model and handler rules, CSV headers |
| `format` | Prettier | Formatting of TypeScript, JavaScript, JSON, YAML |
| `types` | `run-tsc.mjs` | Strict compilation of the service layer and of each freestyle app |
| `cds` | `check-cds-model.mjs` | Naming and modelling rules on the compiled CDS model |
| `files` | `check-files.mjs` | File and folder names and locations |
| `fiori` | `check-fiori.mjs` | Automated SAP Fiori gates on manifests and views |
| `i18n` | `check-i18n.mjs` | Text keys, text types, missing and unused keys |
| `btp` | `check-btp.mjs` | `mta.yaml`, `xs-security.json`, `package.json`, secret files |
| `ui5` | `run-ui5lint.mjs` | UI5 linter in every app |

`check-commit-msg.mjs` runs in the `commit-msg` hook and in the pipeline.

## Change

All project-specific values are in `standards.config.mjs`. To change or add a rule, follow section 13.4 of the standards document: document first, then the check, then the fixtures in `selftest/fixtures.mjs`, then `npm run lint:selftest`.
