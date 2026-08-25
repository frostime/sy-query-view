# Query & View Documentation Site

The embedded block feature of SiYuan supports querying using JavaScript syntax. Previously, the [Basic Data Query](https://github.com/zxhd863943427/siyuan-plugin-data-query) plugin developed by Zxhd enhanced the capabilities of JavaScript queries. This plugin builds on that foundation, adjusts the API structure, adds several new features, making JavaScript queries in SiYuan simpler and more convenient. It also optimizes the DataView interface, supporting richer and more customizable data display functions.

⚠️ **Note**: This help document assumes that users have a basic understanding of JavaScript syntax concepts (at least basic variables, control flow, function calls, async/await).

> 🔔 The plugin ships an in-plugin documentation site with every release: click "Help" in the top-bar plugin menu to open it. The documentation site content matches the installed plugin version and works offline, and it **never creates or updates notes in your knowledge base**; help notes left over from older versions are kept as-is and are no longer updated by the plugin.
>
> The Chinese and English READMEs in this repository are generated and committed from the same set of pages, so the same content is browsable on GitHub or in the marketplace.

<!-- docs-only:start -->
## Start from the Template

Want to run your first Query View quickly?

1. Open the "Start from the Template" page and copy the basic template code.
2. Create an embedded block in a document, paste the code, and run it.
3. Five randomly picked blocks should appear; then customize the template as described on that page.

## Find an Example by Need

Have a specific query or display goal in mind?

Open the "Examples" page, filter the runnable examples by purpose, tags, or description, find the code closest to your need, and copy and customize it. All example code is shipped with the plugin in the plugin's `example/` directory, with the repository's `public/example/` as the single source.
<!-- docs-only:end -->

<!-- docs-only:start -->
## Open or Download the Type Declaration

- **Download types.d.ts**: downloads the type declaration of the currently installed version (file name `sy-query-view@{version}.types.d.ts`).
- **Open locally** (desktop only): opens the type declaration with the command configured in the plugin setting "Open Local Editor".

> The precise signatures of the plugin's public API are defined in the shipped type declaration `types.d.ts`; the four **Agent Reference** pages give a human-readable tour of `Query`, `DataView`, the wrapped result types, and the shared data/type definitions.
<!-- docs-only:end -->

## Quick Overview of Features

💡 This plugin can provide the following features (here's a general overview, detailed usage will be explained later):

1️⃣ Use the Query API for embedded block/SQL queries.

Example: Query sub-documents of a specified document ID and display only the first three documents:

![image](../assets/image-20241025221225-4ml02nc.png "Query sub-documents of a specified document ID")

2️⃣ Use the DataView object to customize the rendering of embedded block content.

Example: Query backlinks of the current document and render them as a list of block links in the embedded block.

![image](../assets/image-20241025221628-8bslxks.png "Display backlinks")

Example: Create dynamic document content using JavaScript.

![image](../assets/image-20241025222516-lvb94rl.png "Random walk")

And more rich rendering components.

![image](../assets/image-20241213214945-r6p1je6.png "Kanban")

![image](../assets/image-20241130151900-0n7ku7o.png)

3️⃣ Simplify the processing and access of query results.

The results obtained using the Query API have some additional convenient properties beyond the basic block attributes. For example, in the following example, we can directly use `aslink` to get a block's SiYuan link.

![image](../assets/image-20241025223457-hi94ial.png)

4️⃣ Edit the code of embedded blocks in an external code editor and automatically update the source code as it is edited externally.

![image](../assets/image-20241130145358-bqvwgmb.png)

> 🖋️ **Start Learning from Examples**
>
> The best way to learn about this plugin is to begin with some examples, allowing you to quickly grasp its basic functionalities.
>
> Open the "Examples" page of the documentation site, copy an example's code, and paste it into an embedded block to see its effect instantly. The example code is shipped with the plugin and matches the installed version.
