//!js
const query = async () => {
    let dv = Query.Dataview(protyle, item, top);
    let blocks = await Query.backlink(protyle.block.rootID);
    blocks = await Query.fb2p(blocks);
    dv.addtable(blocks, {
        fullwidth: true,
    });
    dv.render();
}
return query();