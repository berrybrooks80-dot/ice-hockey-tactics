/* ==========================================================================
   ICE-HOCKEY TACTICS — theme (dark / light) + language (English / 한국어)
   English lives in the HTML. Korean lives in js/ko.js, keyed by the
   normalised English string.
   ========================================================================== */
(function () {
  'use strict';

  var KO = window.KO || {};
  var ATTR_KO = window.ATTR_KO || {};

  var body = document.body;
  var textNodes = [];
  var attrNodes = [];
  var LANG = 'en';
  var THEME = 'dark';

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  function collect() {
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !norm(n.nodeValue)) { return NodeFilter.FILTER_REJECT; }
        var p = n.parentElement;
        if (!p) { return NodeFilter.FILTER_REJECT; }
        var tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') { return NodeFilter.FILTER_REJECT; }
        if (p.closest('.board') || p.closest('#ppCards') || p.closest('#pkCards')) { return NodeFilter.FILTER_REJECT; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var raw = n.nodeValue;
      textNodes.push({
        node: n,
        pre: (raw.match(/^\s*/) || [''])[0],
        post: (raw.match(/\s*$/) || [''])[0],
        key: norm(raw)
      });
    }

    var list = body.querySelectorAll('[placeholder],[aria-label],[title],[alt]');
    Array.prototype.forEach.call(list, function (el) {
      ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (name) {
        var v = el.getAttribute(name);
        if (!v || !norm(v)) { return; }
        if (el.closest('.board')) { return; }
        attrNodes.push({ el: el, name: name, key: norm(v) });
      });
    });
  }

  var missing = {};

  function applyText() {
    textNodes.forEach(function (t) {
      if (LANG === 'ko') {
        var ko = KO[t.key];
        if (!ko) { missing[t.key] = 1; }
        t.node.nodeValue = t.pre + (ko || t.key) + t.post;
      } else {
        t.node.nodeValue = t.pre + t.key + t.post;
      }
    });
    attrNodes.forEach(function (a) {
      if (LANG === 'ko') {
        a.el.setAttribute(a.name, ATTR_KO[a.key] || KO[a.key] || a.key);
      } else {
        a.el.setAttribute(a.name, a.key);
      }
    });
    if (LANG === 'ko') { window.I18N_MISSING = Object.keys(missing); }

    var titleEl = document.querySelector('title');
    if (titleEl) {
      titleEl.textContent = LANG === 'ko'
        ? '아이스하키 전술 — 포지션 · 파워플레이 · 페널티 킬'
        : 'HOCKEY TACTICS — Positions · Power Play · Penalty Kill';
    }
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (!desc.dataset.en) { desc.dataset.en = desc.getAttribute('content'); }
      desc.setAttribute('content', LANG === 'ko'
        ? '아이스하키 전술 애니메이션 보드: 포지션별 역할, 1-3-1·엄브렐라·오버로드·스프레드 파워플레이, 다이아몬드·박스·웨지+1·1-3 페널티 킬, 전통 전술과 최신 전술 비교.'
        : desc.dataset.en);
    }
  }

  /* language */
  function syncLang() {
    var l = document.getElementById('langLabel');
    var b = document.getElementById('langToggle');
    if (l) { l.textContent = LANG === 'ko' ? 'English' : '한국어'; }
    if (b) {
      b.setAttribute('aria-pressed', LANG === 'ko' ? 'true' : 'false');
      b.setAttribute('aria-label', LANG === 'ko' ? '영어로 전환' : 'Switch to Korean');
    }
  }

  function setLang(lang) {
    LANG = lang === 'ko' ? 'ko' : 'en';
    window.HOCKEY_LANG = LANG;
    document.documentElement.lang = LANG;
    applyText();
    syncLang();
    try { localStorage.setItem('ht-lang', LANG); } catch (e) {}
    document.dispatchEvent(new CustomEvent('hockey:lang', { detail: { lang: LANG } }));
  }

  /* theme */
  function syncTheme() {
    var light = THEME === 'light';
    var label = document.getElementById('themeLabel');
    var btn = document.getElementById('themeToggle');
    if (label) {
      label.textContent = LANG === 'ko'
        ? (light ? '다크' : '라이트')
        : (light ? 'Dark' : 'Light');
    }
    if (btn) {
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', LANG === 'ko'
        ? (light ? '다크 모드로 전환' : '라이트 모드로 전환')
        : (light ? 'Switch to dark mode' : 'Switch to light mode'));
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', light ? '#FBF7F1' : '#08192B'); }
  }

  function setTheme(theme, persist) {
    THEME = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', THEME);
    syncTheme();
    if (persist) { try { localStorage.setItem('ht-theme', THEME); } catch (e) {} }
  }

  /* boot */
  collect();

  var savedTheme = null, savedLang = null;
  try {
    savedTheme = localStorage.getItem('ht-theme');
    savedLang = localStorage.getItem('ht-lang');
  } catch (e) {}

  try {
    var q = new URLSearchParams(location.search);
    if (q.get('theme')) { savedTheme = q.get('theme'); }
    if (q.get('lang')) { savedLang = q.get('lang'); }
  } catch (e) {}

  setTheme(savedTheme || 'dark', false);
  setLang(savedLang || 'en');

  var tb = document.getElementById('themeToggle');
  if (tb) { tb.addEventListener('click', function () { setTheme(THEME === 'light' ? 'dark' : 'light', true); }); }
  var lb = document.getElementById('langToggle');
  if (lb) { lb.addEventListener('click', function () { setLang(LANG === 'ko' ? 'en' : 'ko'); }); }

  window.HockeyI18N = { setLang: setLang, setTheme: setTheme };
})();
