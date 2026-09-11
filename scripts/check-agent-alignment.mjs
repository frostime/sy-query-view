#!/usr/bin/env node
/**
 * Node-only alignment checks for the pure proxy layer.
 *
 * The production module imports browser-only rendering code, so this script
 * transpiles the actual proxy source and supplies only its renderAttr boundary.
 * It does not start SiYuan or require a DOM.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as vm from "node:vm";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const proxyPath = path.join(root, "src/core/proxy.ts");
const source = fs.readFileSync(proxyPath, "utf8");
const pureSource = source.replace(
  /^import\s+\{\s*renderAttr\s*\}\s+from\s+["']\.\/components["'];\r?\n/m,
  ""
);

const { outputText } = ts.transpileModule(pureSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: proxyPath,
  reportDiagnostics: true,
});

const module = { exports: {} };
const context = vm.createContext({
  module,
  exports: module.exports,
  // wrapBlock reaches this dependency only when a rendered attribute is read.
  renderAttr: () => "",
});
vm.runInContext(outputText, context, { filename: proxyPath });

const { wrapList } = module.exports;
assert.equal(typeof wrapList, "function", "proxy source must export wrapList");

const blocks = [
  { id: "b1", content: "One", root_id: "doc-a", type: "p", ial: "{: id=\"b1\"}" },
  { id: "b2", content: "Two", root_id: "doc-a", type: "p", ial: "{: id=\"b2\"}" },
  { id: "b3", content: "Three", root_id: "doc-b", type: "p", ial: "{: id=\"b3\"}" },
];

const requireWrappedList = (value, label) => {
  assert.equal(typeof value.unwrap, "function", `${label} must expose unwrap()`);
  assert.equal(typeof value.groupby, "function", `${label} must expose groupby()`);
};

const list = wrapList(blocks, false);
requireWrappedList(list, "wrapList result");
assert.equal(list.unwrap(), blocks, "unwrap() must return the original array");

const ids = list.pick("id");
requireWrappedList(ids, "pick('id') result");
assert.deepEqual(Array.from(ids), ["b1", "b2", "b3"], "pick('id') must return scalar values");

const selected = list.pick("id", "content");
requireWrappedList(selected, "pick('id', 'content') result");
assert.equal(selected.length, 3);
assert.equal(selected[0].id, "b1");
assert.equal(selected[0].content, "One");
assert.deepEqual(Array.from(Object.keys(selected[0])), ["id", "content"], "pick must omit unselected properties");

const filtered = list.filter(block => block.root_id === "doc-a");
requireWrappedList(filtered, "filter result");
assert.deepEqual(Array.from(filtered, block => block.id), ["b1", "b2"]);

const sliced = list.slice(1, 3);
requireWrappedList(sliced, "slice result");
assert.deepEqual(Array.from(sliced, block => block.id), ["b2", "b3"]);

const concatenated = list.concat([{ id: "b4", content: "Four", root_id: "doc-b", type: "p", ial: "{: id=\"b4\"}" }]);
// concat/toSorted 是原生透传（用户拍板 2026-08-25）：返回普通数组，无 wrapper 方法；
// symbol 属性原生透传（2026-08-25）保证 isConcatSpreadable 语义，concat 可展开
const requirePlainArray = (value, label) => {
  assert.equal(Array.isArray(value), true, `${label} must be an array`);
  assert.equal(typeof value.unwrap, "undefined", `${label} must NOT expose unwrap()`);
  assert.equal(typeof value.groupby, "undefined", `${label} must NOT expose groupby()`);
};
requirePlainArray(concatenated, "concat result");
assert.deepEqual(Array.from(concatenated, block => block.id), ["b1", "b2", "b3", "b4"]);

// 包装数组作为参数传给原生 concat 时也必须展开（v1.3 陷阱：兜底 null 会吞掉展开语义）
const fromNativeConcat = [].concat(list);
requirePlainArray(fromNativeConcat, "native concat of wrapped list");
assert.equal(fromNativeConcat.length, 3, "wrapped list must spread into native concat");

const sorted = list.toSorted((left, right) => right.id.localeCompare(left.id));
requirePlainArray(sorted, "toSorted result");
assert.deepEqual(Array.from(sorted, block => block.id), ["b3", "b2", "b1"]);

const groups = list.groupby("root_id");
requireWrappedList(groups["doc-a"], "groupby result");
assert.deepEqual(Array.from(groups["doc-a"], block => block.id), ["b1", "b2"]);
assert.deepEqual(Array.from(groups["doc-b"], block => block.id), ["b3"]);

let firstMappedValue;
const mappedDefault = list.map(block => {
  const value = { id: block.id, mapped: true };
  if (block.id === "b1") firstMappedValue = value;
  return value;
});
// map 是原生透传（用户拍板 2026-08-25）：返回普通数组，元素为回调原始返回值
requirePlainArray(mappedDefault, "map result");
assert.equal(mappedDefault[0], firstMappedValue, "map() must preserve the callback's raw element by default");

const mapped = list.map(block => block);
requirePlainArray(mapped, "map result");
assert.deepEqual(Array.from(mapped, block => block.id), ["b1", "b2", "b3"]);

// filter/slice 仍是包装方法（v1.3 行为保留），链式在原生 map 处断为普通数组
const chained = list
  .filter(block => block.id !== "b2")
  .slice(0, 1)
  .map(block => block.id);
requirePlainArray(chained, "map/filter/slice chain result");
assert.deepEqual(Array.from(chained), ["b1"]);

console.log("[check-agent-alignment] wrapList assertions passed");
