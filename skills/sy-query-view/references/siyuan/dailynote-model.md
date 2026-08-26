# Daily Note Model

Each notebook can manage daily notes independently.

## Path template

Daily-note location is generated from a template, usually with Go-style date formatting.

Example:

```text
/daily note/{{now | date "2006/01"}}/{{now | date "2006-01-02"}}
```

For `2025-12-15`, this resolves to:

```text
/daily note/2025/12/2025-12-15
```

## Identification

Daily-note documents are marked by attributes like:

```text
custom-dailynote-20240101 = 20240101
```

So daily notes can be queried through the `attributes` table.

## Query pattern

In an embedded block, today's date can be produced with `Query.Utils.today()` (see `references/query-api.md`) instead of hard-coding dates:

```sql
SELECT DISTINCT B.*
FROM blocks AS B
JOIN attributes AS A ON B.id = A.block_id
WHERE A.name LIKE 'custom-dailynote-%'
  AND B.type = 'd'
  AND A.value >= '20231010'
  AND A.value <= '20231013'
ORDER BY A.value DESC
LIMIT 32
```

## Practical rule

When a task targets daily notes:
1. determine the notebook
2. resolve the target daily note (by attribute query, not by guessing the path)
3. then query or render its content

Creating/appending to daily notes requires kernel APIs (`filetree.createDailyNote`,
`filetree.appendDailyNoteBlock`) — outside this skill's default read-only scope.
