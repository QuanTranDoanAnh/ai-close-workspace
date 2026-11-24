---
paths:
  - "srv/**/*.ts"
  - "mock-bank/**/*.ts"
---

# Service layer (TypeScript on CAP Node.js)

Full rules: `docs/development-standards.md`, sections 5, 6 and 9. Check: `npm run lint:es`, `npm run lint:types`, `npm run lint:files`.

## Boundaries (SRV-10, enforced by ESLint)

| Folder | May import | Must not import |
|---|---|---|
| `srv/policy/`, `srv/impact/` | types from `srv/ports/` | CAP, AI SDK, agent frameworks, adapters, agents, handlers |
| `srv/ports/` | types only, no classes | everything else |
| `srv/agents/` | ports, policy, impact, agent framework | adapters, handlers, AI SDK |
| `srv/adapters/model/` | ports, AI SDK | agents, handlers |
| other `srv/adapters/` | ports, CAP | AI SDK, agent frameworks, agents, handlers |
| `srv/*-service.ts`, `conversation/`, `orchestrator/`, `scheduler/` | any of the above | AI SDK, agent frameworks |

If an import is rejected, the design is wrong, not the rule. Add a port, or pass the value in as a parameter.

## Files

- kebab-case with a role suffix by folder: `ledger.port.ts`, `s4-ledger.adapter.ts`, `accruals.agent.ts`, `post-journal-entry.tool.ts` (FILE-02, FILE-03).
- TypeScript only. No `.js` in `srv/`, `test/` or `webapp/` (FILE-09).

## Code

- No `any`; use `unknown` and narrow it. `import type` for types. No non-null assertion (TS-02, TS-03, TS-05).
- Every promise is awaited, returned or handled (TS-04).
- Exported functions declare parameter and return types (TS-08).
- Configuration through `cds.env`, never `process.env` (SRV-12). Logging through `cds.log('<module>')`, never `console` (SRV-15).
- Errors: `req.error` or `req.reject` with a numeric status and a text key from `srv/_i18n` (SRV-14).
- Handlers keep no state in module variables shared between requests (SRV-13).
- Keep units small: complexity up to 12, 4 parameters, nesting 4, 400 lines per file (TS-07).
- Validate everything that comes back from a model with `zod` before it is used.
