---
title: S/4HANA 是什么
category: s4hana
tags: [S/4HANA, 基础]
date: 2026-09-27
description: 一句话理解 S/4HANA：SAP 基于 HANA 内存数据库的新一代 ERP，它和 ECC 到底有什么本质区别？本文从实战角度讲清楚。
tcodes: []
---

## 一句话理解

S/4HANA 是 SAP 的新一代 ERP 套件，**只能运行在 SAP HANA 内存数据库上**。它不是 ECC 的一个"升级包"，而是一次重新设计：数据模型被大幅简化（比如物料分类账、业务伙伴），用户界面全面转向 Fiori。

::: tip
实战提示：跟客户或新人解释时，不要背定义。用一句话——"S/4HANA = HANA 数据库 + 简化的数据模型 + Fiori 界面"，对方立刻有画面。
:::

## 为什么 SAP 要推 S/4HANA

| 原因 | 说明 |
|------|------|
| ECC 维护窗口 | ECC 主流维护已进入倒计时，企业必须规划转型 |
| 内存计算 | HANA 让 MRP、报表从"跑批一夜"变成"实时" |
| 简化 | 大量汇总表、索引表被取消，数据模型更干净 |
| Fiori | 统一、移动友好的新一代操作界面 |

## ECC 顾问最需要适应的 5 个变化

1. **数据库只能是 HANA** —— 不能再跑在 Oracle / SQL Server 上。
2. **Business Partner 取代供应商 / 客户主数据** —— 主数据概念统一，事务代码变为 `BP`。
3. **物料分类账（Material Ledger）强制启用** —— 实际成本核算方式变化。
4. **MRP Live** —— 基于 HANA 的新 MRP，事务代码 `MD01N`。
5. **Fiori 成为主界面** —— SAP GUI 还在，但新功能优先 Fiori。

```flow
ECC 项目经验 | 业务流程理解、配置思路、排错方法论
↓
S/4HANA 增量学习 | 简化清单、BP、ML、Fiori、迁移
↓
项目实战 | Fit-to-Standard、迁移、切换
```

## 常见问题

### Q：现在学 ECC 还有意义吗？
A：有。业务流程、配置逻辑、项目方法在 S/4HANA 里大部分是延续的。ECC 经验是学 S/4 的地基，缺的是"差异部分"，而不是从零开始。

### Q：S/4HANA 是云还是本地部署？
A：两种都有：S/4HANA Cloud（公有云 / 私有云）和 S/4HANA On-Premise（本地部署）。选型是项目初期的关键决策之一。

### Q：转 S/4 需要重新考证吗？
A：SAP 的认证体系跟着产品走，S/4 相关认证是加分项，但项目经验永远比证书更有说服力。

## 实战经验

- 给客户讲 S/4 价值时，**不要只谈技术**，要谈业务影响：关账更快、库存更准、MRP 从天级变分钟级。
-  brownfield（系统转换）还是 greenfield（全新实施），是每个 S/4 项目的第一个大决策，直接影响预算和周期。
- 先读官方的 **Simplification List**，它是 ECC → S/4 所有差异的权威清单。

## 相关阅读

- [ECC 与 S/4HANA 的主要区别](/s4hana/ecc-vs-s4hana/)
- [S/4HANA 架构概览](/s4hana/s4hana-architecture/)
- [S/4HANA Migration 概览](/s4hana/s4hana-migration/)
