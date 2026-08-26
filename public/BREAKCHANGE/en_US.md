# BREAKCHANGE

Breaking changes and their announcements for Query&View, intended for script authors.
Unreleased entries live under `[Unreleased]`; headings become version numbers on release.

## [Unreleased]

## [2.0.0]

### `Query.keywordDoc` (Backward Compatible)

**Interface change**:

```ts
// --- OLD ---
keywordDoc(keywords, options?: { join?: 'or' | 'and', limit?: number } | 'or' | 'and', limit?: number)
// --- NEW ---
keywordDoc(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**Behavior changes**:

- `{ join: 'or' }` is automatically mapped to `relation:'any'`: v1.x only returned documents containing ALL keywords; v2.x returns documents containing ANY keyword — results may grow
- `{ join: 'and' }` is automatically mapped to `relation:'all'`: v1.x required all keywords within the **same block**; v2.x only requires them within the **same document** (blocks may differ) — results may grow
- `limit`: v1.x capped the number of blocks retrieved (excess blocks were dropped, and their documents could be missed entirely); v2.x caps the number of documents returned
- Calls without arguments behave the same; the result is still an array of document blocks with a `.keywords` property
- The old positional `limit` parameter (third argument) has been removed; pass `limit` inside the options object instead

**Usage comparison**:

```js
// Old join syntax (still supported; behavior follows the mapped semantics)
await Query.keywordDoc(["TODO", "会议"], { join: 'or' });   // mapped to 'any': matches any keyword
await Query.keywordDoc(["TODO", "会议"], { join: 'and' });  // mapped to 'all': requires all keywords
await Query.keywordDoc(["TODO", "会议"], { join: 'and' }, 20); // positional limit is ignored

// New syntax
await Query.keywordDoc(["TODO", "会议"]);                                 // default 'all'
await Query.keywordDoc(["TODO", "会议"], { relation: 'any' });            // matches any keyword
await Query.keywordDoc(["TODO", "会议"], { relation: 'all', limit: 20 }); // requires all keywords; at most 20 documents
```

**Compatibility statement**:

The legacy `join` object and direct-string forms remain available in v2.0.0, but every call logs a `console.warn`; they will be removed in a future version. The third positional `limit` parameter has been removed in v2.0.0.

### `Query.keyword` (Backward Compatible)

**Interface change**:

```ts
// --- OLD ---
keyword(keywords, options?: { join?: 'or' | 'and', limit?: number } | 'or' | 'and', limit?: number)
// --- NEW ---
keyword(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**Behavior changes**: `join` is mapped to `relation` (`'or'→'any'`, `'and'→'all'`) without changing block-level matching behavior. The old positional `limit` parameter (third argument) has been removed; pass `limit` inside the options object instead.

**Usage comparison**:

```js
// Old join syntax (still supported)
await Query.keyword("日记", { join: 'or' });
await Query.keyword("日记", 'and');
await Query.keyword("日记", { join: 'and' }, 20); // positional limit is ignored

// New syntax
await Query.keyword("日记", { relation: 'any' });
await Query.keyword("日记", { relation: 'all', limit: 20 });
```

**Compatibility statement**:

The legacy `join` object and direct-string forms remain available in v2.0.0, but every call logs a `console.warn`; they will be removed in a future version. The third positional `limit` parameter has been removed in v2.0.0.

### `Query.attr` (Legacy forms removed)

The direct-pass forms, deprecated since v1.x, are removed in v2.0.0.

**Interface change**:

```ts
// --- OLD ---
attr(name, val?, optsOrValMatch?: { valMatch?: '=' | 'like', limit?: number } | '=' | 'like', limit?: number)
// --- NEW ---
attr(name, val?, options?: { valMatch?: '=' | 'like', limit?: number })
```

**Behavior changes**: the legacy forms no longer take effect — passing `'like'` directly falls back to exact match `'='`; positional `limit` is ignored.

**Usage comparison**:

```js
// Old syntax (removed)
await Query.attr('memo', 'hello', '=');                    // ✗ use { valMatch: '=' }
await Query.attr('memo', 'hello', 'like');                 // ✗ use { valMatch: 'like' }
await Query.attr('memo', 'hello', { valMatch: '=' }, 10);  // ✗ put limit in the object

// New syntax
await Query.attr('memo', 'hello');
await Query.attr('memo', 'hello', { valMatch: 'like', limit: 10 });
```

**Compatibility statement**:

These forms have logged runtime warnings since v1.x; they are fully removed in v2.0.0.

### `Query.tag` (Legacy forms removed)

The direct-pass forms, deprecated since v1.x, are removed in v2.0.0.

**Interface change**:

```ts
// --- OLD ---
tag(tags, joinOrOpts?: { join?, limit?, match? } | 'or' | 'and', limit?: number)
// --- NEW ---
tag(tags, options?: { join?: 'or' | 'and', limit?: number, match?: '=' | 'like' })
```

**Behavior changes**: direct-pass `'or'` / `'and'` and positional `limit` no longer work — passing `'and'` directly falls back to the default `'or'`; positional `limit` is ignored. The object form still uses `join` (not renamed) with values `'or' | 'and'`.

**Usage comparison**:

```js
// Old syntax (removed)
await Query.tag(['tag1', 'tag2'], 'or');                   // ✗ use { join: 'or' }
await Query.tag(['tag1', 'tag2'], { join: 'and' }, 10);    // ✗ put limit in the object

// New syntax
await Query.tag(['tag1', 'tag2'], { join: 'and', limit: 10 });
```

**Compatibility statement**:

These forms have logged runtime warnings since v1.x; they are fully removed in v2.0.0.

### `Query.task` (Legacy forms removed)

The direct-pass forms, deprecated since v1.x, are removed in v2.0.0.

**Interface change**:

```ts
// --- OLD ---
task(afterOrOpts?: { after?: string, limit?: number } | string, limit?: number)
// --- NEW ---
task(options?: { after?: string, limit?: number })
```

**Behavior changes**: direct-pass date strings and positional `limit` no longer work — a direct-pass `after` is ignored, so all unfinished tasks are returned.

**Usage comparison**:

```js
// Old syntax (removed)
await Query.task('2024101000');                // ✗ use { after: '2024101000' }

// New syntax
await Query.task({ after: '2024101000', limit: 32 });
```

**Compatibility statement**:

These forms have logged runtime warnings since v1.x; they are fully removed in v2.0.0.

### `Query.dailynote` (Legacy forms removed)

The compatibility forms retained in v1.x are removed in v2.0.0, including the older `{ box }` special case that was not part of the type declaration.

**Interface change**:

```ts
// --- OLD ---
dailynote(
    notebookOrOpts?: { notebook?: NotebookId, box?: NotebookId, limit?: number } | NotebookId,
    limit?: number
)
// --- NEW ---
dailynote(options?: { notebook?: NotebookId, limit?: number })
```

**Behavior changes**: direct-pass notebook IDs, `{ box }`, and positional `limit` no longer work — without a `notebook` option, daily notes from all notebooks are returned (default cap 64).

**Usage comparison**:

```js
// Old syntax (removed)
await Query.dailynote('20231224140619-bpyuay4');       // ✗ use { notebook: '…' }
await Query.dailynote({ box: '20231224140619-bpyuay4' }); // ✗ rename box to notebook
await Query.dailynote({ notebook: '20231…' }, 32);     // ✗ put limit in the object

// New syntax
await Query.dailynote({ notebook: '20231224140619-bpyuay4', limit: 32 });
```

**Compatibility statement**:

Direct-pass notebook IDs and positional `limit` have logged runtime warnings since v1.2.0; the `{ box }` compatibility special case did not warn. All of these legacy forms are removed in v2.0.0.
