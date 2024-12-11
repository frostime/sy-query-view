//!js
const MAX_DEPTH = 3;  // Control the max depth of the tree, not recommend to set too large

const buildTree = async (docId, depth = 1) => {
    if (depth > MAX_DEPTH) return [];
    const children = await Query.childdoc(docId);

    for (const child of children) {
        let docs = await buildTree(child.id, depth + 1);
        if (docs.length > 0) {
            child.children = Query.wrapBlocks(docs);
        }
    }

    return children;
};

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    dv.render();
    const tree = await buildTree(dv.root_id, 1);
    dv.addlist(tree, { type: 'o' });
};

return query();
