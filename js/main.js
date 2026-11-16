/* ==========================================================================
   ICE-HOCKEY TACTICS — nav, scroll, position map
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.remove('no-js');

  /* header + progress */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) { header.classList.toggle('is-stuck', y > 20); }
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (y / max) * 100 : 0;
      progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* mobile nav */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');
  function closeNav() {
    if (!nav || !navToggle) { return; }
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { closeNav(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeNav(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) { closeNav(); } });
  }

  /* scroll spy + offset anchors */
  function headerH() { return header ? header.offsetHeight : 74; }
  var links = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a[href^="#"]'));
  var sections = links.map(function (l) {
    var el = document.getElementById(l.getAttribute('href').slice(1));
    return el ? { link: l, el: el } : null;
  }).filter(Boolean);

  function spy() {
    if (!sections.length) { return; }
    var pos = (window.pageYOffset || 0) + headerH() + 100;
    var active = sections[0];
    sections.forEach(function (s) { if (s.el.offsetTop <= pos) { active = s; } });
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 6) {
      active = sections[sections.length - 1];
    }
    links.forEach(function (l) { l.classList.remove('is-active'); });
    if (active) { active.link.classList.add('is-active'); }
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(spy); }, { passive: true });
  spy();

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) { return; }
    var href = a.getAttribute('href');
    if (!href || href.length < 2) { return; }
    var target = document.getElementById(href.slice(1));
    if (!target) { return; }
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerH() + 1;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) { history.replaceState(null, '', href); }
    closeNav();
  });

  /* reveal */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 5, 4) * 50 + 'ms';
      io.observe(el);
    });
  }

  /* position map <-> cards */
  var dots = Array.prototype.slice.call(document.querySelectorAll('.pos-dot'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pos-card'));

  function setActive(pos) {
    dots.forEach(function (d) { d.classList.toggle('is-on', d.getAttribute('data-pos') === pos); });
    cards.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-pos') === pos); });
  }

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      setActive(d.getAttribute('data-pos'));
      var card = document.querySelector('.pos-card[data-pos="' + d.getAttribute('data-pos') + '"]');
      if (card && card.scrollIntoView) {
        card.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
    d.addEventListener('mouseenter', function () { setActive(d.getAttribute('data-pos')); });
  });
  cards.forEach(function (c) {
    c.addEventListener('mouseenter', function () { setActive(c.getAttribute('data-pos')); });
    c.addEventListener('focusin', function () { setActive(c.getAttribute('data-pos')); });
  });
  setActive('C');

  /* first-paint deep link offset */
  if (location.hash && location.hash.length > 1) {
    var first = document.getElementById(location.hash.slice(1));
    if (first) {
      setTimeout(function () {
        var top = first.getBoundingClientRect().top + window.pageYOffset - headerH() + 1;
        window.scrollTo({ top: top, behavior: 'auto' });
      }, 60);
    }
  }
})();
