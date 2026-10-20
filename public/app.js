/* Klubové kartičky – PWA frontend (bez build kroku). */
(() => {
  'use strict';

  const USER = window.APP_USER;
  const CSRF = document.querySelector('meta[name="csrf-token"]').content;
  const CACHE_KEY = `karty:${USER.id}:cards`;
  const app = document.getElementById('app');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PALETTE = ['#1F4D3A', '#2F5DA8', '#E4572E', '#E9C46A', '#D9CFF2', '#17171A', '#FFFFFF', '#8E3B5B', '#0F7C8A', '#F4A259'];
  const FORMATS = [
    ['EAN13', 'EAN-13'], ['EAN8', 'EAN-8'], ['UPC', 'UPC-A'], ['CODE128', 'Code 128'],
    ['CODE39', 'Code 39'], ['ITF', 'ITF'], ['QR', 'QR kód'],
  ];

  const state = {
    cards: readCache(),
    synced: false,      // dáta zo servera aspoň raz načítané
    loaded: false,      // pokus o načítanie skončil (aj neúspešne)
    query: '',
    draft: null,        // predvyplnené údaje zo skenovania
    cleanup: null,      // upratovanie aktuálnej obrazovky (kamera, wake lock)
    installPrompt: null,
  };

  /* ---------------- ikony ---------------- */
  const I = {
    gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    qr: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h3v-3"/></svg>',
    barcode: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M14 8v8M17 8v8"/></svg>',
    flash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    type: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M9 20h6M12 4v16"/></svg>',
    photo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    download: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    upload: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>',
    logout: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    trash: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/></svg>',
    share: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
    install: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
  };

  /* ---------------- pomocné ---------------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch { return []; }
  }
  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(state.cards)); } catch { /* plné úložisko – nevadí */ }
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  function setThemeColor(color) {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', color);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(hex, other, amount) {
    const a = hexToRgb(hex), b = hexToRgb(other);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('');
  }
  function isLight(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
  }
  /** Odvodí farby textu a čipu z farby karty (rovnako ako v návrhu). */
  function theme(bg) {
    bg = /^#[0-9a-f]{6}$/i.test(bg) ? bg : '#1F4D3A';
    if (isLight(bg)) {
      const white = bg.toUpperCase() === '#FFFFFF';
      return { bg, light: true, fg: white ? '#17171A' : mix(bg, '#000000', 0.82), chip: white ? '#EDECE8' : mix(bg, '#FFFFFF', 0.45), sub: white ? '#5C5B57' : mix(bg, '#000000', 0.6), pill: white ? '#EDECE8' : mix(bg, '#FFFFFF', 0.35) };
    }
    return { bg, light: false, fg: '#FFFFFF', chip: mix(bg, '#FFFFFF', 0.15), sub: mix(bg, '#FFFFFF', 0.75), pill: mix(bg, '#FFFFFF', 0.1) };
  }

  function initials(name) {
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function groupNumber(n) {
    const s = String(n);
    return /^\d+$/.test(s) ? s.replace(/(\d{4})(?=\d)/g, '$1 ') : s;
  }

  function plural(n) {
    if (n === 1) return '1 karta';
    if (n >= 2 && n <= 4) return `${n} karty`;
    return `${n} kariet`;
  }

  function relativeUse(iso) {
    if (!iso) return 'Zatiaľ nepoužitá';
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diff = Math.round((today - day) / 86400000);
    const time = d.toLocaleTimeString('sk-SK', { hour: 'numeric', minute: '2-digit' });
    if (diff <= 0) return `Dnes, ${time}`;
    if (diff === 1) return `Včera, ${time}`;
    if (diff < 7) return `Pred ${diff} dňami`;
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }
  function usePill(iso) {
    const r = relativeUse(iso);
    return r.startsWith('Dnes') ? 'Použitá dnes' : r.startsWith('Včera') ? 'Použitá včera' : r;
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'sk', { sensitivity: 'base' });
  const findCard = (id) => state.cards.find((c) => String(c.id) === String(id));

  /* ---------------- API ---------------- */
  async function api(method, url, body) {
    let res;
    try {
      res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF, 'X-Requested-With': 'XMLHttpRequest' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      const err = new Error('Ste offline – zmenu teraz nie je možné uložiť.');
      err.offline = true;
      throw err;
    }
    if (res.status === 401) { location.href = '/login'; throw new Error('Prihláste sa znova.'); }
    if (res.status === 419) { location.reload(); throw new Error('Relácia vypršala.'); }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Nastala chyba na serveri.');
      err.errors = data.errors || {};
      throw err;
    }
    return data;
  }

  async function sync() {
    try {
      const data = await api('GET', '/api/cards');
      state.cards = data.cards;
      state.synced = true;
      writeCache();
      return true;
    } catch (e) {
      if (e.offline && state.cards.length) toast('Ste offline – zobrazujú sa uložené karty.');
      else if (!e.offline) toast(e.message);
      return false;
    } finally {
      state.loaded = true;
    }
  }

  function upsert(card) {
    const i = state.cards.findIndex((c) => c.id === card.id);
    if (i >= 0) state.cards[i] = card; else state.cards.push(card);
    writeCache();
  }

  /* ---------------- čiarové kódy ---------------- */
  function barcodeSvg(number, format) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    let ok = true;
    try {
      window.JsBarcode(svg, number, { format, displayValue: false, margin: 0, height: 140, width: 3, background: 'transparent', valid: (v) => { ok = v; } });
    } catch { ok = false; }
    if (!ok) return null;
    const w = svg.getAttribute('width'), h = svg.getAttribute('height');
    svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.removeAttribute('style');
    svg.classList.add('bar');
    return svg;
  }

  function qrSvg(text) {
    const qr = window.qrcode(0, 'M');
    qr.addData(String(text));
    qr.make();
    const tpl = document.createElement('template');
    tpl.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
    const svg = tpl.content.firstElementChild;
    svg.classList.add('qr');
    return svg;
  }

  function codeIsValid(number, format) {
    if (!number) return false;
    if (format === 'QR') return true;
    return !!barcodeSvg(number, format);
  }

  function guessFormat(number) {
    let n = String(number).trim();
    if (/^[\d ]+$/.test(n)) n = n.replace(/ /g, '');
    if (/^\d{13}$/.test(n) && codeIsValid(n, 'EAN13')) return 'EAN13';
    if (/^\d{8}$/.test(n) && codeIsValid(n, 'EAN8')) return 'EAN8';
    if (/^\d{12}$/.test(n) && codeIsValid(n, 'UPC')) return 'UPC';
    if (/^[\x00-\x7F]+$/.test(n)) return 'CODE128';
    return 'QR';
  }

  function renderCode(el, card, asQR) {
    el.textContent = '';
    if (asQR || card.format === 'QR') { el.append(qrSvg(card.number)); return; }
    el.append(barcodeSvg(card.number, card.format) || barcodeSvg(card.number, 'CODE128') || qrSvg(card.number));
  }

  /* ---------------- router ---------------- */
  function route() {
    if (state.cleanup) { try { state.cleanup(); } catch { /* */ } state.cleanup = null; }
    closeSheet();
    const [, view, id] = (location.hash || '#/').slice(1).split('/');
    window.scrollTo(0, 0);
    const waiting = !state.loaded && !findCard(id);
    switch (view) {
      case 'card': if (waiting) return renderLoading(); return findCard(id) ? renderDetail(findCard(id)) : go('/', true);
      case 'add': return renderScan();
      case 'new': return renderForm(null);
      case 'edit': if (waiting) return renderLoading();
        return findCard(id) ? renderForm(findCard(id)) : go('/', true);
      default: return renderList();
    }
  }

  function go(path, replace = false) {
    const url = '#' + path;
    if (replace) { history.replaceState(null, '', url); route(); }
    else if (location.hash === url) route();
    else location.hash = url;
  }

  /* ---------------- zoznam ---------------- */
  function heroCard(card) {
    const t = theme(card.color);
    return `<a href="#/card/${card.id}" class="hero-card" style="background:${t.bg};color:${t.fg}">
      <div class="hero-top">
        <div style="min-width:0">
          <span class="hero-name">${esc(card.name)}</span>
          <span class="hero-kind" style="color:${t.sub};opacity:1">${esc(card.kind || 'Vernostná karta')}</span>
        </div>
        <div class="logo" style="color:${t.light ? t.fg : t.bg};background:${t.light ? t.chip : '#FFFFFF'}">${esc(initials(card.name))}</div>
      </div>
      <div class="hero-bottom">
        <span class="hero-number">${esc(groupNumber(card.number))}</span>
        ${card.last_used_at ? `<span class="pill" style="background:${t.pill}">${esc(usePill(card.last_used_at))}</span>` : ''}
      </div>
    </a>`;
  }

  function tile(card) {
    const t = theme(card.color);
    return `<a href="#/card/${card.id}" class="card-tile" style="background:${t.bg};color:${t.fg}">
      <div class="chip" style="background:${t.chip}">${esc(initials(card.name))}</div>
      <div style="min-width:0"><span class="tile-name">${esc(card.name)}</span><span class="tile-kind">${esc(card.kind || 'Vernostná karta')}</span></div>
    </a>`;
  }

  function renderList() {
    setThemeColor('#F3F2EE');
    if (!state.cards.length) return state.loaded ? renderEmpty() : renderLoading();

    app.innerHTML = `<div class="screen">
      <header class="list-header">
        <div class="title-row">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span class="count">${plural(state.cards.length)}</span>
            <h1 class="h1">Moje karty</h1>
          </div>
          <button class="icon-btn" id="settings" aria-label="Nastavenia">${I.gear}</button>
        </div>
        <label class="search">
          ${I.search}
          <span class="sr-only">Hľadať kartu</span>
          <input type="search" id="q" placeholder="Hľadať kartu" autocomplete="off" value="${esc(state.query)}">
        </label>
      </header>
      <div id="list-body"></div>
      <a href="#/add" class="fab" aria-label="Pridať kartu">${I.plus}Pridať</a>
    </div>`;

    const body = $('#list-body');
    const draw = () => {
      const q = state.query.trim().toLocaleLowerCase('sk');
      const all = [...state.cards].sort(byName);
      let html = '';
      if (q) {
        const hits = all.filter((c) => [c.name, c.kind, c.number].some((v) => String(v || '').toLocaleLowerCase('sk').includes(q)));
        html = `<section class="list-section" aria-label="Výsledky"><h2 class="section-title">Výsledky</h2>
          <div class="grid">${hits.map(tile).join('') || '<p class="no-results">Žiadna karta nezodpovedá hľadaniu.</p>'}</div></section>`;
      } else {
        const used = state.cards.filter((c) => c.last_used_at)
          .sort((a, b) => new Date(b.last_used_at) - new Date(a.last_used_at));
        const hero = used[0];
        if (hero) {
          html += `<section class="list-section" aria-label="Naposledy použitá"><h2 class="section-title">Naposledy použitá</h2>${heroCard(hero)}</section>`;
        }
        const rest = all.filter((c) => c !== hero);
        if (rest.length) {
          html += `<section class="list-section" aria-label="Všetky karty"><h2 class="section-title">${hero ? 'Ďalšie karty' : 'Všetky'}</h2>
            <div class="grid">${rest.map(tile).join('')}</div></section>`;
        } else {
          html += '<div class="grid"></div>';
        }
      }
      body.innerHTML = html;
    };
    draw();

    $('#q').addEventListener('input', (e) => { state.query = e.target.value; draw(); });
    $('#settings').addEventListener('click', openSettings);
  }

  function renderLoading() {
    app.innerHTML = `<div class="screen empty"><h1 class="h1">Moje karty</h1>
      <div class="empty-body"><p style="color:var(--muted);font-weight:600">Načítavam karty…</p></div></div>`;
  }

  function renderEmpty() {
    app.innerHTML = `<div class="screen empty">
      <div class="title-row">
        <h1 class="h1">Moje karty</h1>
        <button class="icon-btn" id="settings" aria-label="Nastavenia">${I.gear}</button>
      </div>
      <div class="empty-body">
        <div class="stack" aria-hidden="true">
          <div class="c1"></div><div class="c2"></div>
          <div class="c3"><div class="sq"></div><div class="bars"><i style="width:3px"></i><i style="width:6px"></i><i style="width:3px"></i><i style="width:3px;background:none"></i><i style="width:6px"></i><i style="width:3px"></i><i style="width:9px"></i><i style="width:3px;background:none"></i><i style="width:3px"></i><i style="width:6px"></i></div></div>
        </div>
        <div class="empty-text">
          <h2>Peňaženka bez plastu</h2>
          <p>Naskenujte svoje klubové kartičky a majte ich vždy pri sebe — aj offline.</p>
        </div>
      </div>
      <div class="actions">
        <a href="#/add" class="btn btn-dark">${I.barcode}Naskenovať prvú kartu</a>
        <button class="btn btn-ghost" id="restore">Obnoviť zo zálohy</button>
      </div>
    </div>`;
    $('#restore').addEventListener('click', importBackup);
    $('#settings').addEventListener('click', openSettings);
  }

  /* ---------------- detail ---------------- */
  function renderDetail(card) {
    const t = theme(card.color);
    let asQR = false;
    setThemeColor(t.bg);

    app.innerHTML = `<div class="screen detail ${t.light ? 'light-fg' : ''}" style="background:${t.bg};color:${t.fg}">
      <header class="detail-header">
        <a href="#/" class="icon-btn glass" aria-label="Späť na zoznam">${I.back}</a>
        <div class="right">
          <a href="#/edit/${card.id}" class="icon-btn glass" aria-label="Upraviť kartu">${I.edit}</a>
          <button class="icon-btn glass" id="more" aria-label="Ďalšie možnosti">${I.more}</button>
        </div>
      </header>
      <div class="detail-title">
        <div class="logo" style="color:${t.light ? t.fg : t.bg};background:${t.light ? t.chip : '#FFFFFF'}">${esc(initials(card.name))}</div>
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
          <h1>${esc(card.name)}</h1>
          <span class="sub" style="color:${t.sub};opacity:1">${esc(card.kind || 'Vernostná karta')}</span>
        </div>
      </div>
      <div class="code-box">
        <div class="code" id="code" role="img" aria-label="Kód karty ${esc(card.number)}"></div>
        <span class="code-number">${esc(groupNumber(card.number))}</span>
        <div class="code-hint">${I.sun}<span>Pre ľahšie skenovanie zvýšte jas obrazovky</span></div>
      </div>
      <div class="info-grid">
        <div class="info"><span class="k" style="color:${t.sub};opacity:1">Majiteľ karty</span><span class="v">${esc(card.holder || USER.name)}</span></div>
        <div class="info"><span class="k" style="color:${t.sub};opacity:1">Naposledy použitá</span><span class="v" id="last-used">${esc(relativeUse(card.last_used_at))}</span></div>
        ${card.note ? `<div class="info wide note"><span class="k" style="color:${t.sub};opacity:1">Poznámka</span><span class="v">${esc(card.note)}</span></div>` : ''}
      </div>
      <div class="detail-footer">
        <button class="btn btn-light" id="toggle"></button>
      </div>
    </div>`;

    const codeEl = $('#code');
    const toggle = $('#toggle');
    const drawCode = () => {
      renderCode(codeEl, card, asQR);
      const showingQR = asQR || card.format === 'QR';
      toggle.innerHTML = showingQR && card.format === 'QR' ? `${I.barcode}Zobraziť ako čiarový kód` : showingQR ? `${I.barcode}Zobraziť čiarový kód` : `${I.qr}Zobraziť ako QR kód`;
    };
    toggle.addEventListener('click', () => {
      if (card.format === 'QR') { card = { ...card, format: 'CODE128' }; asQR = false; }
      else asQR = !asQR;
      drawCode();
    });
    drawCode();

    $('#more').addEventListener('click', () => openSheet(`
      <div class="grabber"></div>
      <h2>${esc(card.name)}</h2>
      <button class="btn btn-light" data-act="share">${I.share}Zdieľať číslo karty</button>
      <button class="btn btn-light" data-act="edit">${I.edit}Upraviť kartu</button>
      <button class="btn btn-light" data-act="delete" style="color:var(--danger)">${I.trash}Vymazať kartu</button>
    `, {
      share: () => shareCard(card),
      edit: () => go(`/edit/${card.id}`),
      delete: () => deleteCard(card),
    }));

    // displej počas zobrazenia karty nezhasne
    let lock = null;
    const requestLock = async () => {
      try { lock = await navigator.wakeLock?.request('screen'); } catch { /* nepodporované */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') requestLock(); };
    requestLock();
    document.addEventListener('visibilitychange', onVisible);
    state.cleanup = () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };

    recordUse(card);
  }

  async function recordUse(card) {
    const last = card.last_used_at ? new Date(card.last_used_at) : null;
    if (last && Date.now() - last < 60_000) return; // opakované otvorenie v rámci minúty nerátame
    try {
      const data = await api('POST', `/api/cards/${card.id}/use`);
      upsert(data.card);
    } catch {
      upsert({ ...card, last_used_at: new Date().toISOString() });
    }
  }

  async function shareCard(card) {
    const text = `${card.name}: ${card.number}`;
    if (navigator.share) {
      try { await navigator.share({ title: card.name, text }); } catch { /* zrušené */ }
      return;
    }
    try { await navigator.clipboard.writeText(card.number); toast('Číslo karty je skopírované.'); }
    catch { toast(text); }
  }

  async function deleteCard(card) {
    if (!confirm(`Naozaj vymazať kartu „${card.name}“?`)) return;
    try {
      await api('DELETE', `/api/cards/${card.id}`);
      state.cards = state.cards.filter((c) => c.id !== card.id);
      writeCache();
      toast('Karta bola vymazaná.');
      go('/', true);
    } catch (e) { toast(e.message); }
  }

  /* ---------------- skenovanie ---------------- */
  const NATIVE_MAP = { ean_13: 'EAN13', ean_8: 'EAN8', upc_a: 'UPC', code_128: 'CODE128', code_39: 'CODE39', itf: 'ITF', qr_code: 'QR', data_matrix: 'QR', aztec: 'QR', pdf417: 'QR' };
  const ZXING_MAP = { EAN_13: 'EAN13', EAN_8: 'EAN8', UPC_A: 'UPC', CODE_128: 'CODE128', CODE_39: 'CODE39', ITF: 'ITF', QR_CODE: 'QR', DATA_MATRIX: 'QR', AZTEC: 'QR', PDF_417: 'QR' };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    });
  }

  /** Vráti funkciu (zdroj → {number, format} | null), natívnu alebo cez ZXing. */
  async function createDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const formats = Object.keys(NATIVE_MAP).filter((f) => supported.includes(f));
        if (formats.length) {
          const det = new window.BarcodeDetector({ formats });
          return async (source) => {
            const [hit] = await det.detect(source);
            return hit ? { number: hit.rawValue, format: NATIVE_MAP[hit.format] || 'CODE128' } : null;
          };
        }
      } catch { /* prejdeme na ZXing */ }
    }
    await loadScript('/vendor/zxing.min.js');
    const Z = window.ZXing;
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, Object.keys(ZXING_MAP).map((k) => Z.BarcodeFormat[k]));
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    const reader = new Z.MultiFormatReader();
    reader.setHints(hints);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return async (source) => {
      const w = source.videoWidth || source.naturalWidth || source.width;
      const h = source.videoHeight || source.naturalHeight || source.height;
      if (!w || !h) return null;
      const scale = Math.min(1, 1280 / Math.max(w, h));
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      try {
        const bitmap = new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(canvas)));
        const res = reader.decodeWithState(bitmap);
        return { number: res.getText(), format: ZXING_MAP[Z.BarcodeFormat[res.getBarcodeFormat()]] || 'CODE128' };
      } catch { return null; }
    };
  }

  function found(hit) {
    navigator.vibrate?.(60);
    const existing = state.cards.find((c) => c.number === hit.number);
    if (existing) {
      toast(`Túto kartu už máte: ${existing.name}`);
      return go(`/card/${existing.id}`, true);
    }
    state.draft = hit;
    go('/new', true);
  }

  function renderScan() {
    setThemeColor('#121214');
    app.innerHTML = `<div class="screen scan">
      <video id="video" playsinline muted hidden></video>
      <header class="scan-header">
        <a href="#/" class="icon-btn glass" aria-label="Zavrieť">${I.close}</a>
        <span class="title">Pridať kartu</span>
        <button class="icon-btn glass" id="torch" aria-label="Zapnúť blesk" aria-pressed="false" disabled style="opacity:.4">${I.flash}</button>
      </header>
      <div class="scan-body">
        <div class="viewfinder idle" id="vf">
          <div class="cr tl"></div><div class="cr tr"></div><div class="cr bl"></div><div class="cr br"></div>
          <div class="laser"></div>
        </div>
        <div class="scan-msg">
          <strong id="scan-title">Namierte na čiarový kód</strong>
          <span id="scan-sub">Funguje s EAN, Code 128 aj QR kódmi. Kartu rozpoznáme automaticky.</span>
        </div>
      </div>
      <div class="sheet">
        <div class="grabber"></div>
        <span class="section-title">Alebo</span>
        <button class="btn btn-light" id="manual">${I.type}Zadať číslo ručne</button>
        <button class="btn btn-light" id="photo">${I.photo}Načítať z fotky</button>
        <input type="file" id="file" accept="image/*" hidden>
      </div>
    </div>`;

    let stream = null, timer = null, stopped = false;
    const video = $('#video');
    const say = (title, sub) => { $('#scan-title').textContent = title; $('#scan-sub').textContent = sub; };

    $('#manual').addEventListener('click', () => { state.draft = null; go('/new'); });
    $('#photo').addEventListener('click', () => $('#file').click());
    $('#file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      try {
        await img.decode();
        const detect = await createDetector();
        const hit = await detect(img);
        if (hit) found(hit); else toast('Na fotke sme nenašli čiarový ani QR kód.');
      } catch { toast('Fotku sa nepodarilo načítať.'); }
      finally { URL.revokeObjectURL(img.src); e.target.value = ''; }
    });

    state.cleanup = () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return say('Kamera nie je dostupná', 'Tento prehliadač nepodporuje kameru. Zadajte číslo ručne alebo načítajte fotku.');
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      } catch (err) {
        const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        return say(denied ? 'Prístup ku kamere je zakázaný' : 'Kameru sa nepodarilo zapnúť',
          denied ? 'Povoľte kameru v nastaveniach prehliadača, alebo zadajte číslo ručne.' : 'Skúste to znova, alebo zadajte číslo ručne.');
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      video.srcObject = stream;
      video.hidden = false;
      await video.play().catch(() => {});
      $('#vf').classList.remove('idle');

      const track = stream.getVideoTracks()[0];
      const torchBtn = $('#torch');
      if (track.getCapabilities?.().torch) {
        torchBtn.disabled = false; torchBtn.style.opacity = '';
        let on = false;
        torchBtn.addEventListener('click', async () => {
          on = !on;
          try { await track.applyConstraints({ advanced: [{ torch: on }] }); } catch { on = false; }
          torchBtn.classList.toggle('on', on);
          torchBtn.setAttribute('aria-pressed', String(on));
        });
      }

      let detect;
      try { detect = await createDetector(); }
      catch { return say('Skener sa nepodarilo načítať', 'Zadajte číslo ručne.'); }

      const tick = async () => {
        if (stopped) return;
        let hit = null;
        if (video.readyState >= 2) { try { hit = await detect(video); } catch { /* ďalší snímok */ } }
        if (stopped) return;
        if (hit && hit.number) { state.cleanup(); state.cleanup = null; found(hit); return; }
        timer = setTimeout(tick, 180);
      };
      tick();
    })();
  }

  /* ---------------- formulár ---------------- */
  function renderForm(card) {
    setThemeColor('#F3F2EE');
    const editing = !!card;
    const draft = editing ? card : {
      name: '', kind: '', number: state.draft?.number || '', format: state.draft?.format || 'CODE128',
      color: PALETTE[state.cards.length % PALETTE.length], holder: '', note: '',
    };
    if (!editing && state.draft?.number && !state.draft.format) draft.format = guessFormat(draft.number);
    let formatTouched = editing || !!state.draft?.format;
    state.draft = null;
    const v = { ...draft };

    app.innerHTML = `<div class="screen form-screen">
      <header class="form-header">
        <a href="${editing ? `#/card/${card.id}` : '#/'}" class="icon-btn" aria-label="Späť">${I.back}</a>
        <h1>${editing ? 'Upraviť kartu' : 'Nová karta'}</h1>
      </header>
      <div class="preview-card" id="preview"></div>
      <form class="fields" id="form" novalidate>
        <label class="field"><span>Názov obchodu</span>
          <input name="name" maxlength="80" required autocomplete="off" placeholder="napr. Zelený Košík" value="${esc(v.name)}">
          <small class="err" data-err="name"></small></label>
        <label class="field"><span>Kategória</span>
          <input name="kind" maxlength="80" autocomplete="off" placeholder="napr. Potraviny · Vernostný klub" value="${esc(v.kind)}"></label>
        <label class="field"><span>Číslo karty</span>
          <input name="number" maxlength="255" required autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="8590 1234 5678 1" value="${esc(v.number)}">
          <small class="err" data-err="number"></small></label>
        <label class="field"><span>Typ kódu</span>
          <select name="format">${FORMATS.map(([k, l]) => `<option value="${k}" ${k === v.format ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <small class="err" data-err="format"></small></label>
        <div class="field"><span>Farba</span>
          <div class="swatches" id="swatches">
            ${PALETTE.map((c) => `<button type="button" class="swatch" data-color="${c}" style="background:${c}" aria-label="Farba ${c}" aria-pressed="${c.toUpperCase() === v.color.toUpperCase()}"></button>`).join('')}
            <label class="swatch custom" aria-label="Vlastná farba"><input type="color" id="custom-color" value="${esc(v.color)}"></label>
          </div></div>
        <label class="field"><span>Majiteľ karty</span>
          <input name="holder" maxlength="80" autocomplete="name" placeholder="${esc(USER.name)}" value="${esc(v.holder)}"></label>
        <label class="field"><span>Poznámka</span>
          <textarea name="note" maxlength="1000" placeholder="napr. Zľava 5 % každý prvý utorok v mesiaci.">${esc(v.note)}</textarea></label>
      </form>
      <div class="form-actions">
        <button class="btn btn-dark" id="save" type="submit" form="form">${editing ? 'Uložiť zmeny' : 'Uložiť kartu'}</button>
        ${editing ? `<button class="btn btn-danger" id="delete" type="button">${I.trash}Vymazať kartu</button>` : ''}
      </div>
    </div>`;

    const form = $('#form');
    const preview = $('#preview');
    const drawPreview = () => {
      preview.innerHTML = heroCard({ ...v, id: '', name: v.name || 'Názov obchodu', number: v.number || '0000 0000 0000', last_used_at: null })
        .replace('<a href="#/card/"', '<div aria-hidden="true"').replace(/<\/a>$/, '</div>');
    };
    drawPreview();

    form.addEventListener('input', (e) => {
      const { name, value } = e.target;
      if (!name) return;
      v[name] = value;
      if (name === 'format') formatTouched = true;
      if (name === 'number' && !formatTouched) {
        v.format = guessFormat(value);
        form.elements.format.value = v.format;
      }
      const err = form.querySelector(`[data-err="${name}"]`);
      if (err) err.textContent = '';
      drawPreview();
    });

    const pickColor = (c) => {
      v.color = c;
      form.querySelectorAll('.swatch[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color.toUpperCase() === c.toUpperCase())));
      drawPreview();
    };
    $('#swatches').addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (b) pickColor(b.dataset.color); });
    $('#custom-color').addEventListener('input', (e) => pickColor(e.target.value.toUpperCase()));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.querySelectorAll('.err').forEach((el) => { el.textContent = ''; });
      const payload = {
        name: v.name.trim(), kind: v.kind?.trim() || null, number: v.number.trim().replace(/\s+(?=\d)/g, ''),
        format: v.format, color: v.color.toUpperCase(), holder: v.holder?.trim() || null, note: v.note?.trim() || null,
      };
      // čísla zadané s medzerami (8590 1234 …) ukladáme bez medzier
      if (!/^[\d ]+$/.test(v.number.trim())) payload.number = v.number.trim();

      const errors = {};
      if (!payload.name) errors.name = 'Zadajte názov obchodu.';
      if (!payload.number) errors.number = 'Zadajte číslo karty.';
      else if (!codeIsValid(payload.number, payload.format)) errors.format = `Číslo nie je platný ${FORMATS.find(([k]) => k === payload.format)[1]}. Zvoľte iný typ kódu (napr. Code 128).`;
      if (Object.keys(errors).length) return showErrors(form, errors);

      const btn = $('#save');
      btn.disabled = true;
      try {
        const data = editing
          ? await api('PUT', `/api/cards/${card.id}`, payload)
          : await api('POST', '/api/cards', payload);
        upsert(data.card);
        toast(editing ? 'Zmeny sú uložené.' : 'Karta je pridaná.');
        go(`/card/${data.card.id}`, true);
      } catch (err) {
        if (err.errors && Object.keys(err.errors).length) {
          showErrors(form, Object.fromEntries(Object.entries(err.errors).map(([k, m]) => [k, m[0]])));
        } else toast(err.message);
      } finally { btn.disabled = false; }
    });

    if (editing) $('#delete').addEventListener('click', () => deleteCard(card));
    if (!editing && !v.number) form.elements.number.focus({ preventScroll: true });
  }

  function showErrors(form, errors) {
    let first = null;
    for (const [k, msg] of Object.entries(errors)) {
      const el = form.querySelector(`[data-err="${k}"]`);
      if (el) { el.textContent = msg; first ??= form.elements[k]; }
    }
    first?.focus();
  }

  /* ---------------- nastavenia, záloha ---------------- */
  let sheetEl = null;
  function openSheet(html, actions = {}) {
    closeSheet();
    sheetEl = document.createElement('div');
    sheetEl.className = 'overlay';
    sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    sheetEl.addEventListener('click', (e) => {
      if (e.target === sheetEl) return closeSheet();
      const btn = e.target.closest('[data-act]');
      if (btn && actions[btn.dataset.act]) { closeSheet(); actions[btn.dataset.act](); }
    });
    document.body.append(sheetEl);
    sheetEl.querySelector('button')?.focus();
  }
  function closeSheet() { sheetEl?.remove(); sheetEl = null; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function openSettings() {
    let install = '';
    if (!isStandalone()) {
      if (state.installPrompt) install = `<button class="btn btn-light" data-act="install">${I.install}Nainštalovať aplikáciu</button>`;
      else if (isIOS()) install = '<p class="small">Tip: v Safari ťuknite na <strong>Zdieľať</strong> → <strong>Pridať na plochu</strong> a kartičky budete mať ako aplikáciu.</p>';
    }
    openSheet(`
      <div class="grabber"></div>
      <h2>${esc(USER.name)}</h2>
      <p class="small">${esc(USER.email)} · ${plural(state.cards.length)}</p>
      ${install}
      <button class="btn btn-light" data-act="export">${I.download}Exportovať zálohu</button>
      <button class="btn btn-light" data-act="import">${I.upload}Obnoviť zo zálohy</button>
      <button class="btn btn-light" data-act="logout">${I.logout}Odhlásiť sa</button>
    `, {
      install: async () => { state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; },
      export: exportBackup,
      import: importBackup,
      logout,
    });
  }

  function exportBackup() {
    const data = {
      app: 'klubove-karticky',
      version: 1,
      exported_at: new Date().toISOString(),
      cards: state.cards.map(({ name, kind, number, format, color, holder, note, uses, last_used_at }) => ({ name, kind, number, format, color, holder, note, uses, last_used_at })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `karticky-zaloha-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      let cards;
      try {
        const json = JSON.parse(await file.text());
        cards = Array.isArray(json) ? json : json.cards;
        if (!Array.isArray(cards)) throw new Error();
      } catch { return toast('Súbor nie je platná záloha kartičiek.'); }
      try {
        const data = await api('POST', '/api/cards/import', { cards });
        state.cards = data.cards;
        state.synced = true;
        writeCache();
        toast(data.imported ? `Obnovené karty: ${data.imported}` : 'Všetky karty zo zálohy už máte.');
        go('/', true);
      } catch (e) { toast(e.message); }
    });
    input.click();
  }

  async function logout() {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* */ }
    try { await caches.delete('karty-pages'); } catch { /* */ }
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '/logout';
    f.innerHTML = `<input type="hidden" name="_token" value="${esc(CSRF)}">`;
    document.body.append(f);
    f.submit();
  }

  /* ---------------- štart ---------------- */
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', () => sync().then((ok) => { if (ok && !location.hash.match(/^#\/(new|edit|add)/)) route(); }));

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  route();
  sync().then(() => {
    // po synchronizácii prekreslíme, ale nerušíme rozpísaný formulár ani kameru
    if (!location.hash.match(/^#\/(new|edit|add)/)) route();
  });
})();
