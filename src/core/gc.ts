/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 11:21:44
 * @FilePath     : /src/core/gc.ts
 * @LastEditTime : 2024-12-04 19:34:56
 * @Description  : 
 */
import { DataView } from "./data-view";

const dataviews = new Map<DocumentId, WeakRef<DataView>[]>();

const sessionStorageKeys = new Map<DocumentId, string[]>();

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

/**
 * TODO 后续考虑启用，目前暂时先测试一下看看不用这个会如何
 * @param docId 
 * @param key 
 */
export const registerSessionStorageKey = (docId: DocumentId, key: string) => {
    if (!sessionStorageKeys.has(docId)) {
        sessionStorageKeys.set(docId, []);
    }
    sessionStorageKeys.get(docId).push(key);
}

export const onProtyleDestroyed = ({ detail }) => {
    const rootID = detail.protyle.block.rootID;

    if (!dataviews.has(rootID)) return;

    const views = dataviews.get(rootID);
    views.forEach(view => {
        const dataView = view.deref();
        if (dataView) {
            console.debug(`onProtyleDestroyed dispose dataView@${dataView.embed_id} under doc@${dataView.root_id}`);
            dataView.dispose();
        }
    });
    dataviews.delete(rootID);

    const keys = sessionStorageKeys.get(rootID);
    if (keys) {
        keys.forEach(key => sessionStorage.removeItem(key));
    }
}
