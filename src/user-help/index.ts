/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-10 18:46:12
 * @FilePath     : /src/user-help/index.ts
 * @LastEditTime : 2025-03-13 22:01:01
 * @Description  : 帮助入口：仅保留 Help 菜单（打开文档站）与 qv-basic 基础模板斜杠菜单。
 *                 旧帮助笔记（sy-doc）、独立 Examples 与 d.ts 顶栏菜单已退役；
 *                 基础模板唯一代码来源为 public/example/basic-template.js（运行时读取并缓存）。
 */
import { i18n } from "@/index";
import type QueryViewPlugin from "@/index";
import { insertBlock } from "@/api";
import { showMessage } from "siyuan";
import * as DocsSite from "@/docs-site";
import { getPluginInfo } from "./dts-actions";

const toEmbed = (code: string) => {
    code = code.trim();
    return '{{' + code.replaceAll('\n', '_esc_newline_') + '}}\n{: breadcrumb="true" }';
}

// 基础模板缓存（public/example/basic-template.js，随插件发布；文档站复制按钮与斜杠菜单共用同一份）
let basicTemplateCache: string | null = null;
const getBasicTemplate = async (pluginName: string): Promise<string> => {
    if (basicTemplateCache === null) {
        const res = await fetch(`/plugins/${pluginName}/example/basic-template.js`);
        if (!res.ok) {
            throw new Error(`basic-template fetch failed: HTTP ${res.status}`);
        }
        basicTemplateCache = await res.text();
    }
    return basicTemplateCache;
}

export const load = async (plugin: QueryViewPlugin) => {
    const { name: pluginName } = await getPluginInfo(plugin.name);
    const docsSite = await DocsSite.load(plugin);
    plugin.disposeCb.push(() => docsSite.dispose());

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
                try {
                    const code = await getBasicTemplate(pluginName);
                    await insertBlock('markdown', toEmbed(code), null, id, null);
                } catch (error) {
                    console.warn('qv-basic: failed to load basic template', error);
                    showMessage(i18n.src_userhelp_indexts.basic_template_load_failed, 3000, 'error');
                }
            }, 500);
        }
    });

    plugin.registerMenuItem({
        label: i18n.src_userhelp_indexts.help_doc,
        icon: 'iconHelp',
        click: () => {
            docsSite.open();
        }
    });
}
