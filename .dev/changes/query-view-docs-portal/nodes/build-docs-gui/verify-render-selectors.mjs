// 文档站渲染选择器契约验证（可复现命令：node <本文件>）
// 证据来源：m2p-fixtures.json（88250/lute test/m2p_test.go 的 Markdown→Protyle DOM 用例摘录）。
// 验证 render.ts 使用的选择器在 Lute 实际产物中成立，并交叉核对 render.ts 源码中的选择器字符串。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../../../..");
const fixtures = JSON.parse(readFileSync(path.join(dir, "m2p-fixtures.json"), "utf8"));
const renderSrc = readFileSync(path.join(repo, "src/docs-site/render.ts"), "utf8");
const indexSrc = readFileSync(path.join(repo, "src/docs-site/index.ts"), "utf8");
const contentSrc = readFileSync(path.join(repo, "src/docs-site/content.ts"), "utf8");
const dtsSrc = readFileSync(path.join(repo, "src/user-help/dts-actions.ts"), "utf8");

let fail = 0;
const check = (name, cond) => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
    if (!cond) fail++;
};
const has = (html, token) => html.includes(token);
const C = fixtures.cases;

// ---- 1. 代码块契约（render.ts: [data-type="NodeCodeBlock"] + .hljs 文本）----
const codeHtml = C["88"].html + C["34"].html;
check("code block: data-type=NodeCodeBlock", has(codeHtml, 'data-type="NodeCodeBlock"'));
check("code block: class=code-block", has(codeHtml, 'class="code-block"'));
check("code block: .hljs present", has(codeHtml, 'class="hljs"'));
check("code block: native .protyle-action present (hides editor controls)", has(codeHtml, 'class="protyle-action"'));
check("code block: native copy icon present", has(codeHtml, "protyle-action__copy"));
check("code block: contenteditable=true present (read-only pass needed)", has(codeHtml, 'contenteditable="true"'));
// .hljs 内代码文本（case 34: ```foo bar / baz``` → 文本 "baz"）
const hljsMatch = /<div class="hljs"><div><\/div><div[^>]*>([\s\S]*?)<\/div><\/div>/.exec(C["34"].html);
check("code block: .hljs holds code text 'baz\\n'", hljsMatch !== null && hljsMatch[1].includes("baz\n"));
check("code block: language label in protyle-action", has(C["34"].html, "protyle-action__language"));

// ---- 2. 链接契约（render.ts: [data-type] 含 "a" 令牌 + data-href）----
const links = [C["81"], C["26"], C["46"], C["96"], C["9"], C["117"]].map((c) => c.html).join("");
check("link: span data-type=a with data-href", has(links, '<span data-type="a" data-href='));
check("link: token variant 'u a'", has(links, 'data-type="u a"'));
check("link: token variant 'a strong'", has(links, 'data-type="a strong"'));
check("link: token variant 'sup a'", has(links, 'data-type="sup a"'));
check("link: relative href preserved (www.bing.com)", has(links, 'data-href="www.bing.com'));
check("link: assets path preserved", has(links, 'data-href="assets/bar'));
check("link: javascript: rendered as empty data-href", has(links, 'data-href=""'));

// ---- 3. 标题契约（render.ts: [data-type="NodeHeading"][data-subtype="h1"]）----
check("heading: data-type=NodeHeading", has(C["32"].html, 'data-type="NodeHeading"'));
check("heading: data-subtype=h1", has(C["32"].html, 'data-subtype="h1"'));
check("heading: class=h1", has(C["32"].html, 'class="h1"'));

// ---- 4. 图片契约（render.ts: img[src] + img[data-src]）----
check("image: <img src=... data-src=...>", has(C["44"].html, '<img src="bar" data-src="bar"'));

// ---- 5. 源码交叉核对：render.ts 使用的选择器/属性在 Lute 产物证据中成立 ----
const selectors = [
    '[data-type="NodeCodeBlock"]',
    ".hljs",
    "data-href",
    '[data-type="NodeHeading"][data-subtype="h1"]',
    "img[src]",
    "img[data-src]",
];
const evidenced = (sel) =>
    Object.values(C).some((c) => {
        if (sel === "img[src]") return c.html.includes("<img src=");
        if (sel === "img[data-src]") return c.html.includes("data-src=");
        if (sel.startsWith(".")) return c.html.includes(`class="${sel.slice(1)}"`);
        if (sel === "data-href") return c.html.includes("data-href");
        // [attr="v"][attr2="v2"] → 每个属性片段都出现在同一段产物中
        return sel
            .split("][")
            .map((s) => s.replace(/^\[/, "").replace(/\]$/, ""))
            .every((p) => c.html.includes(p));
    });
for (const sel of selectors) {
    check(`render.ts selector "${sel}" used in source`, renderSrc.includes(sel));
    check(`render.ts selector "${sel}" evidenced in m2p fixtures`, evidenced(sel));
}

// ---- 6. 生产代码不含硬编码真实插件名 ----
for (const [name, src] of [["docs-site/index.ts", indexSrc], ["docs-site/content.ts", contentSrc], ["dts-actions.ts", dtsSrc]]) {
    check(`no hard-coded plugin name in ${name}`, !src.includes("sy-query-view"));
}

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
