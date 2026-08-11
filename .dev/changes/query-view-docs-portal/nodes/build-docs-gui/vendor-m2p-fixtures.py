# One-off: vendor excerpts of 88250/lute test/m2p_test.go into m2p-fixtures.json
import json
import re
import urllib.request

URL = "https://raw.githubusercontent.com/88250/lute/master/test/m2p_test.go"
src = urllib.request.urlopen(URL, timeout=60).read().decode("utf8")

# Go test tuples: {"id", "md", "html"},
pat = re.compile(r'\{"(\d+)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\}')
cases = {}
for m in pat.finditer(src):
    cid, md, html = m.group(1), m.group(2), m.group(3)
    cases[cid] = {"md": md, "html": html}

# Go 双引号字符串字面量转义解码（用于 HTML 产物字段）
def unescape_go(s: str) -> str:
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)
    s = s.replace('\\"', '"').replace('\\\\', '\\').replace('\\n', '\n').replace('\\t', '\t')
    return s


wanted = {
    "88": "code block plain",
    "34": "code block with lang",
    "81": "link relative (www.bing.com)",
    "26": "link assets path",
    "46": "link strong a",
    "96": "link u a",
    "9": "link sup a",
    "32": "heading h1",
    "44": "image relative",
    "117": "link javascript empty href",
}
missing = [k for k in wanted if k not in cases]
assert not missing, f"missing cases: {missing}"

out = {
    "source": "https://github.com/88250/lute/blob/master/test/m2p_test.go",
    "fetched": "2026-08-11",
    "note": "Vendored excerpts (Markdown -> Protyle block DOM fixtures) for selector-contract verification of src/docs-site/render.ts.",
    "cases": {k: {"label": wanted[k], "md": cases[k]["md"], "html": unescape_go(cases[k]["html"])} for k in wanted},
}
path = ".dev/changes/query-view-docs-portal/nodes/build-docs-gui/m2p-fixtures.json"
with open(path, "w", encoding="utf8", newline="\n") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("fixture cases:", sorted(out["cases"].keys()))
