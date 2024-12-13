//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    // null: no `after` filter, query all task block
    // 128: max number of result
    let blocks = await Query.task(null, 128);
    let grouped = blocks.groupby((b) => {
        return b.createdDate.slice(0, -3)
    });
    let N = Object.keys(grouped).length;
    // each group with a fixed witdh 200px
    dv.addmkanban(grouped, {
        width: `${N * 200}px`
    });
    dv.render();
}
return query();
