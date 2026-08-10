# Start from the Template

This page walks you through running your first Query View with minimal effort. The authoritative basic template code lives in `public/example/basic-template.js`; the documentation site and the plugin's `/qv` slash menu share this single copy, so it is never maintained twice.

## Copy the Template

<!-- docs-only:start -->
Click the "Copy" button on the code block below to copy the template code; copying never writes anything into your notes.
<!-- docs-only:end -->

{{example:basic-template.js}}

The template queries five random blocks and returns their IDs to SiYuan for rendering.

## Insert an Embedded Block

Choose either way:

1. **Slash menu**: type `/qv` (or `/queryview`) in a document and select "Query View Basic Template"; the plugin inserts the template as an embedded block into the current document.
2. **Manually**: create an embedded block and paste the copied code into it completely. When the embedded block content starts with `//!js`, SiYuan executes it as JavaScript.

## Run

The embedded block executes automatically once inserted. You should see five random blocks. If nothing happens, first check that the code starts with `//!js`, then look at the console for errors (see "External Editor & Tips" for troubleshooting).

## Customize the Template

Two pieces of code in the template are commented out: `Query.DataView(protyle, item, top)` and `dv.addlist(blocks)` / `dv.render()`.

- **Render with DataView**: comment out `return blocks.pick('id');` and uncomment the two DataView lines; the template will then render the query result as a list view. Note that the three parameters `protyle`, `item`, and `top` always stay fixed.
- **Query other content**: change the SQL statement in `Query.sql`, or use wrapped queries such as `Query.backlink` or `Query.tag` (see the "Query API" topic).

To see various effects first, open the "Examples" page and copy and customize the example closest to your need.
