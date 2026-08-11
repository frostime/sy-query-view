# Re-add src_docsite_indexts group (GUI task's uncommitted i18n additions) from the built dist/i18n JSON
# (the correction round's HEAD-restore had dropped them; dist still carries the exact values).
import json

for lang, path in [("zh_CN", "public/i18n/zh_CN.yaml"), ("en_US", "public/i18n/en_US.yaml")]:
    group = json.load(open(f"dist/i18n/{lang}.json", encoding="utf8"))["src_docsite_indexts"]
    with open(path, "a", encoding="utf8", newline="\n") as f:
        if not src.endswith("\n"):
            f.write("\n")
        f.write("src_docsite_indexts:\n")
        for k, v in group.items():
            f.write(f"  {k}: {v}\n")
    print("appended src_docsite_indexts to", path, len(group), "keys")
