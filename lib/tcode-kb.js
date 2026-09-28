/* T-Code Knowledge Base 页面生成
   数据: data/tcode-kb.json
   输出: dist/tcode/ (数据库首页 / 详情页 / 统计报告 / 审核页)
   原则: 生命周期结论必须有 SAP 官方证据, 无证据一律 UNKNOWN + NEEDS_REVIEW,
         页面上显示 "? 状态待验证", 绝不猜测。 */
const fs = require('fs');
const path = require('path');
const { SITE, escapeHtml } = require('./common.js');
const { layout, breadcrumb } = require('../templates/layout.js');

const MODULES = {
  FI: '财务会计', CO: '管理会计', MM: '物料管理', SD: '销售分销',
  PP: '生产计划', PM: '设备维护', QM: '质量管理', PS: '项目系统',
  WM: '仓储管理', EWM: '扩展仓储管理', HCM: '人力资本管理',
  Basis: 'Basis / 系统管理', CrossApp: '跨应用',
};
const VERSION_ORDER = ['ECC 6.0', 'S/4HANA 1909', 'S/4HANA 2020', 'S/4HANA 2021',
  'S/4HANA 2022', 'S/4HANA 2023', 'S/4HANA 2025'];
const LC_LABEL = { ACTIVE: 'Active', DEPRECATED: 'Deprecated', OBSOLETE: 'Obsolete', REPLACED: 'Replaced', UNKNOWN: '? 状态待验证' };
const LC_CLASS = { ACTIVE: 'lc-active', DEPRECATED: 'lc-deprecated', OBSOLETE: 'lc-obsolete', REPLACED: 'lc-replaced', UNKNOWN: 'lc-unknown' };
const AV_LABEL = { AVAILABLE: '可用', LIMITED: '受限可用', NOT_AVAILABLE: '不可用', UNKNOWN: '未知' };
const REC_LABEL = { RECOMMENDED: 'SAP 推荐', NOT_RECOMMENDED: 'SAP 不推荐', NEUTRAL: '中性', UNKNOWN: '未知' };
const DQ_LABEL = { VERIFIED: '已验证', PARTIALLY_VERIFIED: '部分验证', NEEDS_REVIEW: '待审核' };
const DQ_CLASS = { VERIFIED: 'dq-verified', PARTIALLY_VERIFIED: 'dq-partial', NEEDS_REVIEW: 'dq-review' };
const SRC_LABEL = { 'SAP Help': 'SAP Help', 'Simplification List': 'Simplification List', 'SAP Note': 'SAP Note', 'SAP Learning': 'SAP Learning' };

function loadKb(ROOT) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tcode-kb.json'), 'utf8'));
}
function writeFile(DIST, rel, content) {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}
function jsStr(o) {
  return JSON.stringify(o).replace(/</g, '\\u003c');
}
/* T-Code 转 URL slug: /SCWM/MON -> -SCWM-MON */
function codeSlug(c) {
  return c.replace(/\//g, '-');
}
function sortedVersions(rec) {
  return (rec.versions || []).slice().sort((a, b) =>
    VERSION_ORDER.indexOf(a.version) - VERSION_ORDER.indexOf(b.version));
}
function latestVersion(rec) {
  const vs = sortedVersions(rec);
  return vs.length ? vs[vs.length - 1] : null;
}
function lcBadge(lc) {
  return `<span class="lc-badge ${LC_CLASS[lc] || 'lc-unknown'}">${LC_LABEL[lc] || LC_LABEL.UNKNOWN}</span>`;
}
function dqBadge(dq) {
  return `<span class="dq-badge ${DQ_CLASS[dq] || 'dq-review'}">${DQ_LABEL[dq] || DQ_LABEL.NEEDS_REVIEW}</span>`;
}
function evidenceHtml(ev) {
  if (!ev || !ev.source_url) return '<span class="tiny">暂无</span>';
  return `<a href="${escapeHtml(ev.source_url)}" target="_blank" rel="noopener" class="ev-link">${escapeHtml(ev.source_title || ev.source_url)}</a>
<span class="ev-meta">${escapeHtml(SRC_LABEL[ev.source_type] || ev.source_type || '')}${ev.source_version ? ' · ' + escapeHtml(ev.source_version) : ''}${ev.verified_at ? ' · 验证于 ' + escapeHtml(ev.verified_at) : ''}</span>
${ev.source_excerpt ? `<blockquote class="ev-excerpt">${escapeHtml(ev.source_excerpt)}</blockquote>` : ''}`;
}

/* ---------- 数据库首页 ---------- */
function buildIndex(DIST, kb) {
  const total = kb.length;
  const verified = kb.filter(r => r.data_quality === 'VERIFIED').length;
  const needReview = kb.filter(r => r.data_quality === 'NEEDS_REVIEW').length;
  const withSucc = kb.filter(r => (r.successors || []).length).length;

  const modChips = Object.keys(MODULES)
    .filter(m => kb.some(r => r.module === m))
    .map(m => `<button class="mod-chip" data-mod="${m}">${m} · ${MODULES[m]}</button>`).join('');

  const rows = kb.map(r => {
    const lv = latestVersion(r);
    const lc = lv ? lv.lifecycle : 'UNKNOWN';
    return `<tr data-code="${escapeHtml(r.code)}" data-mod="${escapeHtml(r.module)}" data-q="${escapeHtml((r.code + ' ' + r.zh + ' ' + r.en).toLowerCase())}">
<td><a href="/tcode/${codeSlug(escapeHtml(r.code))}/"><code>${escapeHtml(r.code)}</code></a></td>
<td>${escapeHtml(r.zh)}</td><td class="en">${escapeHtml(r.en)}</td>
<td><span class="scene">${escapeHtml(r.module)}</span></td>
<td>${lcBadge(lc)}${lv ? `<div class="tiny">${escapeHtml(lv.version)}</div>` : ''}</td>
<td>${dqBadge(r.data_quality)}</td></tr>`;
  }).join('');

  const body = `${breadcrumb([{ href: '/', label: '首页' }, { label: 'T-Code 知识库' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">T-Code 知识库</h1>
<p class="sec-sub">SAP ECC / S/4HANA 事务代码版本状态库。铁律：每条生命周期结论必须可追溯到 SAP 官方依据（Help Portal / Simplification List / 官方 Note），无证据的一律标「? 状态待验证」，绝不猜测。</p>
<div class="stat-cards">
<div class="stat-card"><strong>${total}</strong><span>收录 T-Code</span></div>
<div class="stat-card"><strong>${verified}</strong><span>官方证据已验证</span></div>
<div class="stat-card"><strong>${needReview}</strong><span>待审核</span></div>
<div class="stat-card"><strong>${withSucc}</strong><span>有官方 Successor</span></div>
</div>
<div class="search-box"><input id="kbInput" type="search" placeholder="搜索 T-code / 中文 / 英文…" aria-label="搜索T-code库"><span class="search-icon">🔍</span></div>
<div class="mod-chips"><button class="mod-chip on" data-mod="">全部模块</button>${modChips}</div>
<div class="table-wrap"><table class="dict-table" id="kbTable">
<thead><tr><th>T-code</th><th>中文</th><th>English</th><th>模块</th><th>S/4HANA 状态</th><th>数据质量</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<p class="tiny">状态说明：Active / Deprecated / Obsolete 严格采用 SAP 官方原文用词；Deprecated（不再开发但可能仍可用）与 Obsolete（已废止）是不同状态。点击 T-code 查看版本时间轴、迁移参考与官方证据链。</p>
<div class="center" style="margin-top:1.5rem"><a class="btn" href="/tcode/report/">📊 数据统计报告</a> <a class="btn" href="/tcode/review/">🛠️ 数据审核</a></div>
</div></section>
<script>(function(){
const input=document.getElementById('kbInput');let mod='';
function apply(){const q=input.value.trim().toLowerCase();
document.querySelectorAll('#kbTable tbody tr').forEach(tr=>{
const okMod=!mod||tr.dataset.mod===mod;const okQ=!q||tr.dataset.q.includes(q);
tr.style.display=(okMod&&okQ)?'':'none';});}
input.addEventListener('input',apply);
document.querySelectorAll('.mod-chip').forEach(b=>b.addEventListener('click',()=>{
document.querySelectorAll('.mod-chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');mod=b.dataset.mod;apply();}));
})();<\/script>`;
  writeFile(DIST, 'tcode/index.html', layout({
    title: 'T-Code 知识库', desc: 'SAP ECC / S/4HANA T-Code 版本状态库：每条生命周期结论均可追溯 SAP 官方依据。',
    canonical: '/tcode/', active: '/tcode/', body,
  }));
}

/* ---------- 详情页 ---------- */
function buildDetail(DIST, r) {
  const lv = latestVersion(r);
  const tlItems = sortedVersions(r).map(v => {
    const ev = v.evidence || {};
    return `<li class="tl-item">
<div class="tl-ver">${escapeHtml(v.version)}</div>
<div class="tl-badges">${lcBadge(v.lifecycle)}
<span class="mini-badge">可用性：${AV_LABEL[v.availability] || '未知'}</span>
<span class="mini-badge">推荐：${REC_LABEL[v.recommendation] || '未知'}</span></div>
${v.sap_status_original ? `<div class="tiny">SAP 原文状态词：<code>${escapeHtml(v.sap_status_original)}</code></div>` : ''}
<div class="tl-ev">${evidenceHtml(ev)}</div></li>`;
  }).join('');
  const timeline = tlItems
    ? `<ul class="timeline">${tlItems}</ul><p class="tiny">仅列出有 SAP 官方证据的版本；没有资料的版本不填猜测结果。</p>`
    : `<div class="empty-box">${lcBadge('UNKNOWN')}<p>该 T-Code 暂无 SAP 官方生命周期证据，状态待验证。<br>如果你在 SAP Help Portal / Simplification List 中找到依据，欢迎通过审核页补充。</p></div>`;

  // 迁移参考: 最新版本状态 -> Successor -> Fiori
  let migration;
  if (lv && lv.lifecycle !== 'UNKNOWN') {
    const succT = (r.successors || []).filter(s => s.kind !== 'FIORI');
    const succF = (r.successors || []).filter(s => s.kind === 'FIORI');
    const chain = [`<div class="mig-step"><strong>S/4HANA</strong><span>${escapeHtml(lv.version)}</span>${lcBadge(lv.lifecycle)}</div>`];
    if (succT.length) chain.push(`<div class="mig-arrow">↓</div><div class="mig-step"><strong>Successor（官方）</strong><span>${succT.map(s => `<a href="/tcode/${codeSlug(escapeHtml(s.to))}/"><code>${escapeHtml(s.to)}</code></a>`).join('、')}</span></div>`);
    if (succF.length) chain.push(`<div class="mig-arrow">↓</div><div class="mig-step"><strong>Fiori</strong><span>${succF.map(s => escapeHtml(s.to)).join('、')}</span></div>`);
    migration = `<div class="migration">${chain.join('')}</div>
<p class="tiny">Successor 仅在 SAP 官方资料明确声明（successor / replaced by / replacement）时建立；仅存在 Fiori App 而无官方替代声明的，记为关联 Fiori，不记为替代。</p>`;
  } else {
    migration = `<div class="empty-box"><p>暂无官方迁移信息。实际项目迁移请以目标系统版本 + 事务 <code>SYCM</code>（Simplification Database）验证为准，详见知识库文章《在 S/4HANA 系统中验证 Simplification》。</p></div>`;
  }

  const succRows = (r.successors || []).map(s =>
    `<tr><td><code>${escapeHtml(s.to)}</code></td><td>${s.kind === 'FIORI' ? 'Fiori App' : 'T-Code'}</td>
<td>${s.relationship === 'REPLACED_BY' ? '<span class="lc-badge lc-obsolete">官方替代</span>' : '<span class="mini-badge">关联 Fiori</span>'}</td>
<td class="tiny">${s.source_url ? `<a href="${escapeHtml(s.source_url)}" target="_blank" rel="noopener">官方依据</a>` : '—'}</td></tr>`).join('');
  const succTable = succRows
    ? `<div class="table-wrap"><table class="dict-table"><thead><tr><th>Successor</th><th>类型</th><th>关系</th><th>证据</th></tr></thead><tbody>${succRows}</tbody></table></div>`
    : '<p class="tiny">暂无官方 Successor 记录。</p>';

  const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/tcode/', label: 'T-Code 知识库' }, { label: r.code }])}
<section class="section"><div class="wrap narrow">
<div class="tcode-head">
<div><p class="hero-kicker">${escapeHtml(MODULES[r.module] || r.module)} · ${escapeHtml(r.category)}</p>
<h1 class="tcode-title"><code>${escapeHtml(r.code)}</code></h1>
<p class="tcode-sub">${escapeHtml(r.zh)}<br><span class="en">${escapeHtml(r.en)}</span></p></div>
<div class="tcode-badges">${lv ? lcBadge(lv.lifecycle) : lcBadge('UNKNOWN')}${dqBadge(r.data_quality)}</div>
</div>

<h2 class="h2">版本时间轴</h2>
${timeline}

<h2 class="h2">迁移参考</h2>
${migration}

<h2 class="h2">Successor</h2>
${succTable}

${r.notes ? `<h2 class="h2">备注</h2><div class="article-body"><p>${escapeHtml(r.notes)}</p></div>` : ''}

<div class="admonition note"><div class="admonition-title">说明</div><div class="admonition-body">
<p>本站数据仅供学习参考，不等于你的 SAP 系统实际状态。实际项目迁移必须根据目标系统版本、部署模式、配置、授权，并使用 SAP 官方工具（如 SYCM）验证。</p></div></div>
<div class="center" style="margin-top:1.5rem"><a class="btn" href="/tcode/">← 返回 T-Code 知识库</a></div>
</div></section>`;
  writeFile(DIST, `tcode/${codeSlug(r.code)}/index.html`, layout({
    title: `${r.code} ${r.zh}`, desc: `${r.code}（${r.zh} / ${r.en}）在 S/4HANA 各版本的生命周期状态与 SAP 官方证据。`,
    canonical: `/tcode/${codeSlug(r.code)}/`, active: '/tcode/', body,
    jsonld: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'TechArticle',
      headline: `${r.code} ${r.zh}`, inLanguage: 'zh-CN',
      about: { '@type': 'ComputerLanguage', name: 'SAP Transaction Code' },
    }),
  }));
}

/* ---------- 统计报告 ---------- */
function buildReport(DIST, kb) {
  const total = kb.length;
  const byMod = {};
  kb.forEach(r => { byMod[r.module] = (byMod[r.module] || 0) + 1; });
  const lcCount = { ACTIVE: 0, DEPRECATED: 0, OBSOLETE: 0, REPLACED: 0, UNKNOWN: 0 };
  kb.forEach(r => { const lv = latestVersion(r); lcCount[lv ? lv.lifecycle : 'UNKNOWN']++; });
  const dqCount = { VERIFIED: 0, PARTIALLY_VERIFIED: 0, NEEDS_REVIEW: 0 };
  kb.forEach(r => { dqCount[r.data_quality] = (dqCount[r.data_quality] || 0) + 1; });
  const withSucc = kb.filter(r => (r.successors || []).some(s => s.kind !== 'FIORI')).length;
  const withFiori = kb.filter(r => (r.successors || []).some(s => s.kind === 'FIORI')).length;
  const srcUrls = new Set();
  kb.forEach(r => {
    (r.versions || []).forEach(v => { if (v.evidence && v.evidence.source_url) srcUrls.add(v.evidence.source_url); });
    (r.successors || []).forEach(s => { if (s.source_url) srcUrls.add(s.source_url); });
  });
  const unverified = kb.filter(r => r.data_quality === 'NEEDS_REVIEW');
  const unverByMod = {};
  unverified.forEach(r => { (unverByMod[r.module] = unverByMod[r.module] || []).push(r.code); });

  const modRows = Object.keys(MODULES).filter(m => byMod[m])
    .map(m => `<tr><td>${m}</td><td>${escapeHtml(MODULES[m])}</td><td>${byMod[m]}</td></tr>`).join('');
  const unverList = Object.keys(unverByMod).sort().map(m =>
    `<h3>${m} · ${escapeHtml(MODULES[m])}（${unverByMod[m].length}）</h3>
<p class="code-list">${unverByMod[m].map(c => `<a href="/tcode/${codeSlug(c)}/"><code>${c}</code></a>`).join(' ')}</p>`).join('');

  const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/tcode/', label: 'T-Code 知识库' }, { label: '数据统计报告' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">T-Code 数据统计报告</h1>
<p class="sec-sub">构建时自动生成。数据日期：${new Date().toISOString().slice(0, 10)}</p>

<h2 class="h2">A–B · 总量与模块分布</h2>
<div class="stat-cards">
<div class="stat-card"><strong>${total}</strong><span>A · 总 T-Code</span></div>
<div class="stat-card"><strong>${withSucc}</strong><span>I · 有官方 Successor</span></div>
<div class="stat-card"><strong>${withFiori}</strong><span>J · 有 Fiori 关系</span></div>
<div class="stat-card"><strong>${srcUrls.size}</strong><span>K · SAP 官方来源数</span></div>
</div>
<div class="table-wrap"><table class="dict-table"><thead><tr><th>模块</th><th>名称</th><th>B · 数量</th></tr></thead><tbody>${modRows}</tbody></table></div>

<h2 class="h2">C–H · 生命周期与数据质量</h2>
<div class="table-wrap"><table class="dict-table"><thead><tr><th>状态</th><th>数量</th></tr></thead><tbody>
<tr><td>C · 已验证生命周期（有官方证据的版本记录）</td><td>${kb.reduce((n, r) => n + (r.versions || []).filter(v => v.evidence && v.evidence.source_url).length, 0)}</td></tr>
<tr><td>D · Deprecated</td><td>${lcCount.DEPRECATED}</td></tr>
<tr><td>E · Obsolete</td><td>${lcCount.OBSOLETE}</td></tr>
<tr><td>F · Replaced</td><td>${lcCount.REPLACED}</td></tr>
<tr><td>G · Unknown（无证据）</td><td>${lcCount.UNKNOWN}</td></tr>
<tr><td>H · Needs Review</td><td>${dqCount.NEEDS_REVIEW}</td></tr>
<tr><td>部分验证（PARTIALLY_VERIFIED）</td><td>${dqCount.PARTIALLY_VERIFIED}</td></tr>
<tr><td>已验证（VERIFIED）</td><td>${dqCount.VERIFIED}</td></tr>
</tbody></table></div>

<h2 class="h2">L · 无法验证的 T-Code 清单</h2>
<p class="sec-sub">以下 T-Code 暂无 SAP 官方生命周期证据，标为 UNKNOWN / 待审核，不做任何猜测。</p>
${unverList || '<p>无。</p>'}
<div class="center" style="margin-top:1.5rem"><a class="btn" href="/tcode/">← 返回 T-Code 知识库</a></div>
</div></section>`;
  writeFile(DIST, 'tcode/report/index.html', layout({
    title: 'T-Code 数据统计报告', desc: 'T-Code 知识库数据统计：总量、模块分布、生命周期状态、无法验证清单。',
    canonical: '/tcode/report/', active: '/tcode/', body,
  }));
}

/* ---------- 数据审核页 ---------- */
function buildReview(DIST, kb) {
  const data = kb.map(r => {
    const lv = latestVersion(r);
    const ev = lv && lv.evidence;
    return {
      code: r.code, module: r.module, zh: r.zh,
      version: lv ? lv.version : '—',
      lifecycle: lv ? lv.lifecycle : 'UNKNOWN',
      dq: r.data_quality,
      source: ev && ev.source_url ? ev.source_url : '',
      sourceTitle: ev && ev.source_title ? ev.source_title : '',
      verifiedAt: ev && ev.verified_at ? ev.verified_at : '—',
    };
  });
  const body = `${breadcrumb([{ href: '/', label: '首页' }, { href: '/tcode/', label: 'T-Code 知识库' }, { label: '数据审核' }])}
<section class="section"><div class="wrap">
<h1 class="page-title">T-Code 数据审核</h1>
<p class="sec-sub">管理员审核队列。筛选待处理数据，逐条 Approve / Edit / Reject / Add Source。审核决定保存在本机浏览器，可导出为 JSON 合并到数据库构建流程。</p>
<div class="mod-chips" id="reviewFilters">
<button class="mod-chip on" data-f="ALL">全部</button>
<button class="mod-chip" data-f="UNKNOWN">Unknown</button>
<button class="mod-chip" data-f="NEEDS_REVIEW">Needs Review</button>
<button class="mod-chip" data-f="DEPRECATED">Deprecated</button>
<button class="mod-chip" data-f="OBSOLETE">Obsolete</button>
<button class="mod-chip" data-f="REPLACED">Replaced</button>
<button class="mod-chip" data-f="VERIFIED">已验证</button>
</div>
<div class="review-actions">
<button class="btn" id="exportBtn">导出审核结果 JSON</button>
<label class="btn">导入审核结果<input type="file" id="importFile" accept=".json" hidden></label>
<span class="tiny" id="decisionCount"></span>
</div>
<div class="table-wrap"><table class="dict-table" id="reviewTable">
<thead><tr><th>T-Code</th><th>模块</th><th>版本</th><th>当前状态</th><th>来源</th><th>最后验证</th><th>操作</th></tr></thead>
<tbody></tbody></table></div>
</div></section>
<div class="review-panel" id="reviewPanel" hidden>
<h3 id="rpTitle"></h3>
<label>审核动作
<select id="rpAction"><option value="approve">Approve（确认无误）</option><option value="edit">Edit（修正后确认）</option><option value="reject">Reject（驳回）</option><option value="add_source">Add Source（补充来源）</option></select></label>
<label>生命周期状态
<select id="rpLc"><option>ACTIVE</option><option>DEPRECATED</option><option>OBSOLETE</option><option>REPLACED</option><option>UNKNOWN</option></select></label>
<label>Successor（官方明确才填）<input id="rpSucc" placeholder="如 BP，多个用逗号分隔"></label>
<label>官方来源 URL<input id="rpUrl" placeholder="https://help.sap.com/…"></label>
<label>备注<input id="rpNote" placeholder="审核说明"></label>
<div class="rp-btns"><button class="btn primary" id="rpSave">保存决定</button><button class="btn" id="rpClose">取消</button></div>
</div>
<script>
window.TCODE_REVIEW_DATA = ${jsStr(data)};
(function(){
const KEY='tcode-review-decisions';
let decisions={};try{decisions=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const tbody=document.querySelector('#reviewTable tbody');let filter='ALL';let current=null;
const LC_TXT={ACTIVE:'Active',DEPRECATED:'Deprecated',OBSOLETE:'Obsolete',REPLACED:'Replaced',UNKNOWN:'? 待验证'};
function match(r){if(filter==='ALL')return true;if(filter==='NEEDS_REVIEW')return r.dq==='NEEDS_REVIEW';if(filter==='VERIFIED')return r.dq==='VERIFIED';return r.lifecycle===filter;}
function render(){tbody.innerHTML=window.TCODE_REVIEW_DATA.filter(match).map(r=>{
const d=decisions[r.code];const src=r.source?'<a href="'+r.source+'" target="_blank" rel="noopener">'+(r.sourceTitle||'官方依据')+'</a>':'—';
return '<tr><td><a href="/tcode/'+r.code+'/"><code>'+r.code+'</code></a>'+(d?' <span class="decided">已审:'+d.action+'</span>':'')+'</td><td>'+r.module+'</td><td>'+r.version+'</td><td>'+LC_TXT[r.lifecycle]+'</td><td>'+src+'</td><td>'+r.verifiedAt+'</td><td><button class="btn small" data-code="'+r.code+'">审核</button></td></tr>';}).join('');
updateCount();}
function updateCount(){document.getElementById('decisionCount').textContent='已保存 '+Object.keys(decisions).length+' 条审核决定（本机）';}
document.querySelectorAll('#reviewFilters .mod-chip').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#reviewFilters .mod-chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');filter=b.dataset.f;render();}));
tbody.addEventListener('click',e=>{const btn=e.target.closest('button[data-code]');if(!btn)return;current=btn.dataset.code;const r=window.TCODE_REVIEW_DATA.find(x=>x.code===current);const d=decisions[current]||{};
document.getElementById('rpTitle').textContent='审核 '+current+'（'+r.zh+'）';
document.getElementById('rpAction').value=d.action||'approve';document.getElementById('rpLc').value=d.lifecycle||r.lifecycle;
document.getElementById('rpSucc').value=d.successor||'';document.getElementById('rpUrl').value=d.source_url||r.source;document.getElementById('rpNote').value=d.note||'';
document.getElementById('reviewPanel').hidden=false;});
document.getElementById('rpClose').addEventListener('click',()=>{document.getElementById('reviewPanel').hidden=true;});
document.getElementById('rpSave').addEventListener('click',()=>{decisions[current]={action:document.getElementById('rpAction').value,lifecycle:document.getElementById('rpLc').value,successor:document.getElementById('rpSucc').value.trim(),source_url:document.getElementById('rpUrl').value.trim(),note:document.getElementById('rpNote').value.trim(),reviewed_at:new Date().toISOString().slice(0,10)};
localStorage.setItem(KEY,JSON.stringify(decisions));document.getElementById('reviewPanel').hidden=true;render();});
document.getElementById('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(decisions,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tcode-review-decisions.json';a.click();});
document.getElementById('importFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{decisions=JSON.parse(rd.result);localStorage.setItem(KEY,JSON.stringify(decisions));render();}catch(err){alert('JSON 解析失败');}};rd.readAsText(f);});
render();
})();<\/script>`;
  writeFile(DIST, 'tcode/review/index.html', layout({
    title: 'T-Code 数据审核', desc: 'T-Code 知识库管理员审核：筛选 Unknown / 待审核 / Deprecated / Obsolete 数据并记录审核决定。',
    canonical: '/tcode/review/', active: '/tcode/', body,
  }));
}

function buildTcodeKB(ROOT, DIST) {
  const kb = loadKb(ROOT);
  buildIndex(DIST, kb);
  kb.forEach(r => buildDetail(DIST, r));
  buildReport(DIST, kb);
  buildReview(DIST, kb);
  const urls = ['/tcode/', '/tcode/report/', '/tcode/review/'].concat(kb.map(r => `/tcode/${codeSlug(r.code)}/`));
  const codeMap = new Map(kb.map(r => [r.code, codeSlug(r.code)]));
  return { codeMap, urls };
}

module.exports = { buildTcodeKB, MODULES, codeSlug };
