---
paths:
  - "mta.yaml"
  - "xs-security.json"
  - "package.json"
  - "**/xs-app.json"
  - "**/ui5.yaml"
---

# SAP BTP artefacts

Full rules: `docs/development-standards.md`, section 10. Check: `npm run lint:btp`.

- MTA ID `closeworkspace`, semantic version. Modules, resources and service instances are kebab-case and start with `closeworkspace-` (BTP-01, BTP-02).
- `xsappname` is `closeworkspace`. Scopes are `$XSAPPNAME.<Role>` with a description; role templates are PascalCase and match their scope; role collections start with `Close Workspace ` (BTP-03, BTP-04).
- Roles are exactly `Controller`, `Auditor`, `Viewer`, `DemoAdmin`, the same names CDS uses in `@requires` (BTP-10).
- `package.json` is private, pins the Node.js version and pins dependency ranges. `package-lock.json` is committed (BTP-05, BTP-09).
- A new dependency needs the user's approval and its own commit of type `build(deps)`.
- No credentials in any committed file. Destinations are UPPER_SNAKE_CASE, system first, one per agent user: `S4HC_AGENT_ACCRUALS`, `BANK_MOCK` (BTP-06, BTP-08).
- Building the archive (`mbt`) and deploying (`cf`) are done by the user.
