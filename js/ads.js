/*
  Arcade Hub: Google AdSense.

  Off unless games.json has "ads": { "enabled": true, "client": "ca-pub-..." }.
  Nothing is loaded from Google until the visitor accepts the consent prompt
  (choice kept under 'arcade.hub.consent'). Ad units load lazily, when they
  scroll near the screen, inside boxes with a reserved height (css/ads.css) so the
  page does not jump. Slots are switched on or off in games.json:

    "ads": { "enabled": true, "client": "ca-pub-0000000000000000",
             "slots": { "banner": { "id": "1234567890", "enabled": true },
                        "card":   { "id": "2345678901", "enabled": true } } }
*/
(function () {
  'use strict';
  var KEY = 'arcade.hub.consent';
  var cfg = null, grid = null, scriptLoaded = false, io = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveConsent(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ }
  }
  function slot(name) {
    var s = cfg.slots && cfg.slots[name];
    return s && s.enabled !== false && /^\d{6,}$/.test(String(s.id || '')) ? s : null;
  }

  function loadScript() {
    if (scriptLoaded) return;
    scriptLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
    document.head.appendChild(s);
  }

  function fill(box) {
    if (box.dataset.filled) return;
    box.dataset.filled = '1';
    loadScript();
    var ins = el('ins', 'adsbygoogle');
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', cfg.client);
    ins.setAttribute('data-ad-slot', String(slot(box.dataset.slot).id));
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    box.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
  }

  function watch(box) {
    if (!('IntersectionObserver' in window)) { fill(box); return; }
    io = io || new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } });
    }, { rootMargin: '300px 0px' });
    io.observe(box);
  }

  function mount() {
    if (document.querySelector('[data-ad-box]')) return;
    if (slot('card') && grid) {
      var card = el('div', 'card ad');
      card.setAttribute('data-ad-box', '');
      card.appendChild(el('div', 'card-head', 'Sponsored'));
      var inner = el('div', 'ad-slot ad-card');
      inner.dataset.slot = 'card';
      card.appendChild(inner);
      grid.appendChild(card);
      watch(inner);
    }
    if (slot('banner')) {
      var wrap = el('section', 'wrap ad-banner-wrap');
      wrap.setAttribute('data-ad-box', '');
      wrap.setAttribute('aria-label', 'Advertisement');
      var box = el('div', 'ad-slot ad-banner');
      box.dataset.slot = 'banner';
      wrap.appendChild(box);
      var main = document.querySelector('main');
      main.appendChild(wrap);
      watch(box);
    }
  }

  function unmount() {
    document.querySelectorAll('[data-ad-box]').forEach(function (n) { n.remove(); });
    if (io) io.disconnect();
    io = null;
  }

  function setConsent(on) {
    saveConsent(on ? 'granted' : 'denied');
    var bar = document.getElementById('consent');
    if (bar) bar.hidden = true;
    var sw = document.getElementById('opt-ads');
    if (sw) sw.checked = on;
    if (on) mount(); else unmount();
  }

  function setupUi() {
    var tab = document.getElementById('tab-privacy');
    if (tab) tab.hidden = false;
    var sw = document.getElementById('opt-ads');
    if (sw) {
      sw.checked = getConsent() === 'granted';
      sw.addEventListener('change', function () { setConsent(sw.checked); });
    }
    var bar = document.getElementById('consent');
    if (bar) {
      document.getElementById('consent-yes').addEventListener('click', function () { setConsent(true); });
      document.getElementById('consent-no').addEventListener('click', function () { setConsent(false); });
      bar.hidden = getConsent() !== null;
    }
  }

  window.ArcadeAds = {
    init: function (config, gridEl) {
      cfg = config;
      grid = gridEl;
      if (!cfg || cfg.enabled !== true || !/^ca-pub-\d{8,}$/.test(String(cfg.client || ''))) return;
      if (!slot('banner') && !slot('card')) return;
      setupUi();
      if (getConsent() === 'granted') mount();
    }
  };
})();
