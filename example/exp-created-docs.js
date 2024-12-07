//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const SQL = `
    SELECT
        SUBSTR(created, 1, 6) AS month,
        COUNT(*) AS count
    FROM
        blocks
    WHERE
        type = 'd'
    GROUP BY
        SUBSTR(created, 1, 6)
    ORDER BY
        month;
    `;

    let blocks = await Query.sql(SQL);

    dv.addeline(blocks.pick('month'), blocks.pick('count'), {
        title: 'Monthly Created Documents',
        xlabel: 'Month',
        ylabel: 'Count'
    });

    dv.render();
}

return query();