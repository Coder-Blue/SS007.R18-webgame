## Summary

Describe the player-visible or system-visible outcome and why it belongs in the
game.

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Balance or economic change
- [ ] Refactor with no behaviour change
- [ ] Documentation or agent guidance
- [ ] Tooling, CI or dependency update

## Layer check

- [ ] `src/domain/` stays pure and browser-free
- [ ] No class, `this`, inheritance or prototype mutation
- [ ] No new file over 500 lines
- [ ] Vietnamese copy is inline in the Solid component that renders it
- [ ] No emoji in code, docs, UI or commits
- [ ] Save schema version is unchanged or migrated

## Gates and evidence

Paste the command output or link the workflow run. A claim without evidence is
not accepted.

- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm check:lines`
- [ ] `pnpm check:emoji`
- [ ] `pnpm check:domain`
- [ ] `pnpm coverage`
- [ ] `pnpm build`
- [ ] `pnpm exec playwright test`

## Responsive and accessibility evidence

- [ ] `1440x900` desktop
- [ ] `768x1024` tablet
- [ ] `390x844` mobile
- [ ] `360x740` narrow
- [ ] Touch targets are at least 44x44 px
- [ ] Keyboard focus is visible and every control has an accessible name

## Screenshots

Attach before and after images for UI, scene or style changes.

## Review

- [ ] The reviewer is a different agent instance from the author
- [ ] The `approved-by-thermo-nuclear-review` label will be applied after review
