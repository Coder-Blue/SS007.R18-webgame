---
name: graphify
description: Index the game repository into a knowledge graph and query it.
---

# Workflow: graphify

1. Run `graphify update .` after scaffolding and after each merge.
2. Read `graphify-out/GRAPH_REPORT.md` for the first architecture pass.
3. Use `graphify query`, `graphify path` and `graphify explain` for focused
   questions instead of grepping the whole tree.
4. Configure runtime integrations with
   `graphify install --platform opencode`, `--platform claude`,
   `--platform codex`, and `--platform antigravity`.
5. Re-index after merges and before the final quality gate.
