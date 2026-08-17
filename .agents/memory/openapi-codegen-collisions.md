---
name: OpenAPI codegen collisions
description: Orval codegen pitfalls in this workspace's api-spec pipeline
---

Rule: In `lib/api-spec/openapi.yaml`, define every non-trivial request body as a named schema under `components/schemas` and `$ref` it — never inline an object body.

**Why:** Orval generates a zod const (e.g. `UpsertOverrideBody`) in `api.ts` and a type of the same name in `types/`, and the barrel re-export fails typecheck with TS2308 ambiguity. Also avoid `format: email`/`format: uri` in schemas — the generated `zod.email()`/`zod.url()` calls don't exist in the workspace's zod v3 top-level import.

**How to apply:** When adding endpoints, add a `XxxRequest` component schema per body, then run `pnpm --filter @workspace/api-spec run codegen` and fix any remaining ambiguity before proceeding.
