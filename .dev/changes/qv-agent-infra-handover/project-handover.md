# Query&View Agent Infra — Project Handover

> This is the short entry point for future Agents. The `optimize-qv-agent-infra` graph is closed; do not reopen it for routine follow-up work.

## Current status

- Repository: Query&View (`sy-query-view`), plugin for SiYuan.
- Closed graph: `.dev/changes/optimize-qv-agent-infra/graph.yaml`.
- Graph closed by user on **2026-08-26** after the core alignment and publishing work was accepted.
- Latest closure commits at handover: `42ae948` (SKILL) and `c219e69` (graph closure).
- Worktree was clean when this handover was written.

## What this task delivered

The core goal was to keep runtime behavior, TypeScript declarations, JSDoc, generated Agent references, and the shipped Agent skill aligned.

- Reference generation is established: `scripts/gen-agent-ref.mjs`, `pnpm gen-ref`, and `pnpm gen-ref:check`.
- Generated English references live in `docs/en_US/agent-ref/`: `query-api.md`, `dataview.md`, `wrapped.md`, and `types.md`.
- Production builds copy those references and `src/core/query.ts` / `src/core/proxy.ts` into the skill package under `references/` and `references/source/`.
- The docs site exposes the four Agent Reference pages and Skill; the old hand-written `api/reference.md` page is retired, and the d.ts open/download actions are on the home page.
- `plugin.json` requires SiYuan `3.8.0`; the old 3.1.25/3.1.26 runtime check was removed and recorded in `BREAKCHANGE-v2.0.md`.
- `zh_CHT` docs navigation keys match the current navigation tree.
- The docs site has a page-outline UX enhancement.
- `skills/sy-query-view/SKILL.md` is compressed and now explicitly documents:
  - the bundled-reference → installed-plugin → bundled-source → GitHub lookup order;
  - full installed-plugin paths under `/data/plugins/sy-query-view/`;
  - `Query.sql`'s wrapped-list expectation and `Query.wrapBlocks(rows)` compatibility fallback;
  - bare DataView component methods returning elements without mounting them; use `add...` aliases or `dv.addElement(...)`;
  - `dv.render()` persistence, `dv.details` raw HTML, and external-request safety boundaries.

## Decisions that future code must preserve

- Compatibility comes first. Observable behavior changes require a `BREAKCHANGE-v2.0.md` entry; a fix for behavior that never worked is not a breaking change.
- Generated references and `public/types.d.ts` are build products. Change source/JSDoc or the generator, then regenerate; do not hand-edit generated references.
- `wrapList` keeps only `filter` and `slice` as wrapped same-name methods. `map`, `concat`, and `toSorted` use native pass-through behavior. Symbol properties pass through natively. `addrow` has the `addrows` alias only.
- The current repository source implements `Query.sql(sql)` with wrapped results by default and raw results when `wrap=false`. A live installation returning a plain array may be running a mismatched/stale bundle; normalize with `Query.wrapBlocks(rows)` before wrapper-only methods.
- Bare registered DataView methods construct and return elements. The `add...` aliases mount them into the view.

## Verification baseline

The accepted baseline passed:

- `pnpm gen-ref:check`
- `node scripts/check-agent-alignment.mjs`
- `npx tsc --noEmit`
- production `pnpm vite:build`

All exited with code 0 at closure. Re-run proportionate checks when changing source, generator, types, or packaging.

## Future work policy

Do **not** continue the closed graph for small improvements. Start from this file, inspect only the relevant source and current `git status`, and make a normal focused change.

The following remain deferred, not blocking the closed deliverable:

- real SiYuan runtime verification of DOM, Kernel, and persistence paths;
- N6 leftovers: I-31, I-79/C-3, I-81, and I-82;
- long-term alignment conventions and any new 2.0 API design.

The historical graph, issue pool, node briefs, and alignment reports remain under this directory for evidence only. Read them only when a future change specifically depends on that history. If a future task becomes large enough to need orchestration, create a new lightweight graph/change rather than reviving this closed one.
