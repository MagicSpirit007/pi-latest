> 本次修订仅覆盖源码精读 10 章的 TypeScript 网页、Markdown 与配图，源码固定为 [Pi v0.87.1](https://github.com/earendil-works/pi/releases/tag/v0.87.1)（`f07218c4d4bbc12bef056a7058c3dd49dfe41abe`）。实战篇、Skill、Python、Notebook 与既有 PDF 未更新；旧 Python 文件和直达页面保留。本轮未生成 PDF；源码精读 TS 版的静态站点已发布到本仓库的 GitHub Pages。

# Pi-Agent 双轨教程

> 两条互补的路线教你 [pi-agent](https://github.com/earendil-works/pi) SDK：**实战上手**（搭一个能上线的 Agent）+ **源码精读**（看懂 SDK 怎么造）。
>
> 🪞 **本仓库是镜像站**：内容来自原仓库 [buchidonggua/dg-ai-notes](https://github.com/buchidonggua/dg-ai-notes)（作者：冬瓜），只跟进「源码精读 · TypeScript」部分，版权归原作者（[代码 MIT](../LICENSE) / [文档 CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/)）。
>
> 🌐 在线阅读：[**本仓镜像**](https://magicspirit007.github.io/pi-latest/) · [原站](https://dg-ai-notes.pages.dev)

## 🚀 实战上手篇 · 7 章

用一个真实场景（企业数据分析助手 DataAgent），从零搭一个能上线的垂直 Agent。讲的是「改哪一层、为什么这样接」，配套 [7 组可运行代码](./pi_sdk_learn/code/)。

> 路径：[pi_sdk_learn/docs/](./pi_sdk_learn/docs/) · 在线版见 https://dg-ai-notes.pages.dev

| 章节 | 主题 | Markdown |
|------|------|----------|
| P01 | 环境部署 —— 10 分钟跑通第一个 Agent | [📖](./pi_sdk_learn/docs/第1章-环境部署-10分钟跑通第一个Agent.md) |
| P02 | 读懂第一个 Agent —— 核心 API 与三层架构 | [📖](./pi_sdk_learn/docs/第2章-先看全貌-搞懂pi-agent工作机制.md) |
| P03 | 模型配置关键点 —— 判断企业内网模型能否接入 | [📖](./pi_sdk_learn/docs/第3章-模型配置的关键-判断企业内网能否接入.md) |
| P04 | 系统提示词 —— 必须覆盖默认 Agent 人设 | [📖](./pi_sdk_learn/docs/第4章-系统提示词-必须覆盖默认Agent人设.md) |
| P05 | 定义工具 —— 从功能实现到交互体验 | [📖](./pi_sdk_learn/docs/第5章-定义工具-从功能到交互pi都想到了.md) |
| P06 | 事件监听 —— 实现你的所有个性化需求 | [📖](./pi_sdk_learn/docs/第6章-事件监听-实现你的个性化需求.md) |
| P07 | 准备上线 —— 把 Agent 封装成一个服务 | [📖](./pi_sdk_learn/docs/第7章-准备上线-把Agent封装成服务.md) |

> 配套代码：[pi_sdk_learn/code/](./pi_sdk_learn/code/)（L01–L07，`npm install` 后按章运行）

## 🔬 源码精读篇 · 10 章

10 章系统拆解 pi-agent 的源码设计与实现，每章回答「是什么 / 怎么做 / 为什么」。提供 **TypeScript 版已更新至 Pi v0.87.1**。

> 路径：[pi_source_dive/typescript/](./pi_source_dive/typescript/) · 在线版见 [本仓镜像](https://magicspirit007.github.io/pi-latest/) ／ [原站](https://dg-ai-notes.pages.dev)

```
ch01 开篇总览    →  ch02 三层架构   →  ch03 Agent Loop  →  ch04 模型调用  →  ch05 工具系统
                                                                       ↓
ch06 消息系统    →  ch07 事件驱动   →  ch08 上下文工程  →  ch09 上下文压缩  →  ch10 会话管理
```

| 章节 | 主题 | TS 版 |
|------|------|-------|
| M01 | 开篇 - Pi-Agent 框架总览 | [📖](./pi_source_dive/typescript/第1章-开篇-Pi-Agent框架总览.md) |
| M02 | 三层架构 - 项目骨骼 | [📖](./pi_source_dive/typescript/第2章-三层架构-Pi-Agent项目的骨骼.md) |
| M03 | Agent Loop - 模型转动起来的引擎 | [📖](./pi_source_dive/typescript/第3章-Agent-Loop-让模型转动起来的引擎.md) |
| M04 | 模型调用 - 一行代码驾驭多模型 | [📖](./pi_source_dive/typescript/第4章-模型调用-一行代码驾驭多个模型.md) |
| M05 | 工具系统 - Agent 的手脚如何被管住 | [📖](./pi_source_dive/typescript/第5章-工具系统-Agent的手脚是怎么被管住的.md) |
| M06 | 消息系统 - Agent 的记忆组织与传递 | [📖](./pi_source_dive/typescript/第6章-消息系统-Agent的记忆如何组织与传递.md) |
| M07 | 事件驱动 - Agent 的神经系统 | [📖](./pi_source_dive/typescript/第7章-事件驱动-Agent的神经系统.md) |
| M08 | 上下文工程 - 让有限窗口装下无限对话 | [📖](./pi_source_dive/typescript/第8章-上下文工程-让有限窗口装下无限对话.md) |
| M09 | 上下文压缩 - 当对话太长怎么办 | [📖](./pi_source_dive/typescript/第9章-上下文压缩-当对话太长怎么办.md) |
| M10 | 会话管理 - 对话的存储恢复与分叉 | [📖](./pi_source_dive/typescript/第10章-会话管理-对话的存储恢复与分叉.md) |

> 🧪 **补充材料**：[notebooks/agent-loop.ipynb](./notebooks/agent-loop.ipynb) 是第 3 章 Agent Loop 的可执行实验场。

## 📚 三种阅读方式

| 方式 | 入口 | 适合场景 |
|------|------|----------|
| 🌐 **Web 在线版**（推荐） | [本仓镜像](https://magicspirit007.github.io/pi-latest/) ／ [原站](https://dg-ai-notes.pages.dev) | 双系列切换、配图联动、主题切换 |
| 📥 **Markdown 下载版** | 上表链接 | 配合 AI 边读边问、对照源码 |
| 📕 **PDF 版** | [GitHub Releases](https://github.com/buchidonggua/dg-ai-notes/releases) | 离线阅读、打印、长期存档（源码精读篇） |

## 🚀 本地运行 web 电子书

```bash
cd web
npm install
npm run dev      # http://localhost:4321
```

详细说明见 [web/README.md](./web/README.md)。

## 📥 历史 PDF 下载

既有 PDF 保留原版本，未纳入此次 v0.87.1 修订。PDF 不进 git 仓库，通过 GitHub Releases 分发：

1. 进入 [Releases 页面](https://github.com/buchidonggua/dg-ai-notes/releases)
2. 下载对应版本：
   - `pi-agent-book-ts.pdf` — TypeScript 版（约 14MB）
   - `pi-agent-book-python.pdf` — Python 版（约 16MB）

## 📜 License

- 代码：[MIT](../LICENSE)
- 文档：[CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/)

> 内容原出处：[buchidonggua/dg-ai-notes](https://github.com/buchidonggua/dg-ai-notes)；所解读的 SDK：[earendil-works/pi](https://github.com/earendil-works/pi)。
