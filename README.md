The embedded block feature of SiYuan supports querying using JavaScript syntax. This plugin adjusts the API structure, adds new features, and optimizes the DataView interface, making JS queries in SiYuan simpler and more convenient, with richer and more customizable data visualization.

> ⚠️ This document assumes that you have a basic understanding of JavaScript syntax concepts (at minimum, basic variables, control flow, function calls, and async/await).

> 🔀 **[Changelog](CHANGELOG.md)**

> 🔔 **The complete documentation lives in the in-plugin documentation site.**
>
> This plugin ships an in-plugin documentation site with every release: after installing, click "Help" in the top-bar plugin menu to open it inside SiYuan. The documentation site matches the installed plugin version and works offline, and it **never creates or updates notes in your knowledge base**; help notes left over from older versions are kept as-is and are no longer updated by the plugin.
>
> ![image](docs/assets/image-20241211194348-sfzl8pc.png)
>
> If the in-plugin documentation site is not available, you can also browse the same content directly under the `docs/` directory of this repository via the links below.

## Quick Overview of Features

💡 The plugin provides a rich set of querying and rendering features (an overview impression; detailed usage is covered in the corresponding pages of the documentation site).

1️⃣ Use the Query API for embedded block / SQL queries.

Example: query the child documents of a document by ID, and display only the first three:

![image](docs/assets/image-20241025221225-4ml02nc.png "Query child documents of a doc by ID")

2️⃣ Use the DataView object to render embedded block content in a custom way.

Example: query the backlinks of the current document and render them in the embedded block as a list of block links:

![image](docs/assets/image-20241025221628-8bslxks.png "Shows backlinks")

3️⃣ Simplify the processing and access of query results.

Results returned by the Query API carry some convenient properties and methods on top of the raw block attributes. For example, you can directly use `aslink` to get the SiYuan link of a block, etc.:

![image](docs/assets/image-20241025223457-hi94ial.png)

4️⃣ Edit embedded block code in an external code editor, and the source is updated automatically as you edit externally.

![image](docs/assets/image-20241130145358-bqvwgmb.png)

> 🖋️ **Learn from examples**
>
> The best way to learn this plugin is to start from some examples and quickly get familiar with its basic usage. After installing, open the "Examples" page of the documentation site to view, copy, and customize them; you can also browse the [Example Overview](docs/en_US/examples/index.md) right here in the repository.

## Built-in Documentation

The full documentation is organized into Quickstart, Topics, Examples, API Reference, and Agent Skill, available in both Chinese and English. The pages below are exactly what the in-plugin documentation site renders (the site renders these pages directly), and can be browsed right here on GitHub:

**Quickstart**

- [Basic Concepts: What is a JS Embedded Block](docs/en_US/quickstart/concepts.md) — embedded blocks, the execution environment, and the `protyle`/`item`/`top` variables.
- [Start from the Template](docs/en_US/quickstart/template.md) — copy the template, insert the embedded block, run and customize, and get your first Query View running.

**Topics**

- [Query](docs/en_US/topics/query.md) — the Query API, SQL queries, WrappedList/WrappedBlock, Query.Utils, fb2p, pruneBlocks.
- [DataView Views](docs/en_US/topics/dataview.md) — list/table/md and all the view components.
- [DataView Advanced Features](docs/en_US/topics/dataview-advanced.md) — custom view components, useState, the lifecycle, and read-only suggestions.
- [External Editor & Tips](docs/en_US/topics/editor-tips.md) — the external editor, debugging, and working with SiYuan templates.

**Examples**

- [Example Overview](docs/en_US/examples/index.md) — find examples by purpose/tags, copy, and customize them.

**API Reference**

- [API Reference](docs/en_US/api/reference.md) — an API tour; you can also open or download the `types.d.ts` type declaration of the installed version from the "API Reference" page of the documentation site.

**Agent Skill**

- [Agent Skill](docs/en_US/skill/index.md) — a `SKILL.md` that guides AI agents to query and render with this plugin, shipped with the plugin version.

## Thanks

Thanks to Zxhd's [Basic Data Query](https://github.com/zxhd863943427/siyuan-plugin-data-query) plugin — one of the earliest extensions of SiYuan's JS query capabilities. This plugin adjusts the API structure and adds features on its basis, and is deeply inspired by it.
