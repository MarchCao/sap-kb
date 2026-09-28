/* 共享常量与纯函数 */

const SITE = {
  name: 'SAP 实战知识库',
  en: 'SAP Knowledge Base',
  url: 'https://sap.haice.top',
  desc: '把 SAP 项目经验，变成可以真正学习和复用的知识。15 年 SAP 项目经验，持续整理 S/4HANA、MM、供应链、日本 SAP 项目与顾问实战经验。',
};

/* 分类元数据 */
const CATEGORIES = {
  s4hana:      { name: 'S/4HANA',     desc: 'S/4HANA 基础、架构、Fiori、主数据变化、迁移与项目方法', color: '#1d4ed8' },
  mm:          { name: 'SAP MM',      desc: '物料管理：企业结构、主数据、采购、收货、库存', color: '#0e7490' },
  p2p:         { name: 'P2P',         desc: '采购到付款（Procure to Pay）全流程', color: '#0f766e' },
  pp:          { name: 'PP',          desc: '生产计划与 MRP', color: '#b45309' },
  sd:          { name: 'SD',          desc: '销售与分销', color: '#be123c' },
  qm:          { name: 'QM',          desc: '质量管理', color: '#6d28d9' },
  abap:        { name: 'ABAP',        desc: '面向功能顾问的 ABAP、Debug 与增强', color: '#475569' },
  integration: { name: 'Integration', desc: 'IDoc / RFC / BAPI / PI·PO / API 接口', color: '#334155' },
  project:     { name: 'SAP 项目',     desc: '实施方法论、测试、数据迁移、切换与运维', color: '#9a3412' },
  japan:       { name: '日本 SAP',     desc: '日本项目流程、要件定義、日语与跨文化协作', color: '#b91c1c' },
  cases:       { name: '实战案例',     desc: '经过脱敏处理的完整项目案例（不含真实客户信息）', color: '#166534' },
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stripTags(s) { return String(s).replace(/<[^>]+>/g, ''); }
function slugify(s) {
  return String(s).toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'sec';
}
function fmtDate(d) {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? `${m[1]}年${+m[2]}月${+m[3]}日` : d;
}
function readingTime(text) {
  return Math.max(1, Math.round(String(text).replace(/\s/g, '').length / 450));
}
function excerptOf(text, n = 120) {
  const t = String(text).replace(/[#>*`|\-\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

module.exports = { SITE, CATEGORIES, escapeHtml, stripTags, slugify, fmtDate, readingTime, excerptOf };
