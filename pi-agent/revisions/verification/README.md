# Pi v0.87.1 书稿验证

验证基准：`f07218c4d4bbc12bef056a7058c3dd49dfe41abe`。要求 Node.js ≥ 22.19.0。此目录的三个 Pi 依赖及其工作区依赖固定为 `0.87.1`，安装锁文件随书稿保存。

```sh
npm ci --ignore-scripts
node extract-examples.mjs
npm run typecheck
npm test
```

`examples/` 的九个文件从 MDX 中标为“完整示例”的代码块原样抽取。不要直接修改生成文件；修改网页书稿后重新抽取。模型调用示例只做类型检查，不运行真实供应商请求；第 7 章扩展另由模拟会话直接加载验证。

`scenarios.test.ts` 使用发布包的 `fauxProvider`，不调用付费模型。覆盖循环准备与收尾、显式继续/结束、保留队列、错误硬退出、整批 terminate、整批串行、并行事件与结果顺序、阻止工具、截断工具调用、系统消息归一化、上下文编辑与恢复，以及扩展续跑和真正收尾。持久化场景只在临时测试目录创建会话。

源码与资源核查（在 `pi-agent/revisions/` 下）：

```sh
node verify-sources.mjs <固定发布提交的源码快照目录>
node generate-diagrams.mjs
```

`source-map.json` 记录逐章的文件、符号与已验证行号；脚本核查所有书中源码链接的提交、路径和索引行号，以及 25 对配图的一致性。行为核对另见 [逐章修订记录](../v0.87.1.md)，路径检查本身不能代替源码阅读。

网站检查（在 `pi-agent/web/` 下）：

```sh
npm run sync:ts
npm run check:sync
npm run check:counterpart
npm run test:counterpart
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
# 另开一个终端，保持预览服务运行
npm run check:reading
```

阅读检查需要已安装 Playwright Chromium。脚本在旧 Python 偏好存在时访问全部十章 TS、十章历史 Python，并检查实战篇导航；重点章节 3、6、7、10 各保存桌面/手机 × 深/浅主题的截图，检查链接、SVG 文本边界、页面溢出和图片放大交互。输出在 `.artifacts/reading/`，不提交截图与测试产生的临时文件。

本次没有生成 PDF，也不包含线上发布步骤。
