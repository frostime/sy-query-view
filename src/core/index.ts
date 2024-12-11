/*
 * Copyright (c) 2024 by zxhd863943427, frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-08 15:00:37
 * @FilePath     : /src/core/index.ts
 * @LastEditTime : 2024-12-11 18:17:26
 * @Description  :
 *      - Fork from project https://github.com/zxhd863943427/siyuan-plugin-data-query
 *      - 基于该项目的 v0.0.7 版本进行修改
 */
// import type FMiscPlugin from "@/index";
import {
    showMessage,
} from "siyuan";

import { embedBlockEvent } from "./editor";
import Query from "./query";
import { finalizeAllDataviews, onProtyleDestroyed } from "./finalize";
import { loadUserCustomView } from "./custom-view";
import type QueryViewPlugin from "..";
import { i18n } from "..";

const load = (plugin: QueryViewPlugin) => {

    globalThis.Query = Query;

    plugin.eventBus.on("click-blockicon", embedBlockEvent);
    //关闭页签的时候，finailize 内部的 dataview
    plugin.eventBus.on("destroy-protyle", onProtyleDestroyed);

    loadUserCustomView().then(status => {
        if (status.exists && !status.valid) {
            //@ts-ignore
            showMessage(plugin.i18n.src_core_indexts.custom_queryview_error, 5000, 'error');
            return;
        }
        if (status.ok) {
            console.debug(`Load custom query-view: ${Object.keys(status.custom)}`);
        }
    });

    plugin.registerMenuItem({
        //@ts-ignore
        label: i18n.src_core_indexts.reload_custom_comp,
        icon: 'iconAccount',
        click: async () => {
            const result = await loadUserCustomView();
            if (result.ok) {
                let cnt = Object.keys(result.custom).length;
                showMessage(i18n.src_setting_indexts.import_success.replace('{cnt}', `${cnt}`), 3000, 'info');
            } else {
                showMessage(i18n.src_setting_indexts.import_failed, 3000, 'error');
            }
        }
    });
}

const unload = (plugin: QueryViewPlugin) => {

    finalizeAllDataviews();

    delete globalThis.Query;

    plugin.eventBus.off("click-blockicon", embedBlockEvent);
    plugin.eventBus.off("destroy-protyle", onProtyleDestroyed);
}

export {
    load, unload,
    finalizeAllDataviews
};
