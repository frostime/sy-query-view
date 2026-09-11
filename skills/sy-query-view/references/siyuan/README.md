# SiYuan platform notes (vendored)

Background knowledge about SiYuan itself — block model, SQL schema, path
semantics, daily-note model — for agents writing Query&View embedded blocks.

Source: adapted from `@frostime/siyuan-cli` (`src/docs/siyuan-guide/*.md`),
licensed GPL-3.0-only, same as this repository. CLI-specific sections were
removed or rewritten in terms of SQL / Query&View APIs; keep the adaptation in
sync when re-vendoring upstream updates.

| File | Read when |
|---|---|
| `siyuan-block.md` | You need block types, fields, attributes, or Markdown extensions |
| `sql-query-guide.md` | You write `Query.sql` queries against the SQLite database |
| `document-tree-and-paths.md` | You must resolve documents by id/path/hpath correctly |
| `dailynote-model.md` | The task involves daily notes |
