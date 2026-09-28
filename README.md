# SAP 实战知识库

> 把 SAP 项目经验，变成可以真正学习和复用的知识。
> 线上地址：https://sap.haice.top

纯静态网站：Markdown 写文章 → `node build.js` 生成 → 推送到 GitHub，GitHub Pages 自动发布。
无数据库、无后端、无广告、无统计跟踪。

## 目录结构

```
sap-kb/
├── content/articles/   ← 文章（Markdown + frontmatter），在这里写新文章
├── data/
│   ├── dictionary.json ← SAP 日语词典数据
│   ├── tcodes.json     ← T-code 数据
│   └── roadmaps.json   ← 学习路径数据
├── templates/          ← 页面模板（页眉/页脚/布局）
├── assets/             ← CSS / JS / favicon
├── lib/                ← 共享常量（分类、站点信息）
├── build.js            ← 生成器：node build.js
├── new-article.js      ← 新文章脚手架：node new-article.js
└── dist/               ← 生成结果（发布这个目录）
```

## 发布新文章（3 步）

```bash
# 1. 生成文章模板
node new-article.js

# 2. 用任意编辑器打开 content/articles/ 下的新文件，填写内容后保存

# 3. 重新生成并发布
node build.js
git add -A && git commit -m "新增文章：标题" && git push
```

推送后约 1 分钟，https://sap.haice.top 自动更新。

## 文章格式

```yaml
---
title: 文章标题
category: mm            # 分类 key：s4hana / mm / p2p / pp / sd / qm / abap / integration / project / japan / cases
tags: [MM, 采购]        # 标签，文章可属多个
date: 2026-09-27
description: 一句话摘要（用于 SEO 和列表页）
tcodes: [ME21N, MIGO]  # 相关 T-code（可选）
example: true           # 是否为示例内容（默认 true）
---
```

正文用标准 Markdown，另外支持三种扩展语法：

**提示框**
```
::: tip
实战提示内容（支持 Markdown）
:::
```
类型：`note`（说明）/ `tip`（实战提示）/ `warning`（注意）/ `danger`（警告）

**流程图**
``````
```flow
采购申请 PR | ME51N 创建
-> 货源确定 | ME57
-> 采购订单 PO | ME21N
```
``````
每行一步，用 `|` 分隔"步骤 | 说明"，也支持 `A -> B -> C` 一行写法。

**清单**
``````
```checklist
- [ ] 待办事项
- [x] 已完成事项
```
``````

表格、代码块、引用、图片都用标准 Markdown。H2/H3 会自动生成目录（TOC）。

## 本地预览

```bash
node build.js
cd dist && python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 部署

- 仓库：https://github.com/MarchCao/sap-kb
- GitHub Pages：`main` 分支 `/dist` 目录（或 `gh-pages`，见仓库设置）
- 自定义域名：`sap.haice.top`（dist/CNAME，由构建自动生成）
- DNS：在域名服务商处添加 CNAME 记录：`sap` → `MarchCao.github.io`

## 约束（写文章时遵守）

- 示例文章必须保留 `example: true`，页面会显示"示例内容"徽标。
- 不虚构作者个人项目经历，不出现真实客户名称、内部数据、账号密钥。
- 案例分类（cases）文章会自动带上脱敏声明。
