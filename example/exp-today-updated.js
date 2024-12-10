//!js
// NOTE: 实际使用过程中，其实更加建议配合模板使用，在创建的时候直接配置 now 为当天的日期，而非通过 state 来维护日期状态
const now = Query.Utils.today(false);
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const todayState = dv.useState('today', now); //Only update the state once.

    let updatedState = dv.useState('updated-docs', []);
    if (now === todayState.value) {
        dv.addmd('#### Today\'s Updated Documents');
        let updatedDoc = await Query.sql(`
            select * from blocks where type='d' and updated like '${todayState.value}%'
            order by updated desc
        `);
        dv.addtable(updatedDoc, {
            fullwidth: true,
            cols: ['box', 'hpath', 'updated'],
        });
        let state = updatedDoc.omit('ial', 'path', 'hash', 'fcontent');
        updatedState(state);
    } else {
        dv.addmd(`#### Updated Documents on ${todayState.value}`)
        dv.addtable(updatedState(), {
            fullwidth: true,
            cols: ['box', 'hpath', 'updated'],
        });
    }

    dv.render();
}

return query();