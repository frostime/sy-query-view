import { DataView } from "./data-view";

const dataviews = new WeakMap<object, WeakRef<DataView>[]>();

/**
 * Register DataView for Garbage Collection on Document Closed
 * @param docId 
 * @param dataView 
 */
export const registerProtyleGC = (docId: DocumentId, dataView: DataView) => {
    const key = { id: docId };
    if (!dataviews.has(key)) {
        dataviews.set(key, []);
    }
    const views = dataviews.get(key);
    views.push(new WeakRef(dataView));
}

export const onProtyleDestroyed = ({ detail }) => {
    console.log('closed protyle');
    console.log(detail);
    const rootID = detail.protyle.block.rootID;
    if (!(rootID in dataviews)) return;
    dataviews[rootID].forEach(view => {
        const dataView = view.deref();
        if (dataView) {
            dataView.dispose();
        }
    });
    delete dataviews[rootID];
}
