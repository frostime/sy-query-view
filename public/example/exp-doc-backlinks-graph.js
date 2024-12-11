//!js

const clipStr = (text, cnt) => {
    if (text.length > cnt - 3) {
        return text.slice(0, cnt - 3) + '...';
    } else {
        return text;
    }
}

const query = async () => {
    let dv = Query.DataView(protyle, item, top);
    let thisdoc = await Query.thisdoc(protyle);

    let backlinks = await Query.backlink(dv.root_id);
    let nodes = [thisdoc, ...backlinks];  //Merge to nodes
    let links = [
      { source: thisdoc.id, target: backlinks.pick('id') },  //Create links
    ];

    dv.addegraph(nodes, links, {
        height: '500px',
        roam: true,
        nodeRenderer: (block) => {
            //Only return name of the node is ok, other parts will use the default renderer.
            return {
                name: clipStr(block.name || block.content, 15),
            }
        }
    });

    dv.render();
}

return query();
