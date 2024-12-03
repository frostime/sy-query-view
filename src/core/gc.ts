/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-01 11:21:44
 * @FilePath     : /src/core/gc.ts
 * @LastEditTime : 2024-12-03 15:18:18
 * @Description  : 
 */
import { DataView } from "./data-view";

const dataviews = new Map<DocumentId, WeakRef<DataView>[]>();

const registry = new FinalizationRegistry((docId: string) => {
    const views = dataviews.get(docId);
    if (views) {
        views.forEach(view => {
            const dataView = view.deref();
            if (dataView) {
                console.debug('FinalizationRegistry dispose dataView', dataView);
                dataView.dispose();
            }
        });
        dataviews.delete(docId);
    }
});

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

export const onProtyleDestroyed = ({ detail }) => {
    const rootID = detail.protyle.block.rootID;

    if (!dataviews.has(rootID)) return;

    const views = dataviews.get(rootID);
    views.forEach(view => {
        const dataView = view.deref();
        if (dataView) {
            console.debug('onProtyleDestroyed dispose dataView', dataView);
            dataView.dispose();
        }
    });
    dataviews.delete(rootID);
}
