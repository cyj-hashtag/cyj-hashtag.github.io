# 学习资料

按主题整理原始笔记，保留全部 12 项技能、22 门课程及 8 个外部资源链接。

## Agent Infra

### 运行与编排

- **Agent Runtime**：理解 Agent Loop、Tool Calling、Streaming 和 Session；实现一个能够循环执行任务的最小 Agent。
- **上下文与状态管理**：区分模型当前能看到的上下文与任务执行状态。处理上下文裁剪、压缩、Checkpoint，以及短期上下文和长期记忆。
- **任务队列与 Worker**：通过 Queue 分发任务，控制并发、优先级、Backpressure 和 Worker Pool。
- **调度与多 Agent 编排**：拆分复杂任务，组织 DAG、Reviewer、Handoff 和 Human-in-the-loop。

### 可靠性与一致性

- **Durable Execution**：持久化执行状态，通过 Checkpoint、Replay、Resume 和 Recovery，在进程重启后恢复长任务。
- **Retry、Timeout 与幂等**：为模型、工具、网络和 Worker 的失败设置重试与超时，避免推送代码、发邮件、创建资源等操作重复执行。
- **分布式状态与一致性**：理解 Transaction、WAL、Lease、Heartbeat、Replication、Consistency 与故障恢复，协调 Orchestrator、Worker 和数据库的任务状态。

### 工具、隔离与权限

- **Sandbox 与执行环境**：为 Agent 隔离文件系统、进程、网络与资源，限制 CPU、内存和执行时间。
- **工具基础设施与 MCP**：统一管理 Shell、Filesystem、Browser、Database 和 API 等工具；理解 MCP 作为工具与资源接口的作用。
- **权限、安全与 Secrets**：控制文件、工具、网络与密钥访问，理解 Authentication、Authorization、ACL、Secret Management 和 Audit。

### 观测与评估

- **可观测性与调试**：用 Trace 记录完整执行过程，用 Metrics 观察延迟、队列、Token、成本、失败率和重试。
- **Evaluation 与 Replay**：通过 Dataset、Rubric、Task Success Rate、Regression、Replay 和 LLM-as-Judge 持续评估任务结果。

## Claude Courses

官方完整目录：https://academy.claude.com/courses/

### 产品入门

- [Claude 101](https://academy.claude.com/courses/claude-101)
- [Claude 协作入门](https://academy.claude.com/courses/introduction-to-claude-cowork)

### 编程与 Agent

- [Claude Code 101](https://academy.claude.com/courses/claude-code-101)
- [Claude Code 实战](https://academy.claude.com/courses/claude-code-in-action)
- [Agent 技能入门](https://academy.claude.com/courses/introduction-to-agent-skills)
- [Subagents 子代理入门](https://academy.claude.com/courses/introduction-to-subagents)

### 平台、API 与 MCP

- [Claude 平台 101](https://academy.claude.com/courses/claude-platform-101)
- [基于 Claude API 开发](https://academy.claude.com/courses/building-with-the-claude-api)
- [MCP 入门](https://academy.claude.com/courses/introduction-to-model-context-protocol)
- [MCP 进阶话题](https://academy.claude.com/courses/model-context-protocol-advanced-topics)
- [Claude 与 Amazon Bedrock](https://academy.claude.com/courses/claude-with-amazon-bedrock)
- [Claude 与 Google Cloud Vertex AI](https://academy.claude.com/courses/claude-with-google-cloud-s-vertex-ai)

### AI 素养基础

- [AI 素养框架与基础](https://academy.claude.com/courses/ai-fluency-framework-foundations)
- [AI 能力与局限](https://academy.claude.com/courses/ai-capabilities-and-limitations)

### 不同角色的 AI 素养

- [开发者 AI 素养](https://academy.claude.com/courses/ai-fluency-for-builders)
- [小企业 AI 素养](https://academy.claude.com/courses/ai-fluency-for-small-businesses)
- [学生 AI 素养](https://academy.claude.com/courses/ai-fluency-for-students)
- [非营利组织 AI 素养](https://academy.claude.com/courses/ai-fluency-for-nonprofits)

### 教育与教学

- [教育者 AI 素养](https://academy.claude.com/courses/ai-fluency-for-educators)
- [pK–12 教育者 AI 素养](https://academy.claude.com/courses/ai-fluency-for-k-12-educators)
- [pK–12 培训师培训](https://academy.claude.com/courses/ai-fluency-for-pk-12-train-the-trainer)
- [AI 素养教学](https://academy.claude.com/courses/teaching-ai-fluency)

## LLM Tutorials

- [Neural Networks: Zero to Hero](https://github.com/karpathy/nn-zero-to-hero) · Andrej Karpathy
  通过视频与练习学习神经网络、反向传播、语言模型和分词器。

- [Happy-LLM](https://github.com/datawhalechina/happy-llm) · Datawhale
  中文教程，结合原理与代码学习 Transformer、大模型构建、训练和应用。

- [LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch) · Sebastian Raschka
  配套代码，用 PyTorch 逐步实现 GPT 类模型，学习预训练与微调。

- [nanoGPT](https://github.com/karpathy/nanoGPT) · Andrej Karpathy
  精简的 GPT 训练代码，可作为源码阅读材料。项目已标记为旧版，作者推荐的新项目见仓库说明。

- [CS336 · Language Modeling from Scratch](https://cs336.stanford.edu/spring2025/) · Stanford · Spring 2025
  公开课与编程作业，覆盖语言模型构建、训练及数据处理。

## Self-learning & Resources

- [自学是门手艺](https://github.com/xiaolai/the-craft-of-selfteaching)
  原始资料中的「如何自学」，通过编程实践学习自学方法。

- [WallessPKU](https://wallesspku.org/zh/)
  原始资料中的「如何自由」。

- [ji8.ai](https://ji8.ai/)
  原始资料中的「如何订阅」。

## 上海交通大学生存手册

- [原项目](https://github.com/SurviveSJTU/SurviveSJTUManual)
- [在线阅读](https://survivesjtu.gitbook.io/survivesjtumanual/)
- [电子书下载](https://github.com/SurviveSJTU/SurviveSJTUManual/releases)

个人收藏的 PDF：301 页，20,648,638 字节。网站保留原文件，并提供章节入口。
