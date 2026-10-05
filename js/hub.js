/*
  Arcade Hub.

  Reads games.json, asks each live game for its own game.json (so titles,
  taglines and thumbnails stay in the game's folder), and draws one card per
  game. Falls back to the data in games.json when a game's folder is not there
  yet. Shows the player's best score from the shared 'arcade.stats' record that
  the games write to localStorage.
*/
(function () {
  'use strict';

  var SCHEMES = [
    { id: 'auto',     name: 'Automatic', bg: '#0d0221', accent: '#f6f4fb' },
    { id: 'midnight', name: 'Midnight',  bg: '#0d0221', accent: '#ff3cac' },
    { id: 'daylight', name: 'Daylight',  bg: '#f6f4fb', accent: '#c4167f' },
    { id: 'ocean',    name: 'Ocean',     bg: '#04141f', accent: '#2ee6d6' },
    { id: 'sunset',   name: 'Sunset',    bg: '#1a0b12', accent: '#ff8a3d' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid');
  var state = { category: '', tag: '', q: '' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function stats() {
    try { return JSON.parse(localStorage.getItem('arcade.stats') || '{}') || {}; } catch (e) { return {}; }
  }
  function nice(t) { return String(t).replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  /* ---------- cards ---------- */
  function liveCard(g, mine) {
    var card = el('a', 'card');
    card.href = g.path;
    card.dataset.category = g.category || '';
    card.dataset.tags = (g.tags || []).join('|');
    card.dataset.hay = [g.title, g.tagline, g.summary, (g.tags || []).join(' ')].join(' ').toLowerCase();

    var thumb = el('div', 'thumb');
    function placeholder() {
      thumb.textContent = '';
      thumb.appendChild(el('div', 'art', (g.title || '?').charAt(0)));
    }
    if (g.thumb) {
      var img = new Image();
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = function () {
        // the game's own thumbnail is missing: use the hub's copy, then a plain tile
        if (g.fallbackThumb && img.src.indexOf(g.fallbackThumb) === -1) img.src = g.fallbackThumb;
        else placeholder();
      };
      img.src = g.thumb;
      thumb.appendChild(img);
    } else {
      placeholder();
    }
    card.appendChild(thumb);

    var body = el('div', 'body');
    body.appendChild(el('h3', '', g.title));
    if (g.tagline) body.appendChild(el('p', '', g.tagline));
    if (g.badges && g.badges.length) {
      var chips = el('ul', 'chips');
      g.badges.slice(0, 5).forEach(function (b) { chips.appendChild(el('li', '', b)); });
      body.appendChild(chips);
    }
    var meta = el('div', 'meta');
    if (mine && mine.best > 0) {
      var b = el('span', 'best', 'Your best: ');
      b.appendChild(el('strong', '', String(mine.best)));
      if (mine.plays > 1) b.appendChild(document.createTextNode(' \u00b7 ' + mine.plays + ' plays'));
      meta.appendChild(b);
    }
    meta.appendChild(el('span', 'play', 'Play ›'));
    body.appendChild(meta);
    card.appendChild(body);
    card.setAttribute('aria-label', g.title + '. ' + (g.tagline || '') + ' Play.');
    return card;
  }

  function soonCard(g) {
    var card = el('div', 'card soon');
    card.dataset.category = '*';
    card.dataset.soon = '1';
    var thumb = el('div', 'thumb');
    thumb.appendChild(el('span', 'q', '?'));
    card.appendChild(thumb);
    var body = el('div', 'body');
    body.appendChild(el('h3', '', g.title || 'Coming soon'));
    if (g.tagline) body.appendChild(el('p', '', g.tagline));
    card.appendChild(body);
    return card;
  }

  /* ---------- filters: category tabs, tag chips and search all combine ---------- */
  function applyFilters() {
    var shown = 0;
    var narrowed = !!(state.category || state.tag || state.q);
    grid.querySelectorAll('.card').forEach(function (c) {
      var show;
      if (c.dataset.soon) {
        show = !narrowed; // placeholders only show on the unfiltered grid
      } else {
        show = (!state.category || c.dataset.category === state.category) &&
               (!state.tag || ('|' + c.dataset.tags + '|').indexOf('|' + state.tag + '|') > -1) &&
               (!state.q || c.dataset.hay.indexOf(state.q) > -1);
        if (show) shown++;
      }
      c.hidden = !show;
    });
    $('empty').hidden = shown !== 0;
  }

  function buildFilters(games) {
    var live = games.filter(function (g) { return g.status === 'live'; });

    var cats = [];
    live.forEach(function (g) { if (g.category && cats.indexOf(g.category) < 0) cats.push(g.category); });
    var box = $('filters');
    if (cats.length < 2) { box.hidden = true; }
    else {
      box.hidden = false;
      ['All'].concat(cats).forEach(function (name, i) {
        var b = el('button', '', name);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        b.addEventListener('click', function () {
          box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
          state.category = i === 0 ? '' : name;
          applyFilters();
        });
        box.appendChild(b);
      });
    }

    var all = {};
    live.forEach(function (g) { (g.tags || []).forEach(function (t) { all[t] = true; }); });
    var names = Object.keys(all).sort();
    var tagBox = $('tags');
    if (live.length < 2 || !names.length) { tagBox.hidden = true; }
    else {
      tagBox.hidden = false;
      names.forEach(function (t) {
        var b = el('button', '', nice(t));
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          state.tag = state.tag === t ? '' : t;
          tagBox.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          if (state.tag) b.setAttribute('aria-pressed', 'true');
          applyFilters();
        });
        tagBox.appendChild(b);
      });
    }

    var search = $('search');
    if (live.length < 2) { search.parentNode.hidden = true; }
    else {
      search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); applyFilters(); });
    }
  }

  /* ---------- load ---------- */
  function resolveGame(entry) {
    if (entry.status !== 'live') return Promise.resolve(entry);
    return fetch(entry.path + 'game.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('no manifest'); return r.json(); })
      .then(function (m) {
        var g = Object.assign({}, entry);
        if (m.title) g.title = m.title;
        if (m.tagline) g.tagline = m.tagline;
        if (m.summary) g.summary = m.summary;
        if (Array.isArray(m.tags)) g.tags = m.tags;
        if (Array.isArray(m.badges) && m.badges.length) g.badges = m.badges;
        else if (Array.isArray(m.features) && m.features.length) g.badges = m.features.map(nice);
        g.fallbackThumb = entry.thumbnail;
        g.thumb = m.thumbnail ? entry.path + m.thumbnail : entry.thumbnail;
        return g;
      })
      .catch(function () {
        var g = Object.assign({}, entry);
        g.thumb = entry.thumbnail;
        return g;
      });
  }

  function start() {
    fetch('games.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('games.json ' + r.status); return r.json(); })
      .then(function (cfg) {
        var site = cfg.site || {};
        if (site.name) { $('site-name').textContent = site.name; document.title = site.name + ' — Free Browser Games'; }
        if (site.tagline) $('hero-tagline').textContent = site.tagline;
        if (site.host) $('foot-host').textContent = site.host;
        var tip = safeUrl(site.tipUrl);
        if (tip) { var t = $('tip'); t.href = tip; t.textContent = site.tipLabel || 'Support the arcade'; t.hidden = false; }

        var games = Array.isArray(cfg.games) ? cfg.games : [];
        return Promise.all(games.map(resolveGame)).then(function (list) {
          var s = stats();
          grid.textContent = '';
          list.forEach(function (g) {
            grid.appendChild(g.status === 'live' ? liveCard(g, s[g.id]) : soonCard(g));
          });
          buildFilters(list);
          applyFilters();
        });
      })
      .catch(function () {
        grid.textContent = '';
        var p = el('p', 'loading', 'Could not load the games list. If you opened this file directly, serve the folder from a web server instead.');
        grid.appendChild(p);
      });
  }

  /* ---------- settings dialog ---------- */
  function setupSettings() {
    var dlg = $('settings');
    var openBtn = $('open-settings');
    if (!dlg || typeof dlg.showModal !== 'function') { openBtn.hidden = true; return; }
    var cur = ArcadeTheme.get();

    var list = $('scheme-list');
    SCHEMES.forEach(function (sc) {
      var label = el('label', 'scheme');
      var input = el('input');
      input.type = 'radio';
      input.name = 'scheme';
      input.value = sc.id;
      input.checked = cur.scheme === sc.id;
      input.addEventListener('change', function () { ArcadeTheme.set({ scheme: sc.id }); });
      var dot = el('span', 'dot');
      dot.style.background = 'linear-gradient(135deg,' + sc.bg + ' 50%,' + sc.accent + ' 50%)';
      label.append(input, dot, el('span', '', sc.name));
      list.appendChild(label);
    });

    var motion = $('opt-motion'), text = $('opt-text');
    motion.checked = cur.motion;
    text.checked = cur.text;
    motion.addEventListener('change', function () { ArcadeTheme.set({ motion: motion.checked }); });
    text.addEventListener('change', function () { ArcadeTheme.set({ text: text.checked }); });

    // tabs: click, and left/right arrows
    var tabs = [$('tab-look'), $('tab-access')];
    var panels = [$('panel-look'), $('panel-access')];
    function select(i) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
        panels[j].hidden = j !== i;
      });
      tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + tabs.length - 1) % tabs.length); }
      });
    });

    openBtn.addEventListener('click', function () { dlg.showModal(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  setupSettings();
  start();
})();
