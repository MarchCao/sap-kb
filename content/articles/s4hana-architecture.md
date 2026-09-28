---
title: S/4HANA 架构概览
category: s4hana
tags: [S/4HANA, 架构]
date: 2026-09-27
description: S/4HANA 三层架构详解：HANA 内存数据库、简化的应用数据模型、Fiori 表现层。理解这套架构，才能明白 ECC 的很多做法为什么变了。
tcodes: []
example: true
---

## 一句话理解

S/4HANA 架构 = **HANA 内存数据库做计算** + **简化的应用数据模型** + **Fiori 做界面**。和 ECC 最大的不同是：计算下沉到数据库层，大量应用层的汇总、索引逻辑被砍掉，所以系统更快、表更少。

::: tip
实战提示：架构图不用背。记住一个判断方法：凡是 ECC 里"为了跑得快而建的表"（汇总表、索引表、冗余表），在 S/4 里基本都被干掉了，改由 HANA 实时计算。这就是理解 80% 架构差异的钥匙。
:::

## 三层结构

| 层 | 技术 | 说明 |
|----|------|------|
| 数据与计算层 | SAP HANA | 内存列式存储，计算下沉，OLTP 和 OLAP 跑在同一份数据上 |
| 应用层 | S/4HANA 应用 | 简化的数据模型、业务逻辑；嵌入 EWM、TM、PP/DS 等组件 |
| 表现层 | Fiori / SAP GUI | Fiori Launchpad 为主入口，角色导向；GUI 继续可用 |

```flow
用户操作 | Fiori App / SAP GUI
↓
应用逻辑 | S/4HANA 业务逻辑、CDS View
↓
内存计算 | HANA 列存、实时聚合
```

## 数据模型简化的三个典型例子

1. **财务：Universal Journal** —— 经典总账的多表结构合并为 ACDOCA 单一凭证行表，财务对账逻辑大变。
2. **物料：MATDOC** —— 物料凭证统一表，替代 MKPF/MSEG 分离结构，库存报表直接读一张表。
3. **主数据：Business Partner** —— 供应商、客户主数据统一对象，ECC 里两套表映射到 BUT000 系列。

## CDS View：新架构下的数据消费方式

- CDS（Core Data Services）View 是 S/4 推荐的数据读取方式，替代直接读物理表。
- 报表、Fiori App、接口都建议走 CDS View，升级时 SAP 保证其兼容性。
- 自开发 ABAP 尽量用已发布的 CDS View，不要直读 ACDOCA 这类底层表——底层表结构 SAP 可能调整。

## 部署架构选项

| 部署方式 | 说明 | 适合 |
|----------|------|------|
| On-Premise | 本地部署，自运维 | 深度定制、已有数据中心 |
| Private Cloud | 私有云（SAP 代运维） | 想减运维但要保留定制 |
| Public Cloud | 公有云 SaaS，Fit-to-Standard | 标准化流程、快速上线 |

::: note
注意：公有云版本采用"定期升级 + 标准流程优先"模式，定制空间小。选型时先定部署方式，再谈流程差异，否则 Fit-to-Standard 会谈得很痛苦。
:::

## 嵌入式组件

S/4HANA 把过去独立的产品**嵌入**进来，开箱即用：

- **EWM 嵌入式** —— 基础仓储管理功能直接在 S/4 里，不用单独装 EWM 系统。
- **TM 嵌入式** —— 运输管理基础功能。
- **PP/DS** —— 高级计划排产嵌入（替代 APO 的部分场景）。

## 常见问题

### Q：S/4HANA 必须跑在 HANA 上吗？能用 Oracle 吗？
A：必须 HANA，不能用其他数据库。这是硬性要求，也是很多差异的根源。

### Q：OLTP 和 OLAP 在同一数据库上不会互相影响吗？
A：HANA 的列式存储 + 内存计算就是为这个设计的：交易和分析读同一份实时数据，不需要 nightly ETL。这是 S/4 实时报表的技术基础。

### Q：版本升级频繁吗？
A：On-Premise 每年一个大版本，公有云升级更频繁。项目计划里要预留升级测试窗口。

## 实战经验

- 架构评审时先问三个问题：部署方式定了没？哪些嵌入式组件在范围内？接口走什么方式（OData/API/IDoc）？这三个决定了后续 60% 的技术方案。
- 跟 Basis 团队早沟通 HANA 的 sizing——内存不够，MRP Live 再快也跑不起来。
- 自开发规范里加一条：**禁止直读简化掉的表**，统一走 CDS View，否则每次升级都是灾难。

## 相关阅读

- [S/4HANA 是什么](/s4hana/what-is-s4hana/)
- [ECC 与 S/4HANA 的主要区别](/s4hana/ecc-vs-s4hana/)
- [Fiori 简介：新一代用户体验](/s4hana/fiori-intro/)
- [S/4HANA Migration：迁移路径与策略](/s4hana/s4hana-migration/)
