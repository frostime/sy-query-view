/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-11 18:24:00
 * @FilePath     : /src/user-help/examples.ts
 * @LastEditTime : 2024-12-20 22:21:09
 * @Description  : 
 */
import { getFileBlob, readDir } from "@/api";
import type QueryViewPlugin from ".."
import { openTab } from "siyuan";

import styles from './index.module.scss';

import { i18n } from "..";

let exampleHTML = `
<div class="${styles['to-top']}">
    <svg>
        <use xlink:href="#iconUp"></use>
    </svg>
</div>
`;

const Description = {
    "exp-month-todo.js": () => i18n.src_userhelp_examplests.query_this_month_todo,
    "exp-child-docs.js": () => i18n.src_userhelp_examplests.list_doc_subsections,
    "exp-avs-under-root-doc.js": () => i18n.src_userhelp_examplests.query_attr_views,
    "exp-doc-backlinks-table.js": () => i18n.src_userhelp_examplests.backlinks_table,
    "exp-doc-backlinks-grouped.js": () => i18n.src_userhelp_examplests.doc_backlinks_grouping,
    "exp-outline.js": () => i18n.src_userhelp_examplests.doc_outline_tree,
    "exp-latest-update-doc.js": () => i18n.src_userhelp_examplests.recent_docs,
    "exp-today-updated.js": () => i18n.src_userhelp_examplests.updated_docs_today,
    "exp-created-docs.js": () => i18n.src_userhelp_examplests.docs_per_month,
    "exp-sql-executor.js": () => i18n.src_userhelp_examplests.sql_exec_result,
    "exp-gpt-chat.js": () => i18n.src_userhelp_examplests.simple_chatgpt,
    "exp-doc-backlinks-graph.js": () => i18n.src_userhelp_examplests.echarts_graph_ref,
    "exp-show-asset-images.js": () => i18n.src_userhelp_examplests.view_assets_images,
    "exp-daily-sentence.js": () => i18n.src_userhelp_examplests.daily_quote,
    "exp-gpt-translate.js": () => i18n.src_userhelp_examplests.random_text_translate,
    "exp-doc-tree.js": () => i18n.src_userhelp_examplests.query_doc_tree,
    "exp-month-todo-kanban.js": () => i18n.src_userhelp_examplests.unfinished_task_monthly,
    "exp-month-todo-timeline.js": () => i18n.src_userhelp_examplests.query_unfinished_tasks
};

const addSection = (title: string, content: string) => {
    let desc = Description[title]?.() ?? '';
    let newpart = `
<h4 id="${title.replace(/\s+/g, '-').toLowerCase()}">${title}</h4>

${desc ? `<blockquote style="margin: 5px 0;">${desc}</blockquote>` : ''}

<textarea
    class="form-control b3-text-field fn__block"
    rows="15" readonly
    style="font-size: 1.25rem; line-height: 1.5rem; resize: vertical;"
>
${content}
</textarea>

<hr/>

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
    let files = await readDir(examplePath);
    let filenames = files.map(f => f.name);
    const keys = Object.keys(Description);
    filenames.sort((a: string, b: string) => {
        if (Description[a] === undefined) return 1;
        if (Description[b] === undefined) return -1;

        const indexA = keys.indexOf(a);
        const indexB = keys.indexOf(b);
        return indexA - indexB;
    });

    // const routePrefix = `/plugins/${plugin.name}/example`;

    const tocli = filenames.map(title => 
        `<li>
            <span class="${styles['link']}" data-target="${title.replace(/\s+/g, '-').toLowerCase()}">
                ${title}
            </span>
        </li>`
    );

    const toc = `
    <h3 class="TOC">TOC</h3>
    <ol style="columns: 3;">${tocli.join('')}</ol>

    <h3> Examples </h3>
    `;
    exampleHTML += toc;

    for (const file of filenames) {
        let name = file;
        const filePath = `${examplePath}/${name}`;
        const content = await loadJsContent(filePath);
        addSection(name, content);
    }

    const onClick = (event: MouseEvent) => {
        // Get the target element
        const target = event.target as HTMLElement;

        // Check if the clicked element is an <li> with a data-target attribute
        if (target.tagName === 'SPAN' && target.hasAttribute('data-target')) {
            // Get the value of the data-target attribute
            const targetId = target.getAttribute('data-target');

            // Find the element with the corresponding id
            const elementToScrollTo = document.getElementById(targetId);

            // Scroll to the element if it exists
            if (elementToScrollTo) {
                elementToScrollTo.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (target.closest(`.${styles['to-top']}`)) {
            // Scroll to the top of the page
            const container = target.closest(`.item__readme`);
            container?.querySelector('h3.TOC')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
            this.element.addEventListener('click', onClick);
        },
        destroy() {
            this.element.removeEventListener('click', onClick);
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
