// fix-runtime-feedback 回归验证（可复现：node .dev/changes/query-view-docs-portal/nodes/fix-runtime-feedback/verify-runtime-fixes.mjs）
// 覆盖：语言只跟随 SiYuan（zh_CN/zh_CHT→zh_CN，其他→en_US；无站内切换 UI）、
// Lute 原生编辑控件 DOM 删除（vendored fixture 干跑 + 源码断言）、Mermaid→SVG 替换、
// zh_CHT i18n 键结构一致与构建产物。SVG 的 XML 良构用 python 校验。
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../../../..");

let fail = 0;
const check = (name, cond, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
    if (!cond) fail++;
};

const read = (p) => readFileSync(path.join(repo, p), "utf8");

// ============ 1. 语言只跟随 SiYuan ============
const contentSrc = read("src/docs-site/content.ts");
const indexSrc = read("src/docs-site/index.ts");
const scssSrc = read("src/docs-site/index.module.scss");

// 1a. 实际 resolveLang 表达式（从源码提取并按各语言求值）
const rule = /const resolveLang = \(\):\s*Lang =>\s*(window\.siyuan\.config\.lang\.startsWith\("zh"\) \? "zh_CN" : "en_US");/.exec(contentSrc);
check("resolveLang rule present in content.ts", rule !== null);
if (rule) {
    const expr = rule[1].replace("window.siyuan.config.lang", "lang");
    const apply = new Function("lang", `return ${expr};`);
    const cases = { zh_CN: "zh_CN", zh_CHT: "zh_CN", zh_Hans: "zh_CN", en_US: "en_US", fr_FR: "en_US", ja_JP: "en_US", es_ES: "en_US" };
    const ok = Object.entries(cases).every(([l, want]) => apply(l) === want);
    check("lang mapping: zh_CN/zh_CHT/zh_Hans->zh_CN, others->en_US", ok);
}

// 1b. 站内语言切换 UI/事件已删除
check("index.ts: no [data-lang] attribute", !indexSrc.includes("data-lang"));
check("index.ts: no langBar / setActiveLang / langBtn", !/langBar|setActiveLang|langBtn/.test(indexSrc));
check("index.ts: navigate always uses state.lang (no lang switch path)", !/navigate\(l, state\.pageId\)/.test(indexSrc));
check("scss: no langBar/langBtn/langBtnActive styles", !/langBar|langBtn/.test(scssSrc));
check("scss: no CSS-only hiding of native controls", !/protyle-action/.test(scssSrc));

// ============ 2. 原生编辑控件 DOM 删除（收窄到代码块/图片上下文） ============
const renderSrc = read("src/docs-site/render.ts");

// 2a. 源码断言：选择器清单（收窄）、调用顺序（删除先于 enhance/复制按钮注入）、任务复选框保留
const NATIVE_SCOPED = [
    '[data-type="NodeCodeBlock"] .protyle-action',
    '[data-type="img"] .protyle-action',
    ".protyle-action__drag",
    ".img__net",
    ".protyle-action__title",
    ".protyle-attr",
];
check("render.ts: NATIVE_CONTROL_SELECTORS is scoped to code-block/image contexts",
    NATIVE_SCOPED.every((c) => renderSrc.includes(c)));
check("render.ts: no bare global .protyle-action selector remains", !renderSrc.includes('".protyle-action",'));
check("render.ts: task-list checkbox (.protyle-action--task) explicitly preserved", renderSrc.includes("protyle-action--task"));
const rmIdx = renderSrc.indexOf("removeNativeEditorControls(container)");
const enhanceIdx = renderSrc.indexOf("enhance(container, ctx)");
check("render.ts: native-control removal runs before enhance (copy button injection)", rmIdx >= 0 && enhanceIdx > rmIdx);
check("render.ts: attachCopyButtons still appends one button per NodeCodeBlock",
    /querySelectorAll<HTMLElement>\('\[data-type="NodeCodeBlock"\]'\)/.test(renderSrc));

// 2b. vendored fixture 干跑：镜像 render.ts 的收窄规则（祖先感知）
const fixtures = JSON.parse(read(".dev/changes/query-view-docs-portal/nodes/build-docs-gui/m2p-fixtures.json"));
const FLAT_CLASSES = ["protyle-action__drag", "img__net", "protyle-action__title", "protyle-attr"];

const removeNativeControls = (html) => {
    let result = html;
    let removed = true;
    while (removed) {
        removed = false;
        const openRe = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)>/g;
        const stack = []; // 祖先链 {dataType}
        let m;
        while ((m = openRe.exec(result))) {
            const token = m[0];
            if (token.startsWith("</")) { stack.pop(); continue; }
            const tag = m[1];
            const attrs = m[2] ?? "";
            if (token.endsWith("/>")) continue;
            const cls = /class\s*=\s*"([^"]*)"/.exec(attrs)?.[1] ?? "";
            const tokens = cls.split(/\s+/).filter(Boolean);
            const dataType = /data-type\s*=\s*"([^"]*)"/.exec(attrs)?.[1] ?? "";
            // 命中规则：扁平图片专用类/块属性占位，或代码块/图片上下文内的 .protyle-action（不含 --task 复选框）
            let hit = tokens.some((c) => FLAT_CLASSES.includes(c));
            if (!hit && tokens.includes("protyle-action") && !tokens.includes("protyle-action--task")) {
                hit = stack.some((a) => a.dataType === "NodeCodeBlock" || a.dataType === "img");
            }
            if (hit) {
                const openEnd = m.index + m[0].length;
                let depth = 1;
                const closeRe = /<\/?[a-zA-Z][a-zA-Z0-9]*(\s[^<>]*?)?\/?>/g;
                closeRe.lastIndex = openEnd;
                let sm = null;
                let closeStart = -1;
                while ((sm = closeRe.exec(result))) {
                    if (sm[0].startsWith("</")) {
                        depth--;
                        if (depth === 0) { closeStart = sm.index; break; }
                    } else if (!sm[0].endsWith("/>")) {
                        depth++;
                    }
                }
                const end = closeStart >= 0 ? closeStart + sm[0].length : openEnd;
                result = result.slice(0, m.index) + result.slice(end);
                removed = true;
                break;
            }
            stack.push({ dataType });
        }
    }
    return result;
};

// 任务列表（用例 32）：复选框/图标/状态必须保留
const taskCleaned = removeNativeControls(fixtures.cases["32"].html);
check("task fixture: .protyle-action--task checkbox preserved", taskCleaned.includes("protyle-action--task"));
check("task fixture: task icon (iconUncheck) preserved", taskCleaned.includes("iconUncheck"));
check("task fixture: data-task state preserved", taskCleaned.includes('data-task=" "'));
check("task fixture: heading content preserved", taskCleaned.includes("foo"));

// 图片（用例 44）：图标条与图片专用控件删除、img 保留
const imgCleaned = removeNativeControls(fixtures.cases["44"].html);
check("image fixture: native action bars removed", !/protyle-action(?!__task)/.test(imgCleaned));
check("image fixture: drag/net/title controls removed", !/protyle-action__drag|img__net|protyle-action__title/.test(imgCleaned));
check("image fixture: <img> element preserved", /<img /.test(imgCleaned));

// 代码块（用例 88）：动作条删除、.hljs 文本与容器保留
const codeCleaned = removeNativeControls(fixtures.cases["88"].html);
check("code fixture: native action bar removed", !codeCleaned.includes("protyle-action"));
check("code fixture: .hljs code text preserved (case 88 contains \"foo\\n\")", codeCleaned.includes("foo\n"));
check("code fixture: code block container preserved", /data-type="NodeCodeBlock"/.test(codeCleaned));

// ============ 3. Mermaid → SVG ============
for (const lang of ["zh_CN", "en_US"]) {
    const md = read(`docs/${lang}/quickstart/concepts.md`);
    check(`${lang} concepts: no mermaid fence`, !md.includes("```mermaid"));
    check(`${lang} concepts: references shared SVG with correct relative path`,
        md.includes("](../../assets/query-dataview-overview.svg)"));
}
check("SVG file exists at docs/assets/query-dataview-overview.svg", existsSync(path.join(repo, "docs/assets/query-dataview-overview.svg")));
const svg = read("docs/assets/query-dataview-overview.svg");
check("SVG: stable viewBox", /viewBox="\d+ \d+ \d+ \d+"/.test(svg));
const svgNoXmlns = svg.replace('xmlns="http://www.w3.org/2000/svg"', "");
check("SVG: no foreignObject/script/external refs/filters/gradients/animation",
    !/foreignObject|<script|xlink:href|http(s)?:\/\/|<filter|<linearGradient|<radialGradient|<animate/.test(svgNoXmlns));
check("SVG: uses marker for arrows", svg.includes("<marker") && svg.includes('marker-end="url(#arrow)"'));
// XML 良构（python 标准库）
try {
    execFileSync("python", ["-c", "import xml.etree.ElementTree as ET; ET.parse('docs/assets/query-dataview-overview.svg'); print('xml ok')"], { cwd: repo, encoding: "utf8" });
    check("SVG: XML well-formed (python ET.parse)", true);
} catch (e) {
    check("SVG: XML well-formed (python ET.parse)", false, String(e));
}
// 无重叠粗查：同列（x 相近）文本行的 y 间距 >= 24（左右两列分开计算）
const texts = [...svg.matchAll(/<text x="(\d+)" y="(\d+)"/g)].map((m) => [+m[1], +m[2]]);
const colGaps = [[0, 400], [400, 1000]].map(([lo, hi]) => {
    const ys = texts.filter((t) => t[0] >= lo && t[0] < hi).map((t) => t[1]).sort((a, b) => a - b);
    if (ys.length < 2) return Infinity;
    return Math.min(...ys.slice(1).map((y, i) => y - ys[i]));
});
check("SVG: per-column text rows have >= 24px vertical spacing", colGaps.every((g) => g >= 24), `colGaps=${colGaps.join(",")}`);

// ---- SVG 语义关系断言（稳定 id + 边几何与目标节点对齐）----
const nodeIds = ["node-query", "node-dataview", "node-query-utils", "node-customview",
    "node-sql", "node-backlink", "node-childdoc", "node-random", "node-more-queries",
    "node-list", "node-table", "node-markdown", "node-mermaid-echarts", "node-more-views",
    "box-queries", "box-dataviews"];
for (const id of nodeIds) {
    check(`SVG: node/box id present: ${id}`, svg.includes(`id="${id}"`));
}
const edgeIds = ["edge-query-utils", "edge-query-dataview", "edge-query-sql", "edge-query-backlink",
    "edge-query-childdoc", "edge-query-random", "edge-query-more",
    "edge-dataview-list", "edge-dataview-table", "edge-dataview-markdown", "edge-dataview-mermaid-echarts", "edge-dataview-more",
    "edge-customview-dataviews"];
for (const id of edgeIds) {
    check(`SVG: edge id present: ${id}`, svg.includes(`id="${id}"`));
}

const rowY = (nodeId) => +(new RegExp(`id="${nodeId}"[^>]* y="(\\d+)"`).exec(svg)?.[1] ?? 0);
const edgeEndY = (edgeId) => {
    const m = new RegExp(`id="${edgeId}"[^>]* d="M (\\d+) (\\d+) H (\\d+) V (\\d+) H (\\d+)"`).exec(svg)
        ?? new RegExp(`id="${edgeId}"[^>]* x1="(\\d+)" y1="(\\d+)" x2="(\\d+)" y2="(\\d+)"`).exec(svg);
    if (!m) return -1;
    // path 边的终点 y = V 后的 y；line 边的终点 y = y2；两者均为 m[4]
    return +m[4];
};

// Query ─► Query.Utils（垂直边落入 Utils 顶边 y=140）
check("edge-query-utils ends at Query.Utils top (y=140)", svg.includes('id="edge-query-utils" x1="135" y1="90" x2="135" y2="140"'));
// Query ─► sql/backlink/childdoc/random/…：每条 path 终点 y 与对应行文本 y 一致
for (const [edge, node] of [["edge-query-sql", "node-sql"], ["edge-query-backlink", "node-backlink"],
    ["edge-query-childdoc", "node-childdoc"], ["edge-query-random", "node-random"], ["edge-query-more", "node-more-queries"]]) {
    check(`SVG: ${edge} ends at ${node} row y`, edgeEndY(edge) === rowY(node), `edgeY=${edgeEndY(edge)} nodeY=${rowY(node)}`);
}
// DataView ─► List/Table/Markdown/Mermaid-ECharts/…：同样逐行对齐
for (const [edge, node] of [["edge-dataview-list", "node-list"], ["edge-dataview-table", "node-table"],
    ["edge-dataview-markdown", "node-markdown"], ["edge-dataview-mermaid-echarts", "node-mermaid-echarts"], ["edge-dataview-more", "node-more-views"]]) {
    check(`SVG: ${edge} ends at ${node} row y`, edgeEndY(edge) === rowY(node), `edgeY=${edgeEndY(edge)} nodeY=${rowY(node)}`);
}
// Query ─Query.DataView()─► DataView：边存在且带显式标签文本
check("SVG: edge-query-dataview is horizontal Query->DataView", svg.includes('id="edge-query-dataview" x1="220" y1="65" x2="580" y2="65"'));
check("SVG: Query->DataView edge labeled 'Query.DataView()'", /<text id="label-edge-query-dataview"[^>]*>Query\.DataView\(\)<\/text>/.test(svg));
// CustomView ─(Register)─► DataViews 注册
check("SVG: edge-customview-dataviews ends at DataViews box bottom (y=390)", svg.includes('id="edge-customview-dataviews" x1="575" y1="430" x2="575" y2="390"'));
check("SVG: CustomView edge labeled 'Register'", /<text id="label-edge-register"[^>]*>Register<\/text>/.test(svg));

// ============ 4. zh_CHT i18n ============
const zh = yaml.load(read("public/i18n/zh_CN.yaml"));
const cht = yaml.load(read("public/i18n/zh_CHT.yaml"));
const deepKeys = (o) => Object.keys(o).sort().map((k) => [k, ...(o[k] && typeof o[k] === "object" ? deepKeys(o[k]) : [])]).flat();
check("zh_CHT: parses and has identical key structure to zh_CN",
    JSON.stringify(deepKeys(zh)) === JSON.stringify(deepKeys(cht)));
check("zh_CHT: reuses zh_CN values (identical content)",
    JSON.stringify(zh) === JSON.stringify(cht));
const distCht = path.join(repo, "dist/i18n/zh_CHT.json");
check("build artifact dist/i18n/zh_CHT.json exists", existsSync(distCht));
if (existsSync(distCht)) {
    const dCht = JSON.parse(readFileSync(distCht, "utf8"));
    check("dist zh_CHT.json key structure matches zh_CN", JSON.stringify(deepKeys(zh)) === JSON.stringify(deepKeys(dCht)));
}

// ============ 5. 构建产物（package.zip） ============
const zip = execFileSync("unzip", ["-l", "package.zip"], { cwd: repo, encoding: "utf8" });
check("package.zip contains i18n/zh_CHT.json", zip.includes("i18n/zh_CHT.json"));
check("package.zip contains docs/assets/query-dataview-overview.svg", zip.includes("docs/assets/query-dataview-overview.svg"));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
