#!/usr/bin/env node
/**
 * docs 生成器：从 docs/{lang}/ 页面生成仓库根 README.md / README_zh_CN.md。
 *
 * 契约（见 .dev/changes/query-view-docs-portal/nodes/define-doc-structure/DOC-STRUCTURE.md §5/§6）：
 * - 页面按固定顺序拼装，标题层级整体降一级；
 * - 剔除 <!-- docs-only:start --> ... <!-- docs-only:end --> 区间；
 * - 展开 {{example:<file>.js}} 占位符为内嵌 fenced code block（代码来源 public/example/）；
 * - 图片相对路径 (../assets/ 或 ../../assets/) 规范化为 docs/assets/；
 * - api-reference 之后追加 d.ts 附录（保留 {{Query}}/{{DataView}}/{{Proxy}} 占位符，构建时由
 *   vite.config.ts 的 replaceMDVars 用 types/types.d.ts.json 解析）。
 *
 * 无第三方依赖，仅使用 Node 内置模块。
 */
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// 拼装顺序（DOC-STRUCTURE.md §1.2 页面 ID 与 §5.1 顺序）
const PAGES = [
    "index.md",
    "quickstart/concepts.md",
    "quickstart/template.md",
    "topics/query.md",
    "topics/dataview.md",
    "topics/dataview-advanced.md",
    "topics/editor-tips.md",
    "examples/index.md",
    "api/reference.md",
    "skill/index.md",
];

const LANG_META = {
    zh_CN: { readme: "README_zh_CN.md", dir: "zh_CN" },
    en_US: { readme: "README.md", dir: "en_US" },
};

const HEADER = {
    zh_CN: [
        "> 🔀 **[更新日志](CHANGELOG.md)**",
        "",
        "> 🔔 本文档由仓库 `docs/zh_CN/` 下的页面自动生成（英文版由 `docs/en_US/` 生成）。插件内文档站随插件版本发布：点击顶栏菜单中的「帮助」即可打开，内容与已安装版本一致、可离线浏览，并且不会在知识库中创建或更新任何笔记。",
        "",
    ].join("\n"),
    en_US: [
        "> 🔀 **[Changelog](CHANGELOG.md)**",
        "",
        "> 🔔 This document is automatically generated from the pages under `docs/en_US/` in this repository (the Chinese version is generated from `docs/zh_CN/`). The in-plugin documentation site is shipped with the plugin version: click \"Help\" in the top-bar plugin menu to open it. Its content matches the installed version and works offline, and it never creates or updates notes in your knowledge base.",
        "",
    ].join("\n"),
};

// d.ts 附录（生成器固定模板，紧跟 api-reference 页之后）。
// REFERENCE-START/END 标记为旧帮助笔记功能（src/user-help/sy-doc.ts 的
// onlyImportDtsInUserDoc 提取逻辑）保留的兼容接口：标记格式必须与 sy-doc.ts
// 中的查找串 '`<!-- REFERENCE-START -->`' 完全一致；docs 页面源文件本身不包含
// 这些标记，待“停用旧帮助笔记机制”任务原子性删除 sy-doc.ts 与设置项后，
// 生成器即可移除本段标记。
const REFERENCE_START = "`<!-- REFERENCE-START -->`";
const REFERENCE_END = "`<!-- REFERENCE-END -->`";

const APPENDIX = {
    zh_CN: [
        REFERENCE_START,
        "",
        "> 注：接口文件会随着开发而变动，以下接口代码为构建时自动生成。最新完整的接口文件以随插件发布的 `public/types.d.ts` 为准，也可以在插件内文档站的「API 参考」页打开或下载当前版本的类型声明文件。",
        "",
        "### Query",
        "",
        "```ts",
        "{{Query}}",
        "```",
        "",
        "### IWrapBlock & IWrapList",
        "",
        "```ts",
        "{{Proxy}}",
        "```",
        "",
        "### DataView",
        "",
        "```ts",
        "{{DataView}}",
        "```",
        "",
        REFERENCE_END,
        "",
    ].join("\n"),
    en_US: [
        REFERENCE_START,
        "",
        "> Note: the interface file changes with development, and the interface code below is generated at build time. The latest complete interface file is the shipped `public/types.d.ts`; you can also open or download the type declaration of the installed version on the \"API Reference\" page of the in-plugin documentation site.",
        "",
        "### Query",
        "",
        "```ts",
        "{{Query}}",
        "```",
        "",
        "### IWrapBlock & IWrapList",
        "",
        "```ts",
        "{{Proxy}}",
        "```",
        "",
        "### DataView",
        "",
        "```ts",
        "{{DataView}}",
        "```",
        "",
        REFERENCE_END,
        "",
    ].join("\n"),
};

const stripDocsOnly = (md) =>
    md.replace(/<!-- docs-only:start -->[\s\S]*?<!-- docs-only:end -->\n?/g, "");

const expandExamples = (md, lang) =>
    md.replace(/\{\{example:([\w.-]+)\}\}/g, (match, file) => {
        const p = path.join(ROOT, "public", "example", file);
        if (!fs.existsSync(p)) {
            throw new Error(`[docs] example file not found: ${file} (lang: ${lang})`);
        }
        const code = fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n").replace(/\s+$/, "");
        return "```js\n" + code + "\n```";
    });

const normalizeImagePaths = (md) => md.replace(/(?:\.\.\/)+assets\//g, "docs/assets/");

const shiftHeadings = (md) => {
    let inFence = false;
    return md
        .split("\n")
        .map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
                inFence = !inFence;
                return line;
            }
            if (inFence) return line;
            const m = line.match(/^(#{1,6}) /);
            if (!m) return line;
            return "#".repeat(Math.min(m[1].length + 1, 6)) + line.slice(m[1].length);
        })
        .join("\n");
};

const buildLang = (lang) => {
    const meta = LANG_META[lang];
    const parts = [HEADER[lang], ""];
    for (const page of PAGES) {
        const p = path.join(ROOT, "docs", meta.dir, page);
        if (!fs.existsSync(p)) {
            throw new Error(`[docs] missing page: ${p}`);
        }
        let md = fs.readFileSync(p, "utf8");
        md = stripDocsOnly(md);
        md = expandExamples(md, lang);
        md = normalizeImagePaths(md);
        md = shiftHeadings(md);
        parts.push(md.replace(/\s+$/, ""), "");
        if (page === "api/reference.md") {
            parts.push(APPENDIX[lang], "");
        }
    }
    // 输出级清理：逐行去除行尾空白（含嵌入的案例代码行尾），保持 git diff --check 干净；
    // 仅去除空格/Tab，不影响 \r 与任何代码语义。
    const out = parts
        .join("\n")
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/, ""))
        .join("\n");
    return out.replace(/\n+$/, "\n");
};

const generateAll = () => {
    const out = {};
    for (const lang of Object.keys(LANG_META)) {
        out[LANG_META[lang].readme] = buildLang(lang);
    }
    return out;
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    const out = generateAll();
    for (const [name, content] of Object.entries(out)) {
        const p = path.join(ROOT, name);
        fs.writeFileSync(p, content);
        console.log(`[docs] generated ${name} (${content.length} bytes)`);
    }
}

export { generateAll };
