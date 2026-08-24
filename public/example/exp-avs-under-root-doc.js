//!js
const root_id = Query.root_id(protyle);
const sql = `select * from blocks where type='av' and path like '%${root_id}%'`;
const blocks = await Query.sql(sql);
return blocks.pick('id');