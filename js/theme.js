/*
  Arcade hub: settings store.

  Loaded in <head> so the saved colour scheme, motion and text size are applied
  before the page paints (no flash). The settings dialog in hub.js reads and
  writes through ArcadeTheme.
*/
(function () {
  'use strict';
  var KEY = 'arcade.hub.settings';
  var DEFAULTS = { scheme: 'auto', motion: false, text: false };

  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      return {
        scheme: typeof saved.scheme === 'string' ? saved.scheme : DEFAULTS.scheme,
        motion: !!saved.motion,
        text: !!saved.text
      };
    } catch (e) {
      return { scheme: DEFAULTS.scheme, motion: DEFAULTS.motion, text: DEFAULTS.text };
    }
  }

  function apply(s) {
    var root = document.documentElement;
    root.setAttribute('data-theme', s.scheme);
    if (s.motion) root.setAttribute('data-motion', 'reduce'); else root.removeAttribute('data-motion');
    root.style.setProperty('--text-scale', s.text ? '1.125' : '1');
    // keep the mobile browser bar in step with the page background
    var meta = document.querySelector('meta[name="theme-color"]');
    var bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (meta && bg) meta.setAttribute('content', bg);
  }

  window.ArcadeTheme = {
    get: read,
    set: function (patch) {
      var s = read();
      for (var k in patch) s[k] = patch[k];
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ }
      apply(s);
      return s;
    }
  };
  apply(read());
})();
