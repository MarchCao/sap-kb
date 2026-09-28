---
title: Fiori 简介：新一代用户体验
category: s4hana
tags: [S/4HANA, Fiori]
date: 2026-09-27
description: Fiori 是 S/4HANA 的主操作界面：Launchpad 统一入口、三种 App 类型、角色导向设计。讲清 Fiori 与 SAP GUI 的关系和 MM 常用 App。
tcodes: []
example: true
---

## 一句话理解

Fiori 是 S/4HANA 的**新一代用户界面**：基于角色的 App 集合，跑在浏览器/移动端，替代 SAP GUI 成为日常操作主入口。但注意——**Fiori 没有杀死 GUI**，两者长期共存，复杂后台操作很多还在 GUI 里。

::: tip
实战提示：跟用户培训时一句话讲清关系——"Fiori 是日常办事大厅，GUI 是后台机房。天天用的单据走 Fiori，疑难杂症才进 GUI。"用户立刻不纠结了。
:::

## Fiori 的三层构成

```flow
Fiori Launchpad | 统一入口、磁贴、搜索
↓
App | 事务型 / 分析型 / 概览页
↓
OData 服务 + CDS View | 数据来源
```

## 三种 App 类型

| 类型 | 用途 | MM 例子 |
|------|------|---------|
| Transactional（事务型） | 建单、改单、审批等操作 | 创建采购订单、收货过账 |
| Analytical（分析型） | 报表、KPI、钻取分析 | 采购支出分析、库存周转 |
| Factsheet（概览页） | 主数据的 360 度视图 | 物料、供应商概览页 |

## 和 SAP GUI 的关系：共存，不是替代

| 场景 | 推荐入口 |
|------|----------|
| 日常建单、审批、查报表 | Fiori |
| 复杂后台配置（SPRO） | SAP GUI |
| 深度排错、Debug | SAP GUI |
| 移动端、外出审批 | Fiori（响应式） |

::: note
注意：SAP 的新功能优先在 Fiori 上发布。有些 S/4 新特性在 GUI 里根本没有，规划用户培训时要按角色区分入口。
:::

## Fiori 上线的三个技术要点

1. **权限模型变了** —— 不再是 PFCG 角色直接给 T-Code，而是 Catalog（目录）→ Group（组）→ Role（角色）→ 用户。权限测试要重新做。
2. **OData 服务要激活** —— 每个 App 背后有 OData 服务，前台报 404，八成是后台服务没激活或权限没给。
3. **Launchpad 定制** —— 按角色配首页磁贴，别把几百个 App 全扔给用户，培训成本会爆炸。

## MM 常用 Fiori App 举例

- 采购订单相关：创建、查看、审批采购订单
- 收货：过账收货（MIGO 的 Fiori 版）
- 库存：库存概览、MD04 库存/需求清单
- 分析：采购订单价值分析、供应商评估

## 常见问题

### Q：Fiori 是不是必须的？只用 GUI 行不行？
A：技术上很多操作 GUI 还能做，但 S/4 的新功能、移动场景、用户体验都押在 Fiori 上。项目上建议把 Fiori 作为主入口规划，GUI 作为补充。

### Q：Fiori 打开报错/白屏，一般先查什么？
A：按这个顺序：浏览器缓存 → OData 服务是否激活 → 权限（Catalog/Role）→ 后台网关连接。八成问题出在前两项。

### Q：老用户抵触 Fiori 怎么办？
A：常见。办法：关键用户先试点、首页只放他每天用的 5-8 个磁贴、保留 GUI 入口做过渡。别搞"一刀切"。

## 实战经验

- Fiori 权限测试**必须纳入集成测试**，别等到 UAT 才发现用户打不开 App——返工的全是项目经理的头发。
- 每个 App 先去 Fiori Apps Library 查它的前置条件（OData 服务、业务角色），比报错了再查快十倍。
- 移动端场景（仓库、车间）提前确认网络和设备，Fiori 在手机浏览器下的表现要实测。

## 相关阅读

- [S/4HANA 架构概览](/s4hana/s4hana-architecture/)
- [ECC 与 S/4HANA 的主要区别](/s4hana/ecc-vs-s4hana/)
- [收货（Goods Receipt）](/mm/goods-receipt/)
- [采购订单（Purchase Order）](/mm/purchase-order/)
