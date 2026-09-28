#!/bin/bash
# 一键发布: 重新生成网站并推送到 gh-pages 分支(GitHub Pages 发布分支)
# 用法: ./publish.sh "提交说明"
set -e
cd "$(dirname "$0")"

msg="${1:-更新网站内容}"

echo "==> 生成网站…"
node build.js

echo "==> 提交源码…"
git add -A
git commit -m "$msg" || echo "(源码无变化，跳过提交)"

echo "==> 发布到 gh-pages…"
git subtree push --prefix dist origin gh-pages

echo "==> 完成！约 1 分钟后 https://sap.haice.top 自动更新"
