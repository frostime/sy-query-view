//!js

// SiYuan's super block syntax (md syntax extension)
const columns = (block) => `
{{{col

${block.attr('hpath')}

${block.attr('box')} - ${block.attr('updated')}
{: style="text-align: right; flex: none;" }

}}}
`.trim();
const query = async () => {
    let dv = Query.DataView(protyle, item, top);

    let blocks = await Query.sql(`
      select * from blocks where type='d'
      order by updated desc limit 32;
    `)
    dv.addlist(blocks, {
        renderer: columns
    });

    dv.render();
}

return query();
