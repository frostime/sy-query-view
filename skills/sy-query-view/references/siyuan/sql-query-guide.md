# SQL Query Guide

SiYuan maintains a runtime SQLite database, queried from embedded blocks via `Query.sql`. For agents, the most important tables are not just three, but at least these five:

- `blocks`
- `refs`
- `attributes`
- `assets`
- `spans`

## Core rule

For agent usage, **treat SQL as a read-only query interface**:

- write `SELECT` queries only
- always specify `LIMIT` explicitly
- narrow scope early with `root_id`, `box`, and `type`
- avoid broad fuzzy scans without scope constraints

## 1. `blocks` table

`blocks` is the core table. Most content retrieval starts here.

### High-value fields

| Field | Description |
|------|------|
| `id` | block ID |
| `parent_id` | parent block ID |
| `root_id` | owning document block ID |
| `box` | notebook ID |
| `path` | ID-based path of the containing document |
| `hpath` | human-readable path of the containing document |
| `type` | primary block type |
| `subtype` | subtype |
| `content` | plain text with Markdown formatting removed |
| `markdown` | full Markdown source |
| `tag` | tag text |
| `ial` | inline attribute list |
| `sort` | sibling sort weight |
| `created` | creation time |
| `updated` | update time |

**Note**: 
- `created` and `updated` are strings like `'20220322160253'`, do not compare to integers in SQL

## 2. Most common query patterns

Run these through `Query.sql` in an embedded block, for example:

```js
//!js
let blocks = await Query.sql(`select * from blocks where type='d' order by updated desc limit 10`);
return blocks.pick('id');
```

### 2.1 Find documents by title or document name

```sql
SELECT * FROM blocks
WHERE type='d'
  AND content LIKE '%keyword%'
ORDER BY updated DESC
LIMIT 32
```

### 2.2 List all blocks inside a document

```sql
SELECT * FROM blocks
WHERE root_id = '<document-id>'
ORDER BY sort ASC
LIMIT 128
```

### 2.3 List the direct children of a block

```sql
SELECT * FROM blocks
WHERE parent_id = '<block-id>'
ORDER BY sort ASC
LIMIT 64
```

### 2.4 Find specific block types inside a document

```sql
SELECT * FROM blocks
WHERE root_id = '<document-id>'
  AND type = 'h'
  AND subtype = 'h2'
ORDER BY sort ASC
LIMIT 32
```

### 2.5 Find recently updated documents

```sql
SELECT * FROM blocks
WHERE type='d'
ORDER BY updated DESC
LIMIT 10
```

## 3. `refs` table

`refs` records block-reference relationships and is useful for backlinks, link analysis, and dependency tracing.

### Key fields

| Field | Meaning |
|---|---|
| `block_id` | the block that contains the reference |
| `def_block_id` | the referenced target block ID |
| `def_block_root_id` | the document ID of the referenced block |
| `content` | reference anchor text |
| `markdown` | full Markdown of the reference |

### Find backlinks to a block

For a plain backlink listing prefer the wrapped API (`Query.backlink(rootID)`);
it redirects first-paragraph hits to the owning document or heading for easier
navigation. Use SQL only for custom filtering or joins — raw `refs.block_id`
is the exact block containing the reference:

```sql
SELECT B.*
FROM blocks AS B
WHERE B.id IN (
  SELECT block_id
  FROM refs
  WHERE def_block_id = '<target-block-id>'
)
LIMIT 32
```

### Find references used inside a document

```sql
SELECT *
FROM refs
WHERE root_id = '<document-id>'
LIMIT 64
```

## 4. `attributes` table

The `attributes` table stores block metadata and is the key entry point for daily notes, business metadata, and custom tags.

### Key fields

| Field | Meaning |
|---|---|
| `block_id` | owning block ID |
| `name` | attribute name |
| `value` | attribute value |
| `root_id` | owning document ID |
| `box` | owning notebook ID |

### Query custom attributes

```sql
SELECT B.*, A.name, A.value
FROM blocks AS B
JOIN attributes AS A ON B.id = A.block_id
WHERE A.name = 'custom-myattr'
  AND A.value = 'somevalue'
LIMIT 32
```

### Query daily note documents

```sql
SELECT DISTINCT B.*
FROM blocks AS B
JOIN attributes AS A ON B.id = A.block_id
WHERE B.type = 'd'
  AND A.name LIKE 'custom-dailynote-%'
  AND A.value >= '20231010'
  AND A.value <= '20231013'
ORDER BY A.value DESC
LIMIT 32
```

## 5. `assets` table

`assets` is useful for resource references such as images, PDFs, and attachments.

### Key fields

| Field | Meaning |
|---|---|
| `block_id` | block that references the asset |
| `root_id` | owning document ID |
| `box` | owning notebook ID |
| `docpath` | document path |
| `path` | asset file path |
| `name` | asset filename |
| `title` | asset title |

### Find all assets referenced by a document

```sql
SELECT *
FROM assets
WHERE root_id = '<document-id>'
LIMIT 64
```

### Find asset references by asset name

```sql
SELECT *
FROM assets
WHERE name LIKE '%keyword%'
LIMIT 32
```

## 6. `spans` table

`spans` is used for inline elements such as:

- inline links
- inline tags
- inline code
- inline highlights
- inline math
- inline block references

### Key fields

| Field | Meaning |
|---|---|
| `block_id` | owning block ID |
| `root_id` | owning document ID |
| `content` | inline element text |
| `markdown` | full inline source |
| `type` | inline element type |
| `ial` | inline style attributes |

### Find inline tags in a document

```sql
SELECT *
FROM spans
WHERE root_id = '<document-id>'
  AND type = 'tag'
LIMIT 64
```

### Find inline links in a document

```sql
SELECT *
FROM spans
WHERE root_id = '<document-id>'
  AND type = 'textmark a'
LIMIT 64
```

## 7. Anti-pattern

Do not:

```sql
SELECT * FROM blocks WHERE content LIKE '%foo%'
```

Do:

```sql
SELECT * FROM blocks
WHERE box = '<notebook-id>'
  AND type IN ('d', 'h', 'p')
  AND content LIKE '%foo%'
LIMIT 32
```

For field selection and scope narrowing: always `LIMIT`, narrow with `root_id`/`box`/`type` before fuzzy `LIKE`.

## 8. One-sentence summary

- `blocks`: primary content
- `refs`: reference relationships
- `attributes`: metadata
- `assets`: resource files
- `spans`: inline elements

Once an agent clearly separates the responsibilities of these five tables, most SiYuan queries become much less error-prone.
