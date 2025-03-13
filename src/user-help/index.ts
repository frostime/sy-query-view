/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-10 18:46:12
 * @FilePath     : /src/user-help/index.ts
 * @LastEditTime : 2025-03-13 22:01:01
 * @Description  : 
 */
import { i18n } from "@/index";
import type QueryViewPlugin from "@/index";
import { useUserReadme } from "./sy-doc";
import { useExamples } from "./examples";
import { insertBlock } from "@/api";
import { setting } from "@/setting";
import { showMessage } from "siyuan";

const child_process = require("child_process");

const BASIC_TEMPLATE = () => `
//!js
const query = async () => {
    //${i18n.src_userhelp_indexts.useview}
    //let dv = Query.DataView(protyle, item, top);

    const SQL = \`
        select * from blocks
        order by random()
        limit 5;
    \`;
    let blocks = await Query.sql(SQL);

    return blocks.pick('id');
    //${i18n.src_userhelp_indexts.useview2}
    //dv.addlist(blocks);
    //dv.render();
}

return query();
`.trim();

const toEmbed = (code: string) => {
    code = code.trim();
    return '{{' + code.replaceAll('\n', '_esc_newline_') + '}}\n{: breadcrumb="true" }';
}

const openLocalDTSFile = () => {
    if (!child_process) return;
    const endpoint = '/plugins/sy-query-view/types.d.ts'
    const dataDir = window.siyuan.config.system.dataDir;

    const path = window?.require('path');
    const filepath = path.join(dataDir, endpoint);

    const codeEditor = setting.codeEditor;
    const command = codeEditor.replace('{{filepath}}', filepath);
    child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
            console.warn('Error executing command:', err);
        } else {
            // console.debug('Command executed successfully:', stdout);
        }
    });
}


export const load = async (plugin: QueryViewPlugin) => {
    const pluignUrl = '/plugins/sy-query-view/plugin.json';
    const pluginJson = await fetch(pluignUrl).then(res => res.json());
    const pluginName = pluginJson.name;
    const pluginVersion = pluginJson.version;

    plugin.protyleSlash.push({
        filter: ['qv-basic', 'queryview'],
        html: i18n.src_userhelp_indexts.queryview,
        id: pluginName,
        callback: (protyle) => {
            protyle.insert(window.Lute.Caret, false, false);
            const selection = document.getSelection();
            if (selection.rangeCount === 0) {
                return;
            }
            const range = selection.getRangeAt(0);
            const element = range.startContainer.parentElement;
            const node = element.closest('div[data-node-id]');
            if (!node) {
                return;
            }
            const id = node.getAttribute('data-node-id');
            setTimeout(async () => {
                await insertBlock('markdown', toEmbed(BASIC_TEMPLATE()), null, id, null);
            }, 500);
        }
    });

    if (child_process) {

        plugin.registerMenuItem({
            label: i18n.src_userhelp_indexts.open_locally + ' d.ts',
            icon: 'iconEdit',
            click: () => {
                try {
                    openLocalDTSFile();
                } catch (error) {
                    console.error(error);
                    showMessage(i18n.src_userhelp_indexts.unable_open_d_ts, 3000, 'error');
                }
            }
        });
    }

    plugin.registerMenuItem({
        label: i18n.src_userhelp_indexts.download + ' d.ts',
        icon: 'iconDownload',
        click: () => {
            const url = '/plugins/sy-query-view/types.d.ts';
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pluginName}@${pluginVersion}.types.d.ts`;
            a.click();
        }
    });

    plugin.version = pluginVersion;

    plugin.registerMenuItem({
        label: i18n.src_userhelp_indexts.help_doc,
        icon: 'iconHelp',
        click: () => {
            useUserReadme(plugin);
        }
    });
    const { open } = await useExamples(plugin);
    plugin.registerMenuItem({
        label: 'Examples',
        icon: 'iconCode',
        click: open
    });
}
