//!js
// Query View basic template.
// Authoritative source of the template code: the docs site and the plugin's
// /qv slash menu both use this file (public/example/basic-template.js).
const query = async () => {
    //To use DataView, uncomment the following line
    //let dv = Query.DataView(protyle, item, top);

    const SQL = `
        select * from blocks
        order by random()
        limit 5;
    `;
    let blocks = await Query.sql(SQL);

    return blocks.pick('id');
    //To use DataView, comment out the above return and uncomment the following two lines
    //dv.addlist(blocks);
    //dv.render();
}

return query();
