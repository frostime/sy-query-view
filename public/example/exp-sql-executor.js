//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const sql = dv.useState('sql', '');
    const searchResult = dv.useState('search-result', []);

    dv.addmd(`#### SQL Executor`);
    const textarea = document.createElement('textarea');
    textarea.className = "fn__block b3-text-field";
    textarea.rows = 5;
    textarea.style.fontSize = '20px';
    textarea.value = sql.value;
    dv.addele(textarea);

    const button = document.createElement('button');
    button.className = "fn__block b3-button";
    button.textContent = "Execute";
    dv.addele(button);

    dv.addtable(searchResult(), {
        fullwidth: false,
        cols: null,
        renderer: (b, a) => b[a]
    });

    button.onclick = async () => {
        const ans = await Query.sql(textarea.value);
        sql.value = textarea.value;
        searchResult(ans);
        dv.repaint();
    }

    dv.render();
}

return query();