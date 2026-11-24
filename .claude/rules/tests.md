---
paths:
  - "test/**"
---

# Tests

Full rules: `docs/development-standards.md`, section 11. Run: `npm test`, or `npx jest test/<folder>` while iterating.

- Tests mirror `srv/`: `srv/policy/policy-engine.ts` is tested in `test/policy/policy-engine.test.ts`. Helpers in `test/helpers/`, data in `test/fixtures/` (FILE-08).
- `describe` names the unit. The test name states the behaviour: `holds an entry above the limit (R1)`. One behaviour per test (TEST-02).
- Every behavioural rule R1 to R13 has at least one test whose name contains the rule ID (TEST-03).
- A test written for an acceptance criterion carries its ID in the name: `(INT-04 AC-2)`.
- Service tests run through `cds.test` on in-memory SQLite with the seed data. The model is the replay adapter. No test calls a live system or a live model (TEST-04).
- Policy and impact code is pure, so it is tested without mocks (TEST-06).
- Assert on the seed-data check values of `docs/intent-spec.md`, section 13, where a criterion names them.
- A test is not changed to make an implementation pass. If a test is wrong, say why in your result and fix the test in a separate, named step.
