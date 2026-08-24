---
name: sy-query-view
description: >-
  Write, adapt, and hand over JavaScript embedded blocks for the Query&View
  (sy-query-view) SiYuan plugin: `//!js` blocks using the Query API for
  queries and DataView for rendering. Use when the user asks for help writing
  Query&View code, JS embedded blocks, Query View, or Dataview-style queries
  in SiYuan.
---

# Query&View Code Assistant

## 0. Prerequisites — check before writing any code

All of the following must hold before you write or adapt Query&View code. If
any is missing, tell the user what to enable/install and stop:

1. **The sy-query-view plugin is enabled.** Otherwise the `Query` API and
   DataView do not exist in the embedded block environment.
2. **Your agent toolset includes file reading tools** (`file.read`, and
   `file.list` if available). The skill is self-contained: its reference
   files ship **inside the skill package** (`references/` next to this
   SKILL.md) and are installed together with it. Without these tools you
   cannot read the references and must ask the user to open the docs site
   instead.
3. **SiYuan 3.8.0 or newer** (the plugin's own minimum version requirement
   will guarantee this; if the user runs an older version, top-level `await`
   — used in every example below — is unavailable. Ask them to upgrade, or,
   with explicit user consent, fall back to the legacy style: wrap the code
   in `const query = async () => { ... }; return query();`).

## 1. What Query&View is (30 seconds)

The plugin extends SiYuan JS embedded blocks. A block whose content starts
with `//!js` is executed as JavaScript and receives three variables:
`protyle`, `item`, `top`. The plugin injects a global `Query` API for queries
(SQL / keyword / backlink / task ...) and a `DataView` renderer for custom
views. There are exactly two output modes:

- **Return mode**: `return` a list of block IDs (`BlockID[]`); SiYuan renders
  those blocks in place. This is just a "better SQL" — for when plain block
  rendering is enough.
- **DataView mode**: build views with `Query.DataView(protyle, item, top)`
  and finish with `dv.render()`; do **not** return IDs.

## 2. How to write a Query&View block

### 2.1 The code (draft form — readable, multi-line)

Always start from this minimal skeleton and adapt it:

```js
//!js
let dv = Query.DataView(protyle, item, top);  // delete this line in return mode
let blocks = await Query.sql(`select * from blocks order by random() limit 5`);
dv.addlist(blocks);  // or addtable / addmd — see §3.2 below
dv.render();         // delete this line in return mode
```

In **return mode** the skeleton is:

```js
//!js
let blocks = await Query.sql(`select * from blocks order by random() limit 5`);
return blocks.pick('id');
```

Rules that are not optional:

- Code **always** starts with `//!js` as the first line.
- The three inputs `protyle`, `item`, `top` are always available; never
  invent or redefine them.
- Top-level `await` is fine (3.8.0+). Never wrap code in
  `const query = async () => { ... }; return query();` unless explicitly
  asked to target pre-3.8.0.
- Do not use HTML entities: `=>` is `=>`, not `=&gt;`.

### 2.2 The delivery form — two cases

**Case A (default): the user pastes the code themselves.** Deliver readable
multi-line code as in §2.1. The user copies it into an embedded block in
their own document. Nothing else is needed.

**Case B (only when the user asks you to write into their SiYuan notes
yourself, e.g. editing a document via file tools):** SiYuan embedded block
syntax is a single `{{...}}` line — newlines are not allowed and must be
escaped as `_esc_newline_`. Produce the escaped single-line form:

````
{{//!js_esc_newline_let dv = Query.DataView(protyle, item, top);_esc_newline_let blocks = await Query.sql(`_esc_newline_    select * from blocks order by random() limit 5;_esc_newline_`);_esc_newline_dv.addlist(blocks);_esc_newline_dv.render();}}
````

Mapping rule (explain it when the user will maintain the block by hand):
each newline of the natural code becomes `_esc_newline_`, then the whole
block is wrapped in `{{...}}` as one line. If you are writing the block into
note content yourself, always use Case B form — multi-line `{{...}}` does not
parse.

## 3. What to put inside the block

### 3.1 Queries

Match the user's intent to an API, then verify the exact signature in
`references/query-api.md` before writing:

| Intent (example) | API to use |
|---|---|
| arbitrary SQL | `Query.sql(sql)` |
| backlinks of a document | `Query.backlink(protyle.block.rootID)` |
| keyword search | `Query.keyword(words)` + `Query.pruneBlocks` |
| tasks / TODO | `Query.task(options)` |
| random blocks | `Query.random(limit)` |
| today's updated docs | `Query.sql` with `Query.Utils.today()` |

These are calibration examples, not an exhaustive map — for any other intent
scan `query-api.md` (it groups all Query members with signature, return
shape, and aliases). Prefer wrapped Query APIs over raw kernel calls.

### 3.2 Rendering

- Plain block list / table / markdown: `dv.addlist`, `dv.addtable`,
  `dv.addmd` — the workhorses; see `references/dataview.md` for options.
- Also fine (fully encapsulated, pass data or an option object, they build
  the DOM for you): `dv.cards`, `dv.details`, `dv.embed`, `dv.mermaid` and
  the `dv.echarts` family.
- Advanced, dynamic machinery — **do not write by default**; mention that it
  exists and, if the user insists, point them to the docs site topic
  `docs/en_US/topics/dataview-advanced.md`: `dv.addElement` (raw DOM),
  `dv.columns`/`dv.rows` (you must build the elements yourself),
  `dv.removeView`/`dv.replaceView`, and custom view registration
  (`dv.xxx()` / `dv.addxxx()`).
- **`dv.useState` — do not write, period.** It persists state across renders
  by writing into block attributes; written imperfectly it triggers
  hard-to-debug bugs and its side effects are hard for you to verify. Write
  it only if the user is confident and explicitly asks for it — then follow
  `references/dataview.md` and the advanced topic exactly.

Also in `references/dataview.md`: `dv.cards` options, `dv.useState` reference
(if ever needed), and the full component option tables.

## 4. Workflow

1. **Clarify**: what data, and how should it be displayed (plain blocks,
   list/table/markdown, chart)?
2. **Reuse before writing**: check `docs/en_US/examples/index.md` in the
   plugin folder (or use `file.list` on it) for a shipped `exp-*.js` that is
   close to the goal; adapt the closest one rather than starting from
   scratch.
3. **Verify API details** in `references/query-api.md` /
   `references/dataview.md` before writing. The reference files are long — **when the
   target is specific (one API, one component), locate it first with grep,
   then read only the matched section** (a few lines) instead of the whole
   file. If a signature is still ambiguous, grep the exact symbol in
   `public/types.d.ts` of the plugin folder — never read the whole file.
4. **Produce one copy-pasteable block** in the delivery form of §2.2,
   matching the user's language only in comments.
5. **Hand over for verification**: the user pastes and runs it; tell them to
   watch the SiYuan console for errors (embed errors may not surface as
   normal exceptions). Iterate with minimal changes.

## 5. Safety boundaries

- Never modify the user's notes or blocks without an explicit request
  (Case B of §2.2 is the only exception, and only on explicit request).
- Ask first when the request involves: external network calls (e.g. GPT or
  arbitrary HTTP via `Query.request`), destructive operations (mass deletes),
  or undocumented APIs.
- Never fabricate API names or behaviors. Everything above is grounded in
  `types.d.ts`, the shipped examples, and the reference files. If you need a
  name that is not in `references/query-api.md` and you cannot read the type
  declaration, say so instead of guessing.
- This skill does not install, enable, or invoke the plugin, and it makes no
  promise about how SiYuan loads skill files.

## 6. Reference file map (read on demand)

**Level 1 — bundled with this skill** (installed together with SKILL.md;
paths below are relative to the skill root):

| When | Read |
|---|---|
| verifying a Query signature | `references/query-api.md` |
| choosing a component / its options | `references/dataview.md` |

**Level 2 — plugin folder** (paths relative to the plugin root, e.g.
`data/plugins/sy-query-view/...`; only when level 1 is insufficient):

| When | Read |
|---|---|
| finding an example to adapt | `docs/en_US/examples/index.md` (you may `file.list` the folder) |
| richer explanations of a specific API/component (verbose, user-oriented) | `docs/en_US/topics/query.md` / `docs/en_US/topics/dataview.md` |
| user insists on useState / custom views / raw DOM / lifecycle | `docs/en_US/topics/dataview-advanced.md` |
| exact type of one symbol | grep `types.d.ts` |

**Fallbacks** (in order):

1. If you still cannot understand the internal mechanism of a feature, read
   the plugin's shipped `index.js` (compiled plugin code; minified in
   release builds) and trace the logic directly. Expensive — last resort
   only; the normal path is level 1 → level 2.
2. If you have web access, the project is open source at
   <https://github.com/frostime/sy-query-view> — view the docs, examples,
   and the uncompiled source under `src/` there. Same content, easier to
   read than the compiled bundle.

If `file.read` fails on a level-2 path, the plugin may be a version where
that file does not exist: tell the user the reference is unavailable and
point them to the plugin's in-built docs site ("Help" in the plugin menu)
or the GitHub repository instead.

**Reading strategy**: all reference files above are intentionally compact,
but still too long to read end-to-end when you only need one API. When the
goal is specific, `grep` or filter the file for the exact member name
(e.g. `Query.childDoc`, `state`, `addechartsBar`) and read only the matched
section. Read a file fully only when the task is genuinely open-ended
(choosing among many components).