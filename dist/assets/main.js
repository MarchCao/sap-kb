/* SAP 实战知识库 - 通用交互 */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    // 移动端导航
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', e => {
        if (e.target.tagName === 'A') nav.classList.remove('open');
      });
    }
    // 目录滚动高亮(桌面端)
    const tocLinks = document.querySelectorAll('.toc-side .toc a');
    if (tocLinks.length && 'IntersectionObserver' in window) {
      const map = {};
      tocLinks.forEach(a => { map[a.getAttribute('href').slice(1)] = a; });
      const obs = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            tocLinks.forEach(a => a.classList.remove('on'));
            const a = map[en.target.id];
            if (a) a.classList.add('on');
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) obs.observe(el);
      });
      const style = document.createElement('style');
      style.textContent = '.toc a.on{color:var(--accent);font-weight:600}';
      document.head.appendChild(style);
    }
  });
})();
