/* SAP 实战知识库 - 全站搜索(客户端) */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function snippet(text, q) {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return esc(text.slice(0, 140)) + '…';
    const start = Math.max(0, idx - 60), end = Math.min(text.length, idx + 120);
    let s = esc(text.slice(start, end));
    s = s.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    return (start > 0 ? '…' : '') + s + (end < text.length ? '…' : '');
  }

  ready(function () {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const meta = document.getElementById('searchMeta');
    const results = document.getElementById('searchResults');
    let index = null;

    document.querySelectorAll('[data-q]').forEach(btn => {
      btn.addEventListener('click', () => { input.value = btn.getAttribute('data-q'); doSearch(); input.focus(); });
    });

    const params = new URLSearchParams(location.search);
    if (params.get('q')) input.value = params.get('q');

    fetch(window.SEARCH_INDEX_URL || '/search.json')
      .then(r => r.json())
      .then(data => {
        index = data;
        if (input.value.trim()) doSearch();
      })
      .catch(() => { meta.textContent = '搜索索引加载失败，请稍后重试。'; });

    let timer = null;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(doSearch, 220); });

    function doSearch() {
      const q = input.value.trim().toLowerCase();
      if (!index) return;
      if (!q) { meta.textContent = ''; results.innerHTML = ''; return; }
      const hits = index.map(item => {
        let score = 0;
        const inTitle = item.title.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        const inTcode = item.tcodes.some(t => t.toLowerCase().includes(q));
        const inContent = item.content.toLowerCase().includes(q);
        if (inTitle) score += 10;
        if (inTcode) score += 8;
        if (inTags) score += 5;
        if (inContent) score += 1;
        return { item, score, inTitle, inTags, inTcode, inContent };
      }).filter(h => h.score > 0).sort((a, b) => b.score - a.score);

      meta.textContent = hits.length ? `找到 ${hits.length} 个结果` : `没有找到与「${input.value.trim()}」相关的内容，换个关键词试试`;
      results.innerHTML = hits.slice(0, 30).map(h => {
        const it = h.item;
        const why = [h.inTcode ? 'T-code' : '', h.inTags ? '标签' : '', h.inContent && !h.inTitle ? '正文' : '']
          .filter(Boolean).join(' · ');
        return `<div class="result-item">
<div class="post-meta-top"><span class="cat-tag">${esc(it.category)}</span>${why ? `<span class="post-date">匹配：${esc(why)}</span>` : ''}</div>
<h3><a href="${it.url}">${esc(it.title)}</a></h3>
<p>${snippet(it.excerpt + ' ' + it.content, q)}</p>
</div>`;
      }).join('');
    }
  });
})();
