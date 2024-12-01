//!js
const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    const createdToday = await Query.sql(`
    select * from blocks where type='d' and created like '${Query.utils.today().slice(0, 8)}%'
`);
    dv.addmd(`#### 今天创建了 ${createdToday.length} 篇文档:`);


    const l = []
    createdToday.groupby('box', (box, blocks) => {
        l.push(`笔记本 ${Query.utils.notebook(box).name} 共创建: ${blocks.length} 篇文档`)
    });
    dv.addcols([
        dv.blocktable(createdToday, ['type', 'hpath', 'box'], { fullwidth: true }),
        dv.list(l)
    ])


    // 今日更新
    const updatedToday = await Query.sql(`
        select * from blocks where type='d' and updated like '${Query.utils.today().slice(0, 8)}%'
    `);
    /**
     * @type {Record<string, Block[]>}
     */
    const updatedBins = updatedToday.groupby((block) => {
        // 按照小时切分时间段
        const time = Query.utils.asdate(block.updated);
        return time.getHours();
    });
    const wordsCounts = Object.fromEntries(Object.entries(updatedBins).map(([hour, blocks]) => {
        const words = blocks.reduce((acc, block) => acc + block.content.length, 0);
        return [hour, words];
    }));
    //0, 23
    const x = Array.from({ length: 24 }, (_, i) => i);
    const y = new Array(24).fill(0);
    Object.entries(wordsCounts).forEach(([hour, words]) => {
        y[hour] = words;
    });
    dv.addechartsLine(x, y, {
        xlabel: '时间段',
        ylabel: '字数',
        title: '今日更新字数变化',
        height: '300px',
        width: '100%',
        echartsOption: {
            grid: {
                left: '5%',
                right: '5%',
                containLabel: true
            }
        }
    });

    dv.render();

}

return query();