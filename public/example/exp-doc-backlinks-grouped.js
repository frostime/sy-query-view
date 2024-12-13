//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    let blocks = await Query.backlink(protyle.block.rootID);
    blocks = await Query.fb2p(blocks);
    blocks.groupby('type', (type, groups) => {
        dv.adddetails(
            Query.Utils.typename(type),
            dv.table(groups, {
                fullwidth: true,
            })
        );
    })
    dv.render();
}
return query();
