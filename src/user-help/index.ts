/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-10 18:46:12
 * @FilePath     : /src/user-help/index.ts
 * @LastEditTime : 2024-12-11 18:35:52
 * @Description  : 
 */
import { i18n } from "@/index";
import type QueryViewPlugin from "@/index";
import { useUserReadme } from "./sy-doc";
import { useExamples } from "./examples";

export const load = async (plugin: QueryViewPlugin) => {
    const pluignUrl = '/plugins/sy-query-view/plugin.json';
    const pluginJson = await fetch(pluignUrl).then(res => res.json());
    const pluginName = pluginJson.name;
    const pluginVersion = pluginJson.version;

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

    plugin.registerMenuItem({
        label: i18n.src_userhelp_indexts.help_doc,
        icon: 'iconHelp',
        click: async () => {
            const { open } = await useExamples(plugin);
            open();
        }
    });
}
