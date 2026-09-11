//!js
let blocks = await Query.task({ after: Query.utils.thisMonth(), limit: 32 });
return blocks.pick('id');