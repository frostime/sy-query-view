/*
 * Copyright (c) 2024 by zxhd863943427, frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-08 15:00:37
 * @FilePath     : /src/core/index.ts
 * @LastEditTime : 2024-12-05 19:44:58
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
import { disposeAll, onProtyleDestroyed } from "./finalize";
import { loadUserCustomView } from "./custom-view";

import { i18n } from '@/index';
import { onSyncStart, onSyncEnd, onSyncFail } from "./sync-control";
/**************************************** Func ****************************************/


export let name = "DataQuery";
export let enabled = false;
export const load = (plugin: Plugin) => {
    if (enabled) return;

    globalThis.Query = Query;

    plugin.eventBus.on("click-blockicon", embedBlockEvent);
    plugin.eventBus.on("destroy-protyle", onProtyleDestroyed);
    plugin.eventBus.on("sync-start", onSyncStart);
    plugin.eventBus.on("sync-end", onSyncEnd);
    plugin.eventBus.on("sync-fail", onSyncFail);

    loadUserCustomView().then(status => {
        if (status.exists && !status.valid) {
            showMessage(i18n.src_core_indexts.custom_queryview_error, 5000, 'error');
            return;
        }
        if (status.ok) {
            console.debug(`Load custom query-view, ${Object.keys(status.custom)}`);
        }
    });

    enabled = true;
}

export const unload = (plugin: Plugin) => {
    if (!enabled) return;

    disposeAll();

    delete globalThis.newDV;
    delete globalThis.Query;

    plugin.eventBus.off("click-blockicon", embedBlockEvent);
    plugin.eventBus.off("destroy-protyle", onProtyleDestroyed);
    plugin.eventBus.off("sync-start", onSyncStart);
    plugin.eventBus.off("sync-end", onSyncEnd);
    plugin.eventBus.off("sync-fail", onSyncFail);

    enabled = false;
}
