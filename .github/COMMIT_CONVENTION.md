# Commit message convention

This project uses Conventional Commits. The header is mandatory; the scope is
optional; the subject is imperative and lower-case.

```text
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

| Type | Use |
| --- | --- |
| `feat` | a player-visible capability |
| `fix` | a defect repair |
| `perf` | a measurable speed or memory improvement |
| `refactor` | a change that preserves behaviour |
| `test` | test-only work |
| `docs` | documentation, including agent guidance |
| `style` | formatting with no behaviour change |
| `build` | tooling, dependencies or build output |
| `ci` | workflow or automation changes |
| `chore` | maintenance that fits no other type |
| `revert` | a revert of an earlier commit |

## Scopes

Use the layer or area that owns the change:

`domain`, `state`, `scene`, `ui`, `routes`, `styles`, `docs`, `agents`, `ci`,
`deps`, `github`.

## Examples

```text
feat(domain): recover audited N-2 losses over twelve months
fix(ui): keep the tariff slider inside the Chairman ceiling
refactor(styles): express panels through Tailwind utilities
docs(agents): route UI reviews through the impeccable skill
ci(github): publish lint status through the Lint environment
```

## Rules

- Use the imperative present tense: `add`, not `added` or `adds`.
- Do not capitalise the subject and do not end it with a period.
- Keep the header at 72 characters or fewer.
- Explain the motivation and the previous behaviour in the body.
- Reference issues in the footer, for example `Closes #12`.
- Mark a breaking change with `BREAKING CHANGE:` in the footer and describe the
  migration.
- One atomic outcome per commit. Do not mix formatting with behaviour.
- No emojis.

## Reverts

```text
revert: feat(domain): recover audited N-2 losses over twelve months

This reverts commit 1a2b3c4d.
```
