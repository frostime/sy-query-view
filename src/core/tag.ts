type KernelTagNode = {
    name: string;
    label: string;
    depth: number;
    count: number;
    children?: KernelTagNode[] | null;
};

function stripTagMarkers(tag: string) {
    return tag.replace(/^#+/, '').replace(/#+$/, '');
}

function escapeSqlString(value: string) {
    return value.replaceAll("'", "''");
}

function escapeLikeLiteral(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
}

/** @internal */
export function buildTagSqlCondition(tag: string, match: '=' | 'like') {
    let label = stripTagMarkers(tag);

    if (match === 'like') {
        // Preserve the established convenience of accepting optional outer `%` markers.
        label = label.replace(/^%+/, '').replace(/%+$/, '');
        return `tag like '%#%${escapeSqlString(label)}%#%'`;
    }

    const literalLabel = escapeSqlString(escapeLikeLiteral(label));
    return `tag like '%#${literalLabel}#%' escape '\\'`;
}

/** @internal */
export function normalizeTagTree(
    nodes: KernelTagNode[] | null | undefined,
    decodeHtml: (value: string) => string
): QueryTagNode[] {
    return (nodes ?? []).map(node => ({
        name: decodeHtml(node.name),
        label: decodeHtml(node.label),
        depth: node.depth,
        count: node.count,
        children: normalizeTagTree(node.children, decodeHtml)
    }));
}
