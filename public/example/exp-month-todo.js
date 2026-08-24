//!js
let blocks = await Query.task(Query.utils.thisMonth(), 32);
return blocks.pick('id');