# BREAKCHANGE

Breaking changes and their announcements for Query&View, intended for script authors.
Unreleased entries live under `[Unreleased]`; headings become version numbers on release.

## [Unreleased]

## [2.0.0]

### `Query.keywordDoc` (Backward Compatible)

**Interface change**:

```ts
// --- OLD ---
keywordDoc(keywords, options?: { join?: 'or' | 'and', limit?: number })
// --- NEW ---
keywordDoc(keywords, options?: { relation?: 'any' | 'all', limit?: number })
```

**Behavior changes**:

- `{ join: 'or' }` is automatically mapped to `relation:'any'`: v1.x only returned documents containing ALL keywords; v2.x returns documents containing ANY keyword — results may grow
- `{ join: 'and' }` is automatically mapped to `relation:'all'`: v1.x required all keywords within the **same block**; v2.x only requires them within the **same document** (blocks may differ) — results may grow
- `limit`: v1.x capped the number of blocks retrieved (excess blocks were dropped, and their documents could be missed entirely); v2.x caps the number of documents returned
- Calls without arguments behave the same; the result is still an array of document blocks with a `.keywords` property

**Usage comparison**:

```js
// Old syntax (still works; behavior follows the mapped semantics)
await Query.keywordDoc(["TODO", "会议"], { join: 'or' });   // mapped to 'any': matches any keyword
await Query.keywordDoc(["TODO", "会议"], { join: 'and' });  // mapped to 'all': requires all keywords

// New syntax
await Query.keywordDoc(["TODO", "会议"]);                      // default 'all': requires all keywords
await Query.keywordDoc(["TODO", "会议"], { relation: 'any' }); // matches any keyword
await Query.keywordDoc(["TODO", "会议"], { relation: 'all' }); // requires all keywords
```

**Compatibility statement**:

The old parameter forms remain available in v2.0.0 and will be removed in a future version.

### `Query.keyword` (Backward Compatible)

**Interface change**: same as above — the `join` parameter is renamed to `relation` (`'or'→'any'`, `'and'→'all'`).

**Behavior changes**: none, it is just a rename.

**Usage comparison**:

```js
// Old syntax (still works; behavior follows the mapped semantics)
await Query.keyword("日记", { join: 'or' });
await Query.keyword("日记", 'and');


// New syntax
await Query.keyword("日记", { relation: 'any' });
await Query.keyword("日记", { relation: 'all' });
```

**Compatibility statement**:

The old parameter forms remain available in v2.0.0, but every call logs a `console.warn`. They will be removed in a future version.
