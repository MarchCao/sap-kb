/* SAP 实战知识库 - 静态站点生成器
   用法: node build.js
   内容: content/articles/*.md (Markdown + frontmatter)
         data/*.json (词典 / T-code / 学习路径)
   输出: dist/ (直接发布到 GitHub Pages) */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { SITE, CATEGORIES, escapeHtml, stripTags, slugify, fmtDate, readingTime, excerptOf } = require('./lib/common.js');
const { layout, articleCard, breadcrumb } = require('./templates/layout.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');

/* ============ frontmatter 解析(极简 YAML 子集) ============ */
function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  let curKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) {
      curKey = kv[1];
      const v = kv[2].trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        meta[curKey] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      } else if (v === 'true') meta[curKey] = true;
      else if (v === 'false') meta[curKey] = false;
      else meta[curKey] = v.replace(/^['"]|['"]$/g, '');
    } else {
      const li = /^\s*-\s+(.*)$/.exec(line);
      if (li && curKey) {
        if (!Array.isArray(meta[curKey])) meta[curKey] = [];
        meta[curKey].push(li[1].trim().replace(/^['"]|['"]$/g, ''));
      }
    }
  }
  return { meta, body: m[2] };
}

/* ============ Markdown 扩展 ============ */
function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/* ::: warning/note/tip/danger ... ::: 提示框 */
function renderAdmonitions(md) {
  const titles = { warning: '注意', note: '说明', tip: '实战提示', danger: '警告' };
  return md.replace(/:::\s*(warning|note|tip|danger)\s*\r?\n([\s\S]*?)\r?\n:::/g, (m, kind, inner) => {
    const body = marked.parse(inner.trim());
    return `<div class="admonition ${kind}"><div class="admonition-title">${titles[kind] || '提示'}</div><div class="admonition-body">${body}</div>`;
  });
}

/* ```flow 流程图: 支持 "A -> B -> C" 或每行一步, "步骤 | 说明" */
function renderFlow(text) {
  const steps = text.split(/\r?\n/).flatMap(line => line.split(/->|→/))
    .map(s => s.trim()).filter(s => s && s !== '↓').map(s => {
      const p = s.split('|').map(x => x.trim());
      return { t: p[0], d: p[1] || '' };
    });
  if (!steps.length) return '';
  const items = steps.map((s, i) =>
    `<div class="flow-step"><span class="flow-num">${i + 1}</span>` +
    `<div class="flow-text"><strong>${escapeHtml(s.t)}</strong>${s.d ? `<span>${escapeHtml(s.d)}</span>` : ''}</div></div>`
  ).join('<div class="flow-arrow" aria-hidden="true">↓</div>');
  return `<div class="flow">${items}</div>`;
}

/* ```checklist 清单 */
function renderChecklist(text) {
  const items = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = /^-\s*\[( |x|X)\]\s*(.+)$/.exec(l);
    return m ? { done: m[1].toLowerCase() === 'x', t: m[2] } : { done: false, t: l.replace(/^-\s*/, '') };
  });
  const lis = items.map(it =>
    `<li><label><input type="checkbox"${it.done ? ' checked' : ''}> <span>${escapeHtml(it.t)}</span></label></li>`
  ).join('');
  return `<ul class="checklist">${lis}</ul>`;
}

function renderSpecialCode(html) {
  return html.replace(/<pre><code class="language-(flow|checklist)">([\s\S]*?)<\/code><\/pre>/g, (m, lang, code) => {
    const text = decodeEntities(code).trim();
    return lang === 'flow' ? renderFlow(text) : renderChecklist(text);
  });
}

function addHeadingIds(html) {
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (m, lv, inner) => {
    const id = 'h-' + slugify(stripTags(inner));
    return `<h${lv} id="${id}">${inner}</h${lv}>`;
  });
}

function extractToc(html) {
  const toc = [];
  const re = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let m;
  while ((m = re.exec(html))) toc.push({ level: +m[1], id: m[2], text: stripTags(m[3]).trim() });
  return toc;
}

function markdownToHtml(md) {
  let html = marked.parse(renderAdmonitions(md));
  html = renderSpecialCode(html);
  html = addHeadingIds(html);
  return html;
}

/* ============ 数据加载 ============ */
function loadArticles() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  const articles = files.map(f => {
    const src = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
    const { meta, body } = parseFrontmatter(src);
    const slug = meta.slug || f.replace(/\.md$/, '');
    const category = meta.category || 'mm';
    if (!CATEGORIES[category]) throw new Error(`未知分类 ${category} (文件 ${f})`);
    const html = markdownToHtml(body);
    const plain = stripTags(html).replace(/\s+/g, ' ').trim();
    return {
      slug, category,
      title: meta.title || slug,
      tags: meta.tags || [],
      tcodes: meta.tcodes || [],
      date: meta.date || '2026-09-27',
      dateStr: fmtDate(meta.date || '2026-09-27'),
      description: meta.description || '',
      example: meta.example !== false,
      html, toc: extractToc(html),
      excerpt: meta.description || excerptOf(plain),
      reading: readingTime(plain),
      plain: plain.slice(0, 6000),
      url: `/${category}/${slug}/`,
    };
  });
  articles.sort((a, b) => b.date.localeCompare(a.date));
  return articles;
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function relatedArticles(a, all, n = 4) {
  return all.filter(x => x.slug !== a.slug).map(x => {
    const shared = x.tags.filter(t => a.tags.includes(t)).length;
    return { x, score: (x.category === a.category ? 3 : 0) + shared * 2 };
  }).sort((p, q) => q.score - p.score).slice(0, n).map(p => p.x);
}

function writeFile(rel, content) {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

/* ============ 页面生成 ============ */
function buildIndex(articles) {
  const latest = articles.slice(0, 6).map(articleCard).join('');
  const topics = [
    { href: '/kb/s4hana/', name: 'S/4HANA', desc: '新一代 ERP：架构、Fiori、迁移', color: '#1d4ed8' },
    { href: '/kb/mm/', name: 'MM / P2P', desc: '采购、库存、发票校验全流程', color: '#0e7490' },
    { href: '/kb/japan/', name: '日本 SAP', desc: '要件定義、日语、项目实战', color: '#b91c1c' },
    { href: '/kb/cases/', name: 'SAP 项目实战', desc: '脱敏案例：迁移、集成、排错', color: '#166534' },
  ].map(t => `<a class="topic-card" style="--cat:${t.color}" href="${t.href}">
<span class="topic-name">${t.name}</span><span class="topic-desc">${t.desc}</span><span class="topic-go">进入专题 →</span></a>`).join('');

  const caseArticles = articles.filter(a => a.category === 'cases').slice(0, 3).map(articleCard).join('');

  const tools = [
    { href: '/tools/', icon: '⌨️', name: 'T-code 查询', desc: '常用事务代码速查' },
    { href: '/dictionary/', icon: '📖', name: 'SAP 日语词典', desc: '中日英三语 SAP 术语' },
    { href: '/tools/#checklist', icon: '✅', name: 'MM 配置 Checklist', desc: '实施配置不漏项' },
    { href: '/tools/#p2p', icon: '🔗', name: 'P2P 流程图', desc: '采购到付款可视化' },
    { href: '/ai-lab/', icon: '🤖', name: 'AI × SAP Lab', desc: '即将上线：AI 助手' },
  ].map(t => `<a class="tool-card" href="${t.href}"><span class="tool-icon">${t.icon}</span>
<span class="tool-name">${t.name}</span><span class="tool-desc">${t.desc}</span></a>`).join('');

  const roadmapSteps = ['S/4HANA 基础', 'Enterprise Structure', 'Master Data', 'Procurement', 'Inventory', 'Invoice Verification', 'FI Integration', 'MRP', 'Testing', 'Migration & Cutover'];
  const roadmap = roadmapSteps.map((s, i) =>
    `<div class="rm-step"><span class="rm-num">${String(i + 1).padStart(2, '0')}</span><span>${s}</span></div>`
  ).join('<div class="rm-arrow">↓</div>');

  const body = `
<section class="hero"><div class="wrap">
<p class="hero-kicker">SAP 实战知识库 · 持续更新</p>
<h1>把 SAP 项目经验，变成可以真正学习和复用的知识。</h1>
<p class="hero-sub">15 年 SAP 项目经验，持续整理 S/4HANA、MM、供应链、日本 SAP 项目与顾问实战经验。</p>
<div class="hero-btns">
<a class="btn primary" href="/roadmaps/">开始学习</a>
<a class="btn ghost" href="/kb/">浏览知识库</a>
</div></div></section>

<section class="section"><div class="wrap">
<div class="sec-head"><h2>推荐学习路线</h2><a href="/roadmaps/">全部路线 →</a></div>
<p class="sec-sub">S/4HANA MM 学习路线：从基础到迁移上线，一条线学完。</p>
<div class="roadmap-flow">${roadmap}</div>
<div class="center"><a class="btn primary" href="/roadmaps/">开始学习</a></div>
</div></section>

<section class="section soft"><div class="wrap">
<div class="sec-head"><h2>最新文章</h2><a href="/kb/">浏览知识库 →</a></div>
<div class="grid3">${latest}</div>
</div></section>

<section class="section"><div class="wrap">
<div class="sec-head"><h2>热门专题</h2></div>
<div class="grid4">${topics}</div>
</div></section>

${caseArticles ? `<section class="section soft"><div class="wrap">
<div class="sec-head"><h2>实战案例</h2><a href="/kb/cases/">全部案例 →</a></div>
<div class="grid3">${caseArticles}</div></div></section>` : ''}

<section class="section"><div class="wrap">
<div class="sec-head"><h2>SAP 工具</h2><a href="/tools/">全部工具 →</a></div>
<div class="grid5">${tools}</div>
</div></section>

<section class="section soft"><div class="wrap newsletter">
<h2>获取最新 SAP 实战文章</h2>
<p>新文章、S/4 学习路线与 SAP 工具更新，第一时间通知你。</p>
<form class="nl-form" onsubmit="return false">
<input type="email" placeholder="输入你的邮箱" aria-label="邮箱" disabled>
<button class="btn primary" disabled>即将上线</button>
</form><p class="tiny">订阅功能即将上线，上线后将提供一键取消订阅。</p>
</div></section>`;

  writeFile('index.html', layout({ title: SITE.name, desc: SITE.desc, canonical: '/', active: '/', body,
    jsonld: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url,
      description: SITE.desc, inLanguage: 'zh-CN',
      potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/search/?q={query}`, 'query-input': 'required name=query' } }),
  }));
}

function buildKB(articles) {
  const allTags = {};
  articles.forEach(a => a.tags.forEach(t => { allTags[t] = (allTags[t] || 0) + 1; }));
  const tagCloud = Object.entries(allTags).sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `<a class="tag-chip" href="/tag/${encodeURIComponent(t)}/">#${escapeHtml(t)}<span>${n}</span></a>`).join('');

  const catCards = Object.entries(CATEGORIES).map(([k, c]) => {
    const n = articles.filter(a => a.category === k).length;
    return `<a class="cat-card" style="--cat:${c.color}" href="/kb/${k}/">
<span class="cat-name">${c.name}</span><span class="cat-count">${n} 篇</span>
<span class="cat-desc">${c.desc}</span></a>`;
  }).join('');

  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: '知识库' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">知识库</h1>
<p class="sec-sub">沿着体系学习，而不是零散地看文章。当前共 ${articles.length} 篇文章（示例内容）。</p>
<h2 class="h2">分类</h2><div class="grid3">${catCards}</div>
<h2 class="h2" style="margin-top:2rem">标签</h2><div class="tag-cloud">${tagCloud}</div>
</div></section>`;
  writeFile('kb/index.html', layout({ title: '知识库', desc: 'SAP 实战知识库：S/4HANA、MM、P2P、日本 SAP 等分类与标签体系。', canonical: '/kb/', active: '/kb/', body }));
}

function buildCategoryPages(articles) {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const list = articles.filter(a => a.category === key);
    const cards = list.map(articleCard).join('') || '<p class="empty">该分类文章整理中，敬请期待。</p>';
    const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/kb/', label: '知识库' }, { label: cat.name }])}
<section class="section"><div class="wrap">
<h1 class="page-title"><span class="cat-dot" style="--cat:${cat.color}"></span>${cat.name}</h1>
<p class="sec-sub">${cat.desc}（${list.length} 篇）</p>
<div class="grid3">${cards}</div>
</div></section>`;
    writeFile(`kb/${key}/index.html`, layout({ title: cat.name, desc: `${cat.name}：${cat.desc}`, canonical: `/kb/${key}/`, active: '/kb/', body }));
  }
}

function buildTagPages(articles) {
  const map = {};
  articles.forEach(a => a.tags.forEach(t => { (map[t] = map[t] || []).push(a); }));
  for (const [tag, list] of Object.entries(map)) {
    const cards = list.map(articleCard).join('');
    const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/kb/', label: '知识库' }, { label: '#' + tag }])}
<section class="section"><div class="wrap">
<h1 class="page-title">#${escapeHtml(tag)}</h1>
<p class="sec-sub">${list.length} 篇文章</p>
<div class="grid3">${cards}</div>
</div></section>`;
    writeFile(`tag/${encodeURIComponent(tag)}/index.html`, layout({ title: `#${tag}`, desc: `标签 #${tag} 相关 SAP 实战文章`, canonical: `/tag/${encodeURIComponent(tag)}/`, active: '/kb/', body }));
  }
}

function buildArticles(articles) {
  for (const a of articles) {
    const cat = CATEGORIES[a.category];
    const tocSide = a.toc.length ? `<aside class="toc-side"><div class="toc-sticky"><h4>目录</h4>${tocList(a.toc)}</div></aside>` : '';
    const tocMobile = a.toc.length ? `<details class="toc-mobile"><summary>📑 目录</summary>${tocList(a.toc)}</details>` : '';
    const tcodeHtml = a.tcodes.length ? `<div class="tcode-row"><span>相关 T-code：</span>${a.tcodes.map(t =>
      `<a class="tcode-chip" href="/tools/#tcode">${escapeHtml(t)}</a>`).join('')}</div>` : '';
    const caseNote = a.category === 'cases'
      ? `<div class="admonition warning"><div class="admonition-title">声明</div><div class="admonition-body"><p>以下案例经过脱敏 / 虚构处理，不包含真实客户名称、内部数据、账号、密钥或未公开项目资料。</p></div></div>` : '';
    const exampleNote = a.example
      ? `<span class="example-badge">示例内容</span>` : '';
    const related = relatedArticles(a, articles).map(articleCard).join('');

    const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/kb/', label: '知识库' }, { href: `/kb/${a.category}/`, label: cat.name }, { label: a.title }])}
<div class="wrap article-layout">
<article class="article">
<header class="article-head">
<div class="post-meta-top"><a class="cat-tag" style="--cat:${cat.color}" href="/kb/${a.category}/">${cat.name}</a>${exampleNote}</div>
<h1>${escapeHtml(a.title)}</h1>
<p class="article-desc">${escapeHtml(a.description || a.excerpt)}</p>
<div class="article-meta"><span>🕒 ${a.dateStr}</span><span>📖 约 ${a.reading} 分钟</span>
<span class="tag-row">${a.tags.map(t => `<a class="mini-tag" href="/tag/${encodeURIComponent(t)}/">#${escapeHtml(t)}</a>`).join('')}</span></div>
</header>
${tocMobile}
${caseNote}
<div class="article-body">${a.html}</div>
${tcodeHtml}
</article>
${tocSide}
</div>
${related ? `<section class="section soft"><div class="wrap"><div class="sec-head"><h2>相关文章</h2></div><div class="grid4">${related}</div></div></section>` : ''}`;

    const jsonld = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article',
      headline: a.title, description: a.description || a.excerpt,
      datePublished: a.date, inLanguage: 'zh-CN',
      author: { '@type': 'Organization', name: SITE.name },
    });
    writeFile(`${a.category}/${a.slug}/index.html`, layout({
      title: a.title, desc: a.description || a.excerpt, canonical: a.url, active: '/kb/', body, jsonld,
      extraHead: `<meta property="og:type" content="article"><meta property="article:published_time" content="${a.date}">`,
    }));
  }
}
function tocList(toc) {
  const items = toc.map(t => `<li class="toc-l${t.level}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('');
  return `<ul class="toc">${items}</ul>`;
}

/* ============ 搜索 ============ */
function buildSearch(articles) {
  const index = articles.map(a => ({
    title: a.title, url: a.url, category: CATEGORIES[a.category].name,
    tags: a.tags, tcodes: a.tcodes, excerpt: a.excerpt, content: a.plain,
  }));
  writeFile('search.json', JSON.stringify(index));
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: '搜索' }])}
<section class="section"><div class="wrap narrow">
<h1 class="page-title">全站搜索</h1>
<p class="sec-sub">搜索文章标题、正文、标签、SAP 术语、T-code、日语术语，例如：<button class="linklike" data-q="MIGO">MIGO</button>、<button class="linklike" data-q="Business Partner">Business Partner</button>、<button class="linklike" data-q="要件定義">要件定義</button></p>
<div class="search-box big"><input id="searchInput" type="search" placeholder="输入关键词…" autocomplete="off" aria-label="搜索"><span class="search-icon">🔍</span></div>
<div id="searchMeta" class="search-meta"></div>
<div id="searchResults" class="search-results"></div>
</div></section>
<script>window.SEARCH_INDEX_URL = '/search.json';<\/script>`;
  writeFile('search/index.html', layout({ title: '搜索', desc: '全站搜索 SAP 实战文章、术语、T-code。', canonical: '/search/', active: '', body, extraHead: '<script src="/assets/search.js" defer><\/script>' }));
}

/* ============ 日语词典 ============ */
function buildDictionary() {
  const dict = loadJson('data/dictionary.json');
  const rows = dict.map(d => `<tr><td class="jp">${escapeHtml(d.jp)}</td><td>${escapeHtml(d.zh)}</td><td class="en">${escapeHtml(d.en)}</td><td><span class="scene">${escapeHtml(d.scene)}</span></td></tr>`).join('');
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: 'SAP 日语词典' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">SAP 日语词典</h1>
<p class="sec-sub">日本 SAP 项目高频术语：日本語 / 中文 / English / SAP 场景。共 ${dict.length} 条（示例）。</p>
<div class="search-box"><input id="dictInput" type="search" placeholder="搜索日语 / 中文 / 英文…" aria-label="搜索词典"><span class="search-icon">🔍</span></div>
<div class="table-wrap"><table class="dict-table" id="dictTable">
<thead><tr><th>日本語</th><th>中文</th><th>English</th><th>SAP 场景</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<p class="tiny">未来支持：中文 → 日语 SAP 表达、日语 → 中文 SAP 表达。</p>
</div></section>
<script>document.getElementById('dictInput').addEventListener('input', function(){
const q = this.value.trim().toLowerCase();
document.querySelectorAll('#dictTable tbody tr').forEach(tr => {
tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';});
});<\/script>`;
  writeFile('dictionary/index.html', layout({ title: 'SAP 日语词典', desc: '日本 SAP 项目高频术语词典：日语、中文、英文对照。', canonical: '/dictionary/', active: '/dictionary/', body }));
}

/* ============ 工具 ============ */
function buildTools(articles) {
  const tcodes = loadJson('data/tcodes.json');
  const tcodeRows = tcodes.map(t => `<tr><td><code>${escapeHtml(t.code)}</code></td><td>${escapeHtml(t.zh)}</td><td class="en">${escapeHtml(t.en)}</td><td><span class="scene">${escapeHtml(t.module)}</span></td></tr>`).join('');

  const checklistMd = [
    '- [ ] 定义 Company Code / Plant / Storage Location',
    '- [ ] 配置 Purchasing Organization 与 Purchasing Group',
    '- [ ] 维护 Material Master 必填视图（Basic / Purchasing / MRP / Accounting）',
    '- [ ] 创建 Business Partner（供应商）并分配角色',
    '- [ ] 配置 Document Type（PR / PO）与编号范围',
    '- [ ] 配置 Release Strategy（审批策略）',
    '- [ ] 维护 Condition / Pricing Schema',
    '- [ ] 配置 Movement Type 与库存记账',
    '- [ ] 配置 Invoice Verification 容差（Tolerance）',
    '- [ ] 配置 MM-FI 自动记账（OBYC）',
    '- [ ] 单元测试：PR → PO → GR → IV 全流程',
    '- [ ] 权限角色与审批流 UAT 确认',
  ].join('\n');
  const checklistHtml = renderChecklist(checklistMd);

  const p2pFlow = renderFlow([
    'Purchase Requisition | 采购申请 ME51N',
    'Source Determination | 货源确定 ME57',
    'Purchase Order | 采购订单 ME21N',
    'Goods Receipt | 收货 MIGO',
    'Invoice Verification | 发票校验 MIRO',
    'FI Posting | 财务过账',
    'Payment | 付款 F110',
  ].join('\n'));

  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: 'SAP 工具' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">SAP 工具</h1>
<p class="sec-sub">顾问日常高频小工具：查询、清单、流程图。未来将逐步加入 AI 工具。</p>

<h2 class="h2" id="tcode">⌨️ Transaction Code 查询</h2>
<div class="search-box"><input id="tcodeInput" type="search" placeholder="搜索 T-code / 中文 / 英文…" aria-label="搜索T-code"><span class="search-icon">🔍</span></div>
<div class="table-wrap"><table class="dict-table" id="tcodeTable">
<thead><tr><th>T-code</th><th>中文</th><th>English</th><th>模块</th></tr></thead>
<tbody>${tcodeRows}</tbody></table></div>

<h2 class="h2" id="checklist" style="margin-top:2.5rem">✅ MM 配置 Checklist</h2>
<p class="sec-sub">MM 实施核心配置项自查清单（示例）。</p>
${checklistHtml}

<h2 class="h2" id="p2p" style="margin-top:2.5rem">🔗 P2P 流程图</h2>
<p class="sec-sub">采购到付款标准流程。</p>
${p2pFlow}

<h2 class="h2" style="margin-top:2.5rem">📖 更多工具</h2>
<div class="grid3">
<a class="tool-card" href="/dictionary/"><span class="tool-icon">📖</span><span class="tool-name">SAP 日语词典</span><span class="tool-desc">中日英三语术语</span></a>
<a class="tool-card" href="/roadmaps/"><span class="tool-icon">🗺️</span><span class="tool-name">学习路径</span><span class="tool-desc">顾问成长路线图</span></a>
<a class="tool-card" href="/ai-lab/"><span class="tool-icon">🤖</span><span class="tool-name">AI × SAP Lab</span><span class="tool-desc">即将上线</span></a>
</div>
</div></section>
<script>document.getElementById('tcodeInput').addEventListener('input', function(){
const q = this.value.trim().toLowerCase();
document.querySelectorAll('#tcodeTable tbody tr').forEach(tr => {
tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';});
});<\/script>`;
  writeFile('tools/index.html', layout({ title: 'SAP 工具', desc: 'SAP 顾问工具：T-code 查询、MM 配置 Checklist、P2P 流程图、日语词典。', canonical: '/tools/', active: '/tools/', body }));
}

/* ============ 学习路径 ============ */
function buildRoadmaps() {
  const data = loadJson('data/roadmaps.json');
  const renderPath = (p) => {
    const steps = p.steps.map((s, i) =>
      `<div class="flow-step"><span class="flow-num">${i + 1}</span><div class="flow-text"><strong>${escapeHtml(s)}</strong></div></div>`
    ).join('<div class="flow-arrow" aria-hidden="true">↓</div>');
    return `<div class="path-card"><h3>${escapeHtml(p.name)}</h3><p class="sec-sub">${escapeHtml(p.desc)}</p><div class="flow compact">${steps}</div></div>`;
  };
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: '学习路径' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">SAP 顾问学习路径</h1>
<p class="sec-sub">从入门到 Lead Consultant 的成长路线，以及 S/4HANA MM 专项路线。</p>
<div class="path-grid">${data.map(renderPath).join('')}</div>
<div class="center" style="margin-top:2rem"><a class="btn primary" href="/kb/">去知识库开始学习</a></div>
</div></section>`;
  writeFile('roadmaps/index.html', layout({ title: '学习路径', desc: 'SAP 顾问成长路线：入门 / 进阶 / 高级，以及 S/4HANA MM 专项学习路线。', canonical: '/roadmaps/', active: '/roadmaps/', body }));
}

/* ============ AI Lab / About ============ */
function buildAiLab() {
  const future = ['SAP AI Assistant', 'SAP 知识问答', 'Functional Specification 生成器', 'Test Case 生成器', 'SAP 术语助手', 'SAP 日语助手', 'Incident 分析助手'];
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: 'AI × SAP Lab' }])}
<section class="section"><div class="wrap narrow center">
<div class="soon-card"><div class="soon-icon">🤖</div>
<h1>AI × SAP Lab</h1>
<p class="sec-sub">探索人工智能如何帮助 SAP 顾问进行知识检索、需求分析、测试案例生成、故障分析和项目文档处理。</p>
<h3>规划中的工具</h3>
<ul class="soon-list">${future.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
<p class="soon-badge">Coming Soon</p>
</div></div></section>`;
  writeFile('ai-lab/index.html', layout({ title: 'AI × SAP Lab', desc: 'AI × SAP Lab：SAP 顾问 AI 工具实验室（即将上线）。', canonical: '/ai-lab/', active: '', body }));
}

function buildAbout() {
  const skills = ['SAP MM', 'S/4HANA', 'SAP Implementation', 'Japan SAP Projects', 'Japanese N1', 'ABAP', 'PI / Integration', 'Team Leadership'];
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: '关于' }])}
<section class="section"><div class="wrap narrow">
<h1 class="page-title">关于</h1>
<div class="about-hero"><div class="exp-badge"><strong>15+</strong><span>years SAP experience</span></div>
<p>长期参与日本 SAP 项目，主要负责 MM 及供应链相关业务，同时具有 ABAP、Integration 和跨国团队管理经验。这个网站用于持续整理真实项目经验、S/4HANA 学习内容以及 SAP 顾问实践。</p></div>
<h2 class="h2">经验领域</h2>
<div class="skill-grid">${skills.map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('')}</div>
<h2 class="h2">关于本站</h2>
<div class="article-body">
<p>本站是 SAP 实战知识库，目标是把多年真实 SAP 项目经验系统化、结构化，沉淀为长期知识资产。</p>
<ul>
<li><strong>实战优先</strong>：回答"实际项目怎么做"，而不是泛泛的概念介绍。</li>
<li><strong>体系化</strong>：按 S/4HANA、MM、P2P、日本 SAP 等体系组织内容。</li>
<li><strong>案例脱敏</strong>：所有案例均经过脱敏 / 虚构处理，不含真实客户机密信息。</li>
<li><strong>示例内容</strong>：第一版文章为示例内容，用于验证网站结构，作者将持续替换为真实经验整理。</li>
</ul>
<p>本站暂不收集个人信息，不强制登录。联系与合作方式将在后续版本公布。</p>
</div>
</div></section>`;
  writeFile('about/index.html', layout({ title: '关于', desc: '关于 SAP 实战知识库与作者：15 年 SAP 项目经验，MM / S/4HANA / 日本 SAP。', canonical: '/about/', active: '/about/', body }));
}

/* ============ sitemap / robots / 404 ============ */
function buildMeta(articles) {
  const urls = ['', '/kb/', '/roadmaps/', '/tools/', '/dictionary/', '/ai-lab/', '/about/', '/search/'];
  Object.keys(CATEGORIES).forEach(k => urls.push(`/kb/${k}/`));
  articles.forEach(a => urls.push(a.url));
  const tagSet = new Set();
  articles.forEach(a => a.tags.forEach(t => tagSet.add(t)));
  tagSet.forEach(t => urls.push(`/tag/${encodeURIComponent(t)}/`));
  const today = new Date().toISOString().slice(0, 10);
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${SITE.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>`;
  writeFile('sitemap.xml', sm);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
  writeFile('CNAME', 'sap.haice.top\n');
  const body404 = `<section class="section"><div class="wrap narrow center" style="padding:4rem 0">
<h1>404</h1><p class="sec-sub">抱歉，这个页面不存在或已被移动。</p>
<a class="btn primary" href="/">返回首页</a> <a class="btn" href="/search/">去搜索</a></div></section>`;
  writeFile('404.html', layout({ title: '页面不存在', desc: '404', canonical: '/404.html', active: '', body: body404 }));
}

/* ============ 主流程 ============ */
function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const articles = loadArticles();
  console.log(`文章: ${articles.length} 篇`);

  // 静态资源
  const assetsDir = path.join(DIST, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) {
    fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(assetsDir, f));
  }

  buildIndex(articles);
  buildKB(articles);
  buildCategoryPages(articles);
  buildTagPages(articles);
  buildArticles(articles);
  buildSearch(articles);
  buildDictionary();
  buildTools(articles);
  buildRoadmaps();
  buildAiLab();
  buildAbout();
  buildMeta(articles);

  const count = (function walk(d) {
    return fs.readdirSync(d, { withFileTypes: true })
      .reduce((n, e) => n + (e.isDirectory() ? walk(path.join(d, e.name)) : 1), 0);
  })(DIST);
  console.log(`构建完成: dist/ 共 ${count} 个文件`);
}

main();
