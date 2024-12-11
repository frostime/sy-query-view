/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-11 18:24:00
 * @FilePath     : /src/user-help/examples.ts
 * @LastEditTime : 2024-12-11 19:33:12
 * @Description  : 
 */
import { getFileBlob, readDir } from "@/api";
import type QueryViewPlugin from ".."
import { openTab } from "siyuan";

import { i18n } from "..";

let exampleHTML = '';

const Description = {
    "exp-avs-under-root-doc.js": () => i18n.src_userhelp_examplests.query_attr_views,
    "exp-created-docs.js": () => i18n.src_userhelp_examplests.docs_per_month,
    "exp-daily-sentence.js": () => i18n.src_userhelp_examplests.daily_quote,
    "exp-doc-backlinks-table.js": () => i18n.src_userhelp_examplests.backlinks_table,
    "exp-gpt-chat.js": () => i18n.src_userhelp_examplests.simple_chatgpt,
    "exp-gpt-translate.js": () => i18n.src_userhelp_examplests.random_text_translate,
    "exp-outline.js": () => i18n.src_userhelp_examplests.doc_outline_tree,
    "exp-sql-executor.js": () => i18n.src_userhelp_examplests.sql_exec_result,
    "exp-today-updated.js": () => i18n.src_userhelp_examplests.updated_docs_today
};

const addSection = (title: string, content: string) => {
    let desc = Description[title]?.() ?? '';
let newpart = `
<h4>${title}</h4>

${desc ? `<blockquote>${desc}</blockquote>` : '' }

<textarea
    class="form-control b3-text-field fn__block"
    rows="15" readonly
    style="font-size: 1.25rem; line-height: 1.5rem; resize: vertical;"
>
${content}
</textarea>

<br/>
<br/>

`;
    exampleHTML += newpart;
}

const loadJsContent = async (path: string) => {
    const blob = await getFileBlob(path);
    const content = await blob.text();
    return content;
}

export const useExamples = async (plugin: QueryViewPlugin) => {
    const examplePath = `/data/plugins/${plugin.name}/example`;
    const files = await readDir(examplePath);

    const routePrefix = `/plugins/${plugin.name}/example`;
    for (const file of files) {
        let name = file.name;
        const filePath = `${examplePath}/${name}`;
        const content = await loadJsContent(filePath);
        addSection(name, content);
    }

    plugin.addTab({
        type: 'js-example',
        init() {
            const readme = document.createElement('div');
            readme.classList.add('item__readme');
            readme.classList.add('b3-typography');
            readme.classList.add('b3-typography--default');
            readme.innerHTML = exampleHTML;
            readme.style.padding = '10px 15%';
            this.element.appendChild(readme);
        }
    });

    return {
        open() {
            openTab({
                app: plugin.app,
                custom: {
                    id: `${plugin.name}js-example`,
                    title: 'Query&View Examples',
                    icon: 'iconCode'
                }
            })
        }
    }
}
