/* 共享页面模板:页眉 / 页脚 / 布局 / 通用组件 */
const { SITE, CATEGORIES, escapeHtml } = require('../lib/common.js');

const LOGO_SVG = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
<rect x="2" y="2" width="36" height="36" rx="8" fill="#16283f"/>
<path d="M12 27V13h4.5v11.2H24V27H12z" fill="#fff"/>
<path d="M26 27v-2.6l6.5-8.2h-6V13H33v2.6l-6.5 8.2h6.7V27H26z" fill="#5b9dff"/>
</svg>`;

const NAV = [
  { href: '/', label: '首页' },
  { href: '/kb/', label: '知识库' },
  { href: '/roadmaps/', label: '学习路径' },
  { href: '/tcode/', label: 'T-code库' },
  { href: '/tools/', label: '工具' },
  { href: '/dictionary/', label: '日语词典' },
  { href: '/kb/cases/', label: '案例' },
  { href: '/about/', label: '关于' },
];

function header(active) {
  const links = NAV.map(n =>
    `<a href="${n.href}" class="${active === n.href ? 'active' : ''}">${n.label}</a>`).join('');
  return `<header class="site-header"><div class="wrap header-in">
<a class="brand" href="/" aria-label="${SITE.name}首页">${LOGO_SVG}
<span class="brand-text"><strong>${SITE.name}</strong><small>${SITE.en}</small></span></a>
<nav class="main-nav" id="mainNav">${links}</nav>
<div class="header-actions">
<a class="search-btn" href="/search/" aria-label="搜索">🔍<span>搜索</span></a>
<button class="nav-toggle" id="navToggle" aria-label="菜单" aria-expanded="false">☰</button>
</div></div></header>`;
}

function footer() {
  const cats = ['s4hana', 'mm', 'japan', 'cases'].map(k =>
    `<li><a href="/kb/${k}/">${CATEGORIES[k].name}</a></li>`).join('');
  return `<footer class="site-footer"><div class="wrap footer-grid">
<div class="f-col"><div class="f-brand">${LOGO_SVG}<strong>${SITE.name}</strong></div>
<p>把 SAP 项目经验，变成可以真正学习和复用的知识。内容为示例版本，持续整理中。</p></div>
<div class="f-col"><h4>知识库</h4><ul>${cats}<li><a href="/kb/">全部分类</a></li></ul></div>
<div class="f-col"><h4>工具</h4><ul>
<li><a href="/tcode/">T-code 知识库</a></li>
<li><a href="/tools/">SAP 工具</a></li>
<li><a href="/dictionary/">SAP 日语词典</a></li>
<li><a href="/tools/#checklist">MM 配置 Checklist</a></li>
<li><a href="/roadmaps/">学习路径</a></li></ul></div>
<div class="f-col"><h4>更多</h4><ul>
<li><a href="/about/">关于作者</a></li>
<li><a href="/ai-lab/">AI × SAP Lab</a></li>
<li><a href="/search/">全站搜索</a></li></ul></div>
</div>
<div class="wrap footer-bottom"><span>© 2026 ${SITE.name}</span>
<span>本站案例均为脱敏 / 虚构示例，不含任何真实客户机密信息</span></div></footer>`;
}

function layout({ title, desc, canonical, active, body, extraHead = '', jsonld = null }) {
  const pageTitle = title === SITE.name ? title : `${title} - ${SITE.name}`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(desc || SITE.desc)}">
<link rel="canonical" href="${SITE.url}${canonical || '/'}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(desc || SITE.desc)}">
<meta property="og:url" content="${SITE.url}${canonical || '/'}">
<meta property="og:site_name" content="${escapeHtml(SITE.name)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
${jsonld ? `<script type="application/ld+json">${jsonld}<\/script>` : ''}
${extraHead}
</head>
<body>
${header(active)}
<main>${body}</main>
${footer()}
<script src="/assets/main.js" defer><\/script>
</body>
</html>`;
}

/* 文章卡片 */
function articleCard(a) {
  const cat = CATEGORIES[a.category];
  return `<article class="card post-card">
<div class="post-meta-top"><a class="cat-tag" style="--cat:${cat.color}" href="/kb/${a.category}/">${cat.name}</a>
${a.example ? '<span class="example-badge">示例</span>' : ''}
<span class="post-date">${a.dateStr}</span></div>
<h3><a href="${a.url}">${escapeHtml(a.title)}</a></h3>
<p class="post-excerpt">${escapeHtml(a.excerpt)}</p>
<div class="post-meta-bottom"><span>📖 约 ${a.reading} 分钟</span>
${(a.tags || []).slice(0, 3).map(t => `<a class="mini-tag" href="/tag/${encodeURIComponent(t)}/">#${escapeHtml(t)}</a>`).join('')}</div>
</article>`;
}

/* 面包屑 */
function breadcrumb(items) {
  const lis = items.map((it, i) =>
    i < items.length - 1
      ? `<li><a href="${it.href}">${escapeHtml(it.label)}</a></li>`
      : `<li aria-current="page">${escapeHtml(it.label)}</li>`).join('');
  return `<nav class="breadcrumb wrap" aria-label="面包屑"><ol>${lis}</ol></nav>`;
}

module.exports = { layout, header, footer, articleCard, breadcrumb, NAV };
