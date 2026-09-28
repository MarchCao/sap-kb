/* 新文章脚手架: node new-article.js "文章标题" [分类] */
const fs = require('fs');
const path = require('path');
const { CATEGORIES } = require('./lib/common.js');

const title = process.argv[2];
const category = process.argv[3] || 'mm';
if (!title) {
  console.log('用法: node new-article.js "文章标题" [分类key]');
  console.log('可用分类:', Object.keys(CATEGORIES).join(' / '));
  process.exit(1);
}
if (!CATEGORIES[category]) {
  console.log('未知分类:', category);
  console.log('可用分类:', Object.keys(CATEGORIES).join(' / '));
  process.exit(1);
}

const slug = title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'article';
const today = new Date().toISOString().slice(0, 10);
const dir = path.join(__dirname, 'content', 'articles');
let file = path.join(dir, slug + '.md');
let i = 2;
while (fs.existsSync(file)) file = path.join(dir, `${slug}-${i++}.md`);

const tpl = `---
title: ${title}
category: ${category}
tags: []
date: ${today}
description: 一句话摘要（60-100字，用于 SEO 和列表页）
tcodes: []
example: true
---

## 一句话理解

在这里写概述。

## 核心内容

正文……

::: tip
实战提示
:::

## 常见问题

### Q：问题？
A：回答。

## 实战经验

- 经验 1
- 经验 2

## 相关阅读

- [相关文章](/${category}/slug/)
`;

fs.writeFileSync(file, tpl, 'utf8');
console.log('已创建:', file);
console.log('写完后运行: node build.js');
