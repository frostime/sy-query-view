/*
 * Copyright (c) 2024 by zxhd863943427, frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-08 15:00:37
 * @FilePath     : /src/core/index.ts
 * @LastEditTime : 2024-12-06 22:19:56
 * @Description  :
 *      - Fork from project https://github.com/zxhd863943427/siyuan-plugin-data-query
 *      - 基于该项目的 v0.0.7 版本进行修改
 */
// import type FMiscPlugin from "@/index";
import {
    Plugin,
    showMessage,
} from "siyuan";

import { embedBlockEvent } from "./editor";
import Query from "./query";
import { finalizeAllDataviews, onProtyleDestroyed } from "./finalize";
import { loadUserCustomView } from "./custom-view";


const load = (plugin: Plugin) => {

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
}

const unload = (plugin: Plugin) => {

    finalizeAllDataviews();

    delete globalThis.Query;

    plugin.eventBus.off("click-blockicon", embedBlockEvent);
    plugin.eventBus.off("destroy-protyle", onProtyleDestroyed);
}

export {
    load, unload,
    finalizeAllDataviews
};
