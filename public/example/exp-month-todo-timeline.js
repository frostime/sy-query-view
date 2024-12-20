//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);

    let blocks = await Query.task(null, 128);
    blocks = blocks.sorton('created', 'desc');
    const blockKey = (b) => b.createdDate.slice(0, 7);

    let columns = [];
    blocks.groupby(blockKey, (groupname, group) => {
        let ele = dv.rows([
            dv.md(`#### ${groupname}`),
            dv.list(group)
        ])
        columns.push(ele);
    });
    let ele = dv.addcols(columns, {
        minWidth: '400px'
    });
    ele.style.border = '2px dashed var(--b3-theme-primary)';
    ele.style.borderRadius = '10px';
    ele.style.margin = '10px 20px';

    dv.render();
}
return query();