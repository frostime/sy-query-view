//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let docId = dv.root_id;
    let ans = await Query.request('/api/outline/getDocOutline', {
        id: docId
    });
    const iterate = (data) => {
        for (let item of data) {
            if (item.count > 0) {
                let subtocs = iterate(item.blocks ?? item.children);
                item.children = Query.wrapBlocks(subtocs);
            }
        }
        return data;
    }
    let tocs = iterate(ans);
    dv.addlist(tocs, {
	    renderer: b => `[${b.name || b.content}](${b.asurl})`,
    });
    dv.render();
}

return query();