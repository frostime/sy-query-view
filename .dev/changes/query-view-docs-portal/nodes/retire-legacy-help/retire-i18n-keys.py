# Retire i18n keys as COMPLETE YAML entries (key line + all continuation lines),
# preserving every other byte. Then verify with js-yaml.
import re
import subprocess

GROUPS_REMOVE = ["src_userhelp_examplests", "src_userhelp_sydocts", "user_help"]
KEYS_REMOVE = {
    "src_userhelp_indexts": ["create_notebook", "help_doc_2", "useview", "useview2", "unable_open_d_ts"],
    "src_setting_indexts": ["user_doc_import_type_ref", "plugin_import_help_doc"],
}
ADD = {"src_userhelp_indexts": {"basic_template_load_failed": None}}  # value per lang below

KEY_RE = re.compile(r"^  ([A-Za-z_][A-Za-z0-9_]*):")
GROUP_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):")


def remove_entries(src: str, group: str, keys):
    lines = src.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = GROUP_RE.match(line)
        if m and m.group(1) == group:
            if keys is None:
                # remove whole group: consume group header + all indented lines（含组内空行）
                i += 1
                while i < len(lines) and (lines[i].startswith((" ", "\t")) or lines[i] == ""):
                    i += 1
                continue
            out.append(line)
            i += 1
            # inside group: drop target keys incl. continuation lines (indent > 2)
            while i < len(lines) and lines[i].startswith("  "):
                km = KEY_RE.match(lines[i])
                if km and km.group(1) in keys:
                    i += 1
                    while i < len(lines) and re.match(r"^ {3,}|\t", lines[i]):
                        i += 1
                    continue
                out.append(lines[i])
                i += 1
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


def add_keys(src: str, group: str, additions: dict):
    lines = src.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = GROUP_RE.match(line)
        if m and m.group(1) == group:
            out.append(line)
            i += 1
            while i < len(lines) and lines[i].startswith("  "):
                out.append(lines[i])
                i += 1
            for k, v in additions.items():
                out.append(f"  {k}: {v}")
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


def process(path: str, additions: dict):
    src = open(path, encoding="utf8").read()
    for g in GROUPS_REMOVE:
        src = remove_entries(src, g, None)
    for g, keys in KEYS_REMOVE.items():
        src = remove_entries(src, g, keys)
    src = add_keys(src, "src_userhelp_indexts", additions)
    open(path, "w", encoding="utf8", newline="\n").write(src)
    print("processed", path)


process("public/i18n/zh_CN.yaml", {"basic_template_load_failed": "基础模板加载失败，请查看控制台"})
process("public/i18n/en_US.yaml", {"basic_template_load_failed": "Failed to load the basic template, please check the console"})
