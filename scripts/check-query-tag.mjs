import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/core/tag.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext
    }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { buildTagSqlCondition, normalizeTagTree } = await import(moduleUrl);

assert.equal(
    buildTagSqlCondition('normal', '='),
    "tag like '%#normal#%' escape '\\'"
);
assert.equal(
    buildTagSqlCondition('#a%b#', '='),
    "tag like '%#a\\%b#%' escape '\\'"
);
assert.equal(
    buildTagSqlCondition('a_b', '='),
    "tag like '%#a\\_b#%' escape '\\'"
);
assert.equal(
    buildTagSqlCondition("a'b", '='),
    "tag like '%#a''b#%' escape '\\'"
);
assert.equal(
    buildTagSqlCondition('#%project/_%#', 'like'),
    "tag like '%#%project/_%#%'"
);
assert.equal(
    buildTagSqlCondition("a'b", 'like'),
    "tag like '%#%a''b%#%'"
);

const normalized = normalizeTagTree([
    {
        name: 'a&amp;b',
        label: 'parent/a&amp;b',
        depth: 1,
        count: 2,
        children: null
    }
], value => value.replaceAll('&amp;', '&'));
assert.deepEqual(normalized, [
    {
        name: 'a&b',
        label: 'parent/a&b',
        depth: 1,
        count: 2,
        children: []
    }
]);
assert.deepEqual(normalizeTagTree(null, value => value), []);

console.log('Query tag checks passed.');
