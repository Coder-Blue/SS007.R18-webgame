# ADR 0001: SolidJS 2 with TanStack Start RC

## Status

Accepted.

## Context

The brief requires SolidJS 2, TanStack Start, UI SDK for Solid, and a pure
functional game core. At the time of implementation:

- `solid-js@2.0.3` and `@solidjs/web@2.0.3` are the current Solid runtime.
- `@ui-sdk/solid@0.1.0-beta.13` explicitly requires Solid 2.
- `@tanstack/solid-start@2.0.0-rc.11` is the first TanStack Start line that
  accepts Solid 2. Its pinned `@tanstack/start-server-core@1.169.45` does not
  export the `request-scope` subpath that the Solid handler imports.
- TanStack Query 6 is required for Solid 2; version 5 targets Solid 1.

## Decision

Use the RC TanStack Start line with a checked-in pnpm patch:

```text
@tanstack/start-server-core/request-scope
  -> dist/esm/internal-request-response.js
```

That file already exports `finalizeResponse` and `withStartRequest`, the two
symbols the handler needs. The patch is applied by `pnpm install` through
`pnpm-workspace.yaml` and `patches/`. It is not a fork and contains no source
changes beyond the package export map.

The production deployment uses Nitro's `vercel` preset:
`NITRO_PRESET=vercel pnpm build` writes `.vercel/output`, and `vercel.json`
contains no static rewrite that would bypass the server function.

## Consequences

- The app builds, typechecks, SSRs, and hydrates with Solid 2.
- A future upstream release that exports `request-scope` lets us delete the
  patch without changing application code.
- The project follows RC versions and must re-run the quality gate after each
  TanStack update.
- Local development needs Node 22.12 or newer, matching the Solid 2 floor.
