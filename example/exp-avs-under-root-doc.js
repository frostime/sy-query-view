//!js
const query = async () => {
    const root_id = Query.root_id
    const sql = `select * from blocks where type='av' and path like '%${dv.root_id}%'`;
    const blocks = await Query.sql(sql);
    return blocks.pick('id')
}

return query();
