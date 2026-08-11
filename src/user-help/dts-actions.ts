/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description  : 依赖叶：d.ts 打开/下载动作。被既有菜单（src/user-help/index.ts）与文档站（src/docs-site）共用。
 *                 不依赖任何内部模块；child_process 经 window.require 可选获取，不做顶层 require。
 *                 契约见 .dev/changes/query-view-docs-portal/nodes/shape-docs-gui/docs-site.LAND.md §7。
 */

/** 仅探测 window.require 是否存在（桌面端），无需输入 */
export const canOpenLocally = (): boolean => typeof window.require === "function";

/**
 * 用设置中的命令在本地打开 types.d.ts。
 * @param pluginName 用于拼 /plugins/{pluginName}/types.d.ts 的本地文件路径
 * @param codeEditor 外部编辑器命令，{{filepath}} 会被替换为实际文件路径
 */
export const openDtsLocally = (pluginName: string, codeEditor: string): void => {
    const childProcess = window.require?.("child_process");
    if (!childProcess) return;
    const endpoint = `/plugins/${pluginName}/types.d.ts`;
    const dataDir = window.siyuan.config.system.dataDir;
    const path = window.require("path");
    const filepath = path.join(dataDir, endpoint);
    const command = codeEditor.replace("{{filepath}}", filepath);
    childProcess.exec(command, (err: unknown) => {
        if (err) {
            console.warn("Error executing command:", err);
        }
    });
};

/** 下载当前插件版本的类型声明文件，文件名 {pluginName}@{version}.types.d.ts */
export const downloadDts = (pluginName: string, version: string): void => {
    const url = `/plugins/${pluginName}/types.d.ts`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pluginName}@${version}.types.d.ts`;
    a.click();
};

/**
 * 读取插件 plugin.json 的 name/version。
 * 显式入参 pluginName（模块无法自推断插件名，禁止隐式读取）。
 */
export const getPluginInfo = async (pluginName: string): Promise<{ name: string; version: string }> => {
    const res = await fetch(`/plugins/${pluginName}/plugin.json`);
    const json = await res.json();
    return { name: json.name, version: json.version };
};
