# GitHub Language Policy

The game is TypeScript-first. The repository's primary language must remain
TypeScript on GitHub.

Third-party agent skill bundles under `.agents/`, `.claude/`, `.codex/` and
`.opencode/` are vendored material. `docs/` and Markdown files are
documentation. Both groups are excluded from language statistics through the
root `.gitattributes`:

```
.agents/** linguist-vendored linguist-detectable=false
.claude/** linguist-vendored linguist-detectable=false
.codex/** linguist-vendored linguist-detectable=false
.opencode/** linguist-vendored linguist-detectable=false
docs/** linguist-documentation linguist-detectable=false
*.md linguist-documentation linguist-detectable=false
*.js linguist-detectable=false
*.mjs linguist-detectable=false
*.cmd linguist-detectable=false
```

The game itself lives in `src/*.ts` and `src/*.tsx`, plus the small Vite,
Vitest, Playwright and TypeScript configuration files. The CSS, Nix and shell
content is the remaining non-TypeScript footprint.

When adding a vendored runtime or generated JavaScript bundle, place it in one
of the excluded directories or add a narrow `linguist-detectable=false` rule.
Do not mark the game's own TypeScript as vendored.
