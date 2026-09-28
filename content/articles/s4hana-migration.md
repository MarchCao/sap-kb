---
title: S/4HANA Migration：迁移路径与策略
category: s4hana
tags: [S/4HANA, Migration, 项目]
date: 2026-09-27
description: S/4HANA 三种迁移路径详解：Greenfield 全新实施、Brownfield 系统转换、选择性数据迁移。含决策对比表、核心步骤与选型 checklist。
tcodes: []
example: true
---

## 一句话理解

S/4HANA 迁移只有三条路：**Greenfield**（全新实施，老系统只迁必要数据）、**Brownfield**（系统转换，老系统整体升级）、**选择性迁移**（介于两者之间，按需迁）。选哪条路是 S/4 项目的第一个大决策，直接决定预算、周期和风险。

::: tip
实战提示：选型讨论容易陷入技术细节。拉回来的方法就一个问题——"老系统的流程和数据，有多少是值得搬到新系统的？"答案超过七成，倾向 Brownfield；不到三成，倾向 Greenfield。
:::

## 三种路径对比

| 维度 | Greenfield（全新实施） | Brownfield（系统转换） | 选择性数据迁移 |
|------|------------------------|------------------------|----------------|
| 本质 | 重新实施 | 技术升级 + 数据转换 | 按需迁移 |
| 老系统 | 只迁主数据 + 期初余额 | 整体转换（含历史数据） | 选迁部分公司代码/数据 |
| 流程 | 按标准流程重建 | 保留现有流程 | 混合 |
| 周期 | 长 | 相对短 | 中等 |
| 定制 | 可彻底清理历史包袱 | 历史定制大部分保留 | 选择性保留 |
| 适合 | 流程要重构、老系统包袱重 | 流程稳定、主要想升级技术 | 集团分拆、部分公司先行 |

## 迁移的核心步骤

```flow
准备 | Readiness Check、Simplification List 差异分析
↓
规划 | 路径决策、Mock 迁移计划、停机窗口
↓
Mock 迁移 | 至少 2-3 轮，计时、排错
↓
数据迁移 | 主数据、期初余额、未清项
↓
测试 | 单元、集成、UAT（含月结演练）
↓
切换 | Cutover、Hypercare
```

## 关键工具

| 工具 | 用途 |
|------|------|
| Simplification List | ECC → S/4 差异权威清单，差异分析起点 |
| Readiness Check | 老系统升级准备度检查 |
| Maintenance Planner | 升级路径、补丁规划 |
| SUM + DMO | 系统转换的技术工具 |
| 迁移 Cockpit（LTMC） | 主数据、期初数据迁移 |

::: warning
注意：Mock 迁移至少做两轮，第一轮一定超时、一定报错。Mock 的目的就是暴露问题——切换当天的剧本，是在 Mock 里一轮一轮打磨出来的，不是写出来的。
:::

## 项目 Checklist（选型阶段）

```checklist
- [ ] 迁移路径决策（Greenfield / Brownfield / 选择性）
- [ ] Simplification List 差异分析完成（按模块）
- [ ] 自开发代码检查（Custom Code Analyzer）
- [ ] 主数据清洗计划（BP、CVI 编号规则）
- [ ] Mock 迁移轮次、停机窗口确认
- [ ] 历史数据保留策略（搬多少年）
- [ ] 切换剧本、回退方案
```

## 常见问题

### Q：Brownfield 是不是就不用做蓝图了？
A：要做，但重点不同。Brownfield 的蓝图重点是"差异点"（Fit-to-Standard 找 Gap），而不是从零设计流程。省掉的是流程重建，不是方案设计。

### Q：历史数据要迁多少年？
A：没有标准答案，看审计和业务需求。常见做法：未清项全迁，已清项迁 1-2 年汇总。迁太多，转换时间和存储成本直线上升。

### Q：切换（Cutover）一般要停机多久？
A：看数据量和路径，短则一个周末，长则数天。停机窗口是 Mock 迁移计时的结果，不是拍脑袋定的——这就是为什么 Mock 要计时。

## 实战经验

- 选型阶段就把 Basis 拉进来，技术可行性（版本、补丁、HANA sizing）不过关，功能方案写得再漂亮也是废纸。
- 数据迁移的负责人**必须是业务 + IT 双人制**，纯 IT 迁的数据，业务一定不认。
- Hypercare 的支持团队要在切换前就位，别等用户报错了才组建——切换后第一周的问题量是平时的数倍。

## 相关阅读

- [ECC 与 S/4HANA 的主要区别](/s4hana/ecc-vs-s4hana/)
- [Business Partner（业务伙伴）](/s4hana/business-partner/)
- [ECC → S/4HANA MM 转型案例](/cases/case-ecc-to-s4hana-mm/)
- [日本项目 Cutover](/japan/japan-cutover/)
