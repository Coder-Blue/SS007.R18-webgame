# Security

## Reporting

Do not open a public issue for a vulnerability. Contact the repository owner
through the private security advisory flow on GitHub.

## Scope

The game is a static client-side simulation. It has no authentication, server
database, payment flow or user-generated content. The relevant risks are:

- malicious save files imported from disk;
- dependency compromise;
- browser storage tampering;
- denial of service through oversized import payloads.

## Controls

- Save imports are bounded and validated with Valibot. Unknown versions are
  rejected with a clear Vietnamese message.
- Imported JSON cannot execute code; no `eval`, `Function` constructor, or
  dynamic script injection exists.
- Exported saves contain only game state and UI preferences.
- Dependencies are pinned by `pnpm-lock.yaml`; `pnpm audit` is part of release
  review.
- The app collects no telemetry and sets no third-party cookies.
