阅读本目录 `TASK-NODE.SPEC.md` 和列出的已验收材料后执行。只修改允许路径，不提交、不创建 references、不实现 Skill 安装/启用/Agent 集成，也不接触真实 SiYuan 用户数据。

使用 `{{skill:sy-query-view}}` 作为唯一接入接口；README 生成器和文档站必须从同一个 `SKILL.md` 展开，并对 frontmatter 使用相同展示规则。任何 await 后维持现有竞态令牌检查。完成后运行全量可复现验证、恢复 `public/types.d.ts` 构建副作用并更新任务状态。