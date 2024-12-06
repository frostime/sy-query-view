/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 11:21:44
 * @FilePath     : /src/core/finalize.ts
 * @LastEditTime : 2024-12-06 15:39:57
 * @Description  : 
 */
import { DataView } from "./data-view";

const dataviews = new Map<DocumentId, WeakRef<DataView>[]>();

// const sessionStorageKeys = new Map<DocumentId, string[]>();

const registry = new FinalizationRegistry((docId: string) => {
    const views = dataviews.get(docId);
    if (views) {
        views.forEach(view => {
            const dataView = view.deref();
            if (dataView) {
                console.debug(`FinalizationRegistry dispose dataView@${dataView.embed_id} under doc@${dataView.root_id}`);
                dataView.dispose();
            }
        });
        dataviews.delete(docId);
    }
});

/**
 * 获取 sessionStorage 占用的大小
 * @returns 
 */
export function getSessionStorageSize() {
    let totalSize = 0;
    for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
            let value = sessionStorage.getItem(key);
            totalSize += value.length * 2; // 每个字符占用 2 字节（UTF-16）
        }
    }

    function formatSize(size) {
        if (size < 1024) {
            return size + ' bytes';
        } else if (size < 1024 * 1024) {
            return (size / 1024).toFixed(2) + ' KB';
        } else {
            return (size / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
    return formatSize(totalSize);
}



/**
 * Register DataView for Garbage Collection on Document Closed
 * @param docId 
 * @param dataView 
 */
export const registerProtyleGC = (docId: DocumentId, dataView: DataView) => {
    if (!dataviews.has(docId)) {
        dataviews.set(docId, []);
    }
    const views = dataviews.get(docId);
    views.push(new WeakRef(dataView));

    // 注册 dataView 到 FinalizationRegistry
    registry.register(dataView, docId);
}

const finalizeDataView = (dataView: DataView) => {
    console.debug(`[finalize.ts] Finalize dataView@${dataView.embed_id}`);
    dataView.flushStateIntoBlockAttr();
    dataView.dispose();
    //保证之后如果有其他设备的数据同步给当前设备，则新打开的时候会从 element 而非 session 中读取
    dataView.removeFromSessionStorage();
}

export const onProtyleDestroyed = ({ detail }) => {
    const rootID = detail.protyle.block.rootID;

    if (!dataviews.has(rootID)) return;

    const views = dataviews.get(rootID);
    views.forEach(view => {
        const dataView = view.deref();
        if (dataView) {
            finalizeDataView(dataView);
        }
    });
    dataviews.delete(rootID);
}

export const onProtyleSwitch = ( { detail }) => {
    //TODO 在 switch 的时候, 同样 finalize
}

export const finalizeAllDataviews = () => {
    dataviews.forEach((views, docId) => {
        views.forEach(view => {
            const dataView = view.deref();
            if (dataView) {
                finalizeDataView(dataView);
            }
        });
    });
}
