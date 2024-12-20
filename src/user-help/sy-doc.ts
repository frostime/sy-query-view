import { createDocWithMd, removeDoc, renameDoc, request, setBlockAttrs, sql, updateBlock } from "@/api";
import type QueryViewPlugin from "@/index";
import { openBlock } from "@/utils";
import { confirm, showMessage } from "siyuan";
import { i18n } from "@/index";
import { setting } from "@/setting";


const CUSTOM_USER_README_ATTR = 'custom-query-view-user-readme';

const compareVersion = (v1: string, v2: string) => {
    const onlyNum = (str: string) => str.replace(/\D/g, '');
    const toNum = (str: string) => {
        str = onlyNum(str);
        return str.length > 0 ? Number(str) : 0;
    }

    const v1Arr = v1.split('.').map(toNum);
    const v2Arr = v2.split('.').map(toNum);
    for (let i = 0; i < v1Arr.length; i++) {
        if (v1Arr[i] > v2Arr[i]) {
            return 1;
        } else if (v1Arr[i] < v2Arr[i]) {
            return -1;
        }
    }
    return 0;
}

const OutlineCode = `
> {{//!js_esc_newline_const query = async () => {_esc_newline_    let dv = Query.DataView(protyle, item, top);_esc_newline_    let ans = await Query.request('/api/outline/getDocOutline', {_esc_newline_        id: Query.root_id(protyle)_esc_newline_    });_esc_newline_    const iterate = (data) => {_esc_newline_        for (let item of data) {_esc_newline_            if (item.count > 0) {_esc_newline_                let subtocs = iterate(item.blocks ?? item.children);_esc_newline_                item.children = Query.wrapBlocks(subtocs);_esc_newline_            }_esc_newline_        }_esc_newline_        return data;_esc_newline_    }_esc_newline_    let tocs = iterate(ans);_esc_newline_    dv.addmd('### Outline');_esc_newline_    dv.addlist(tocs, {_esc_newline_	renderer: b => \`[\${b.name || b.content}](\${b.asurl})\`,_esc_newline_        columns: 2_esc_newline_    });_esc_newline_    dv.render();_esc_newline_}_esc_newline__esc_newline_return query();}}
`.trim();


const createReadmeText = async (plugin: QueryViewPlugin) => {
    const lang = window.siyuan.config.lang;
    const fname = lang.startsWith('zh') ? 'README_zh_CN.md' : 'README.md';

    const response = await fetch(`/plugins/sy-query-view/${fname}`);
    let readme = await response.text();

    if (setting.onlyImportDtsInUserDoc) {
        // 找到 ​`<!-- REFERENCE-START -->`​ 和 ​`<!-- REFERENCE-END -->`​ 之间的内容
        const start = '`<!-- REFERENCE-START -->`';
        const end = '`<!-- REFERENCE-END -->`';
        const startIndex = readme.indexOf(start);
        const endIndex = readme.indexOf(end);

        const hint = i18n.src_userhelp_sydocts.plugin_setting_doc;

        if (startIndex !== -1 && endIndex !== -1) {
            readme = readme.substring(startIndex + start.length, endIndex).trim();
        }

        readme = hint + '\n\n' + readme;
    }

    const AheadHint = i18n.user_help.ahead_hint.trim();
    let ahead = AheadHint.replace('{{version}}', plugin.version);
    readme = ahead + '\n' + OutlineCode + '\n\n' + readme;
    return readme;
}

const createReadme = async (plugin: QueryViewPlugin, title: string) => {
    const notebooks = window.siyuan.notebooks.filter(n => n.closed === false);
    if (notebooks.length === 0) {
        showMessage(i18n.src_userhelp_indexts.create_notebook);
        return null;
    }
    const notebook = notebooks[0];
    let readme = await createReadmeText(plugin);
    let docId = await createDocWithMd(notebook.id, `/${title}`, readme);
    const attr = {
        [CUSTOM_USER_README_ATTR]: plugin.version,
        'custom-sy-readonly': 'true'
    };
    await setBlockAttrs(docId, attr);
    return docId;
}

const useUserReadme = async (plugin: QueryViewPlugin) => {
    const docs: (Block & { version: string })[] = await sql(`
        SELECT B.*, A.value as version
        FROM blocks AS B
        JOIN attributes AS A ON A.block_id = B.id
        WHERE A.name = '${CUSTOM_USER_README_ATTR}'
        ORDER BY B.UPDATED DESC;
    `);

    let targetDocId: DocumentId = null;

    if (!docs || docs.length === 0) {
        const title = `${plugin.displayName}@${plugin.version} ` + i18n.src_userhelp_indexts.help_doc;
        targetDocId = await createReadme(plugin, title);
        showMessage(i18n.src_userhelp_sydocts.create_user_doc + ' ' + title);
    } else if (docs.length === 1) {
        targetDocId = docs[0].id;
    } else {
        //找到版本号最大的文档
        docs.sort((a, b) => compareVersion(b.version, a.version));
        targetDocId = docs[0].id;
        const others = docs.slice(1);
        for (let doc of others) {
            await removeDoc(doc.box, doc.path);
        }
    }

    // validate version
    if (!targetDocId) return;
    const attrVer = await sql(`
        SELECT A.value
        FROM attributes AS A
        WHERE A.name = '${CUSTOM_USER_README_ATTR}'
        AND A.block_id = '${targetDocId}'
    `);
    if (attrVer.length === 0) return;
    const attrVerStr = attrVer[0].value;

    const updateDoc = async () => {
        showMessage(i18n.src_userhelp_sydocts.plugin_update_doc, 5000)
        let newText = await createReadmeText(plugin);
        const title = `${plugin.displayName}@${plugin.version} ` + i18n.src_userhelp_indexts.help_doc;
        const doc = docs[0];
        await renameDoc(doc.box, doc.path, title)
        await updateBlock('markdown', newText, targetDocId);
        await setBlockAttrs(targetDocId, {
            [CUSTOM_USER_README_ATTR]: plugin.version,
            'custom-sy-readonly': 'true'
        });
    }

    if (attrVerStr.trim() !== plugin.version.trim()) {
        await updateDoc();
    }
    setTimeout(() => {
        openBlock(targetDocId);
    }, 0);
}

export {
    useUserReadme
}
