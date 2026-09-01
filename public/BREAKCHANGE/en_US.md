# BREAKCHANGE

This document records the breaking changes in each Query View version. Refer to it when the qv code you have written stops working.

Breaking updates of the plugin generally follow these conventions:

1. A change is first marked as a breaking update, with compatibility for the old version kept
2. The compatibility period lasts for a while; migrate on your own during it
3. Legacy usage will be fully removed in some future version

Current Query View version: **`${{PLUGIN_VERSION}}`**

## [Unreleased]

## [2.0.0]

### `Query.Utils` date output format parameters (Backward Compatible)

**Interface change**:

```ts
// --- OLD ---
now(offset?, hms?: boolean)
today(hms?: boolean)
thisWeek(hms?: boolean)
lastWeek(hms?: boolean)
thisMonth(hms?: boolean)
lastMonth(hms?: boolean)
thisYear(hms?: boolean)
SiYuanDate.toString(hms?: boolean)

// --- NEW ---
now(offset?, format?: 'date' | 'datetime')
today(format?: 'date' | 'datetime')
thisWeek(format?: 'date' | 'datetime')
lastWeek(format?: 'date' | 'datetime')
thisMonth(format?: 'date' | 'datetime')
lastMonth(format?: 'date' | 'datetime')
thisYear(format?: 'date' | 'datetime')
SiYuanDate.toString(format?: 'date' | 'datetime')
asTimestr(date, format?: 'date' | 'datetime')
```

**Behavior changes**:

- `'date'` returns the 8-digit calendar date `yyyyMMdd`; `'datetime'` returns the 14-digit local date-time `yyyyMMddHHmmss`
- Omitting `format` still defaults to the 14-digit date-time
- Legacy booleans retain their behavior: `false` maps to `'date'`, and `true` maps to `'datetime'`
- `asTimestr` gains the same `format` parameter; calls without a second argument behave as before

**Usage comparison**:

```js
// Old syntax (still supported)
Query.Utils.today(false);                    // 20260827
Query.Utils.thisMonth(true);                 // 20260801000000
Query.Utils.Date().toString(false);          // 20260827

// New syntax
Query.Utils.today('date');                   // 20260827
Query.Utils.thisMonth('datetime');           // 20260801000000
Query.Utils.Date().toString('date');         // 20260827
Query.Utils.asTimestr(new Date(), 'date');   // 20260827
```

**Compatibility statement**:

Boolean parameters remain available in v2.0.0 with unchanged results, but every call logs a `console.warn`; they will be removed in a future version. Omitting the parameter remains supported and does not warn.

### `Query.task` `options.after` date formats (Backward Compatible)

**Interface change**:

```ts
// --- OLD ---
task(options?: { after?: string, limit?: number })

// --- NEW ---
task(options?: { after?: Date | string, limit?: number })
// strings formally support yyyyMMdd or yyyyMMddHHmmss
```

**Behavior changes**:

- Date objects and 8-digit `yyyyMMdd` values become a 14-digit boundary at local `00:00:00`
- A 14-digit `yyyyMMddHHmmss` value is used directly
- Legacy 10-digit hour and 12-digit minute forms are still zero-padded to 14 digits, but are now deprecated
- Invalid formats and impossible calendar dates throw instead of being inserted into SQL

**Usage comparison**:

```js
// Old syntax (still supported)
await Query.task({ after: '2024101000' });

// New syntax
await Query.task({ after: '20241010' });
await Query.task({ after: '20241010000000' });
await Query.task({ after: new Date(2024, 9, 10) });
```

**Compatibility statement**:

10- and 12-digit date-time strings remain available in v2.0.0, but every call logs a `console.warn`; they will be removed in a future version. The 8-digit, 14-digit, and Date forms are fully supported.

### `Query.dailynote` date range validation (Backward Compatible)

**Behavior changes**:

- `after` / `before` accept a `Date`, an 8-digit `yyyyMMdd`, or a 14-digit `yyyyMMddHHmmss`, all normalized to an 8-digit daily-note date before comparison; 14-digit input was previously inserted into SQL as-is, producing unreliable results
- Invalid formats and impossible calendar dates throw instead of silently returning empty results
- Passing `after` later than `before` throws a `RangeError` (previously returned an empty array silently)

**Usage comparison**:

```js
// Old syntax (behavior unchanged)
await Query.dailynote({ after: '20241010', before: '20241031' });
await Query.dailynote({ after: new Date(2024, 9, 10) });

// New syntax
await Query.dailynote({ after: '20241010000000' }); // 14-digit input normalized to 20241010
```

**Compatibility statement**:

Existing usage with 8-digit date strings and `Date` objects behaves the same. Calls where `after` is later than `before` now throw instead of returning an empty array — fix the arguments; the same applies to invalid date input.

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
