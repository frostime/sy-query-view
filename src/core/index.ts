/*
 * Copyright (c) 2024 by zxhd863943427, frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-08 15:00:37
 * @FilePath     : /src/func/data-query/index.ts
 * @LastEditTime : 2024-12-01 11:23:34
 * @Description  :
 *      - Fork from project https://github.com/zxhd863943427/siyuan-plugin-data-query
 *      - 基于该项目的 v0.0.7 版本进行修改
 */
// import type FMiscPlugin from "@/index";
import {
    Plugin,
} from "siyuan";

import { embedBlockEvent } from "./editor";
import Query from "./query";
import { onProtyleDestroyed } from "./gc";
/**************************************** Func ****************************************/


export let name = "DataQuery";
export let enabled = false;
export const load = (plugin: Plugin) => {
    if (enabled) return;

    globalThis.Query = Query;

    plugin.eventBus.on("click-blockicon", embedBlockEvent);
    plugin.eventBus.on("destroy-protyle", onProtyleDestroyed);

    enabled = true;
}

export const unload = (plugin: Plugin) => {
    if (!enabled) return;

    delete globalThis.newDV;
    delete globalThis.Query;

    plugin.eventBus.off("click-blockicon", embedBlockEvent);
    plugin.eventBus.off("destroy-protyle", onProtyleDestroyed);

    enabled = false;
}
