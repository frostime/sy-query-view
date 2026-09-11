# SiYuan Block Model

SiYuan is a **block-centric database** with Markdown as representation, SQL as query language, and path fields as location metadata. The block — not the document — is the primary data entity.

## 1. Block fields

| Field | Role |
|-------|------|
| `id` | Stable primary key |
| `parent_id` | Direct parent block |
| `root_id` | Owning document block |
| `box` | Notebook ID |
| `path` | ID-based path of containing document |
| `hpath` | Human-readable path of containing document |
| `type` / `subtype` | Block type and subtype |
| `content` | Plain text (Markdown stripped) |
| `markdown` | Full Markdown source |
| `ial` | Inline attribute list |
| `created` / `updated` | Timestamps |

## 2. Block types

| type | subtype | Category | Description |
|------|---------|----------|-------------|
| `d` | — | container | Document (root of block tree; `root_id = id`) |
| `h` | `h1`–`h6` | leaf | Heading |
| `p` | — | leaf | Paragraph |
| `l` | `o` / `u` / `t` | container | List (ordered / unordered / task) |
| `i` | — | container | List item |
| `b` | — | container | Blockquote |
| `s` | — | container | Super block |
| `c` | — | leaf | Code block |
| `m` | — | leaf | Math block |
| `t` | — | leaf | Table |
| `query_embed` | — | leaf | Embed block |
| `html` | — | leaf | HTML block |
| `iframe` | — | leaf | IFrame block |
| `widget` | — | leaf | Widget block |
| `audio` | — | leaf | Audio |
| `video` | — | leaf | Video |
| `tb` | — | leaf | Thematic break |
| `av` | — | leaf | Attribute view |

> Newer SiYuan versions may add types. Do not hard-code this set as exhaustive.

Container blocks hold child blocks; leaf blocks do not.

## 3. Blocks and Markdown

Markdown is the representation layer, not the data model.

| Purpose | Prefer |
|---------|--------|
| Search, classify, rank | `content` |
| Edit, export, format fidelity | `markdown` |
| Hierarchy, ownership, scope | `parent_id`, `root_id`, `path` |
| Stable reference | `id` |

Some SiYuan features (block refs, embed queries, IAL) extend standard Markdown — they exist as block-model constructs, not native Markdown.

## 4. Block-level Markdown syntax

### Block link

```md
[display text](siyuan://blocks/<BlockId>)
```

### Block reference

```md
((<BlockId> "anchor text"))
((<BlockId> 'anchor text'))
```

### Embed block / query block

- A select-SQL code wrapped with `{{}}`, MUST be oneline, `\n` -> `_esc_newline_`.

```md
{{SELECT * FROM blocks WHERE _esc_newline_ type='d' LIMIT 5}}
```

- A JS code block starting with the `//!js` shebang, returning a BlockID array
  (this is what Query&View extends — see the main `SKILL.md`):

```md
{{//!js_esc_newline_const search = async () =&gt; ['20260512171313-c5johcu']_esc_newline_return search()}}
```

### Tag

```md
#tag#
```

## 5. Block attributes

### Two storage locations

**`blocks.ial`** — inline attribute list on the block record:

```text
{: id="20210104091228-d0rzbmm" updated="20210604222535"}
```

**`attributes` table** — separate key-value store:

| Field | Role |
|-------|------|
| `block_id` | Owning block |
| `name` | Attribute name |
| `value` | Attribute value |

### Custom attributes

Must use `custom-` prefix: `custom-project`, `custom-status`, `custom-source`.

### Common system attributes

| Attribute | Meaning |
|-----------|---------|
| `custom-dailynote-YYYYMMDD` | Daily note marker |
| `custom-hidden` | Hidden in doc tree |
| `custom-sy-readonly` | Read-only |
| `custom-sy-fullwidth` | Full-width layout |
| `custom-avs` | Linked attribute-view IDs |

## 6. Writing blocks (kernel API gotchas)

Query&View itself is read-oriented; direct block writes go through SiYuan kernel APIs (`updateBlock`, etc.) and are out of this skill's default scope. If a task does require writing blocks, know these pitfalls:

- Raw `updateBlock`/`batchUpdateBlock` erases all `custom-*` attributes unless
  they are passed back in the payload.
- `updateBlock` on a document block (`type='d'`) replaces the whole child tree.
- `transferBlockRef` triggers a full kernel reindex; run it only as a standalone action.
