//!js
let dv = Query.Dataview(protyle, item, top);
// Omit `after` to query all unfinished tasks, capped at 128 results.
let blocks = await Query.task({ limit: 128 });
let grouped = blocks.groupby((b) => {
    return b.createdDate.slice(0, -3)
});
let N = Object.keys(grouped).length;
// each group with a fixed witdh 200px
dv.addmkanban(grouped, {
    width: `${N * 200}px`
});
dv.render();
