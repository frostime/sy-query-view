/*
 * Copyright (c) 2024 by zxhd863943427, frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-08 15:00:37
 * @FilePath     : /src/core/index.ts
 * @LastEditTime : 2025-03-13 22:06:05
 * @Description  :
 *      - Fork from project https://github.com/zxhd863943427/siyuan-plugin-data-query
 *      - 基于该项目的 v0.0.7 版本进行修改
 */
// import type FMiscPlugin from "@/index";
import {
    IMenu,
    showMessage,
} from "siyuan";

import { embedBlockEvent } from "./editor";
import Query from "./query";
import { finalizeAllDataviews, onProtyleDestroyed } from "./finalize";
import { loadUserCustomView, filepath as customViewFilePath } from "./custom-view";
import { setting } from "../setting";
import type QueryViewPlugin from "..";
import { i18n } from "..";

const child_process = window?.require?.('child_process');


const openCustomViewDirectory = (open: 'file' | 'dir') => {
    if (!child_process) return;
    const workspaceDir = window.siyuan.config.system.workspaceDir;

    const path = window?.require('path');
    const jsPath = path.join(workspaceDir, customViewFilePath);
    const dirPath = path.dirname(jsPath);

    const electron = window?.require?.('electron');
    if (!electron) {
        let msg = open === 'file' ? i18n.src_userhelp_indexts.unable_open_custom_view : i18n.src_userhelp_indexts.unable_open_custom_view_dir;
        showMessage(msg, 3000, 'error');
        return;
    }
    if (open === 'file') {
        // electron?.shell.openPath(jsPath);
        const command = setting.codeEditor.replace('{{filepath}}', jsPath);
        child_process.exec(command, (err, stdout, stderr) => {
            if (err) {
                console.warn('Error executing command:', err);
            } else {
                // console.debug('Command executed successfully:', stdout);
            }
        });
    } else {
        electron?.shell.openPath(dirPath);
    }
}

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

    const submenus: IMenu[] = [
        {
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
        }
    ];


    if (child_process) {
        submenus.push({
            label: i18n.src_userhelp_indexts.edit_custom_view,
            icon: 'iconCode',
            click: () => {
                try {
                    openCustomViewDirectory('file');
                } catch (error) {
                    console.error(error);
                    showMessage(i18n.src_userhelp_indexts.unable_open_custom_view, 3000, 'error');
                }
            }
        });
        submenus.push({
            label: i18n.src_userhelp_indexts.open_custom_view_dir,
            icon: 'iconFolder',
            click: () => {
                try {
                    openCustomViewDirectory('dir');
                } catch (error) {
                    console.error(error);
                    showMessage(i18n.src_userhelp_indexts.unable_open_custom_view_dir, 3000, 'error');
                }
            }
        })
    }

    plugin.registerMenuItem({
        label: 'CustomView',
        icon: 'iconCode',
        submenu: submenus
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
