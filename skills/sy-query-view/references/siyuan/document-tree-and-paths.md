# Document Tree and Path Semantics

How the block tree maps to document paths.

**Stable addressing priority: id > root_id > path.** Never use hpath or title as a stable key for programmatic use.

## 1. Three relationships

| Relationship | Fields | Answers |
|-------------|--------|---------|
| Block tree | `id`, `parent_id`, `root_id` | Parent-child hierarchy, document ownership |
| Document ownership | `box`, `root_id` | Which notebook, which document |
| Document path | `path`, `hpath` | How to locate the containing document |

## 2. `path` and `hpath` semantics

**Rule:** `path` and `hpath` on any block describe the **containing document**, not the block itself.

- Multiple blocks share the same `path`/`hpath` (they live in the same document).
- Block hierarchy is determined by `parent_id`, not `path`.
- Document membership is determined by `root_id`.

## 3. `path` vs `hpath`

| | `path` | `hpath` |
|---|--------|---------|
| Format | ID-based (`/20260107143325-zbrtqup/20260107143334-l5eqs5i.sy`) | Title-based (`/SiYuan Development/Document Structure`) |
| Stability | Stable within notebook | Changes on rename or duplicate titles |
| Use for | Automation, permissions, caching | User-facing display |
| As unique key | ✓ | ✗ |

## 4. `parent_id` vs `root_id`

| | `parent_id` | `root_id` |
|---|-------------|-----------|
| Answers | Direct parent/children of a block | Which document owns the block |
| Use for | Tree traversal, expand/collapse | Document-scope filtering, ownership |

## 5. Example: document block

Filesystem path:

```text
/data/20260101215354-j0c5gvk/20260107143325-zbrtqup/20260107143334-l5eqs5i.sy
     └── notebook id ──┘          └── parent doc id ──┘           └── doc id ──┘
```

Block record:

```json
{
  "id": "20260107143334-l5eqs5i",
  "box": "20260101215354-j0c5gvk",
  "root_id": "20260107143334-l5eqs5i",
  "content": "Document Structure",
  "hpath": "/SiYuan Development/Document Structure",
  "path": "/20260107143325-zbrtqup/20260107143334-l5eqs5i.sy",
  "type": "d"
}
```

Document block properties: `type='d'`, `root_id = id`, `parent_id` empty, `path` points to its `.sy` file.

## 6. Resolving paths from embedded blocks

From a Query&View block you only have read access, via SQL:

```sql
-- hpath -> document id (hpath is per-notebook; scope with box when ambiguous)
SELECT id FROM blocks
WHERE type='d' AND hpath='/SiYuan Development/Document Structure'
LIMIT 10
```

For write-side path operations (`filetree.getIDsByHPath`,
`filetree.createDocWithMd`, ...) use SiYuan kernel APIs — outside this skill's
default scope.
