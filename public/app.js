/* Kardo – PWA frontend (bez build kroku). */
(() => {
  'use strict';

  const USER = window.APP_USER;
  const CSRF = document.querySelector('meta[name="csrf-token"]').content;
  const CACHE_KEY = `karty:${USER.id}:cards`;
  const GEO_KEY = `karty:${USER.id}:geo`; // 'on' | 'off' | null (ešte sme sa nepýtali)
  const NEARBY_RADIUS = 200; // m – do tejto vzdialenosti od zapamätaného miesta ponúkneme kartu
  const app = document.getElementById('app');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PALETTE = ['#1F4D3A', '#2F5DA8', '#E4572E', '#E9C46A', '#D9CFF2', '#17171A', '#FFFFFF', '#8E3B5B', '#0F7C8A', '#F4A259'];

  /* Najpoužívanejšie obchody v ČR a SR: [názov, farba karty, logo v /logos/ (alebo null), ďalšie názvy] */
  const BRANDS = [
    // potraviny
    ['Lidl', '#0050AA', 'lidl.svg', ['lidl plus']],
    ['Kaufland', '#E10915', 'kaufland.svg', ['kaufland card']],
    ['Tesco', '#00539F', 'tesco.png', ['tesco clubcard', 'clubcard']],
    ['Billa', '#FFE500', 'billa.png', ['billa clubkarte', 'jo jo']],
    ['Albert', '#009FE3', 'albert.png', ['moj albert', 'muj albert']],
    ['Penny', '#CD1719', 'penny.png', ['penny market']],
    ['Globus', '#00873D', 'globus.png', []],
    ['COOP Jednota', '#E30613', 'coop-jednota.png', ['coop', 'jednota']],
    ['COOP', '#EE7203', 'coop.png', ['coop cz', 'coop centrum', 'coop druzstvo']],
    ['Terno', '#00A651', 'terno.png', ['terno real']],
    ['Fresh', '#7AB929', null, ['fresh plus', 'freshplus']],
    ['Žabka', '#00703C', 'zabka.png', []],
    ['Rohlík', '#3C9A3C', 'rohlik.png', ['rohlik cz', 'rohlik sk']],
    ['Košík', '#6F2C91', 'kosik.png', ['kosik cz']],
    ['Makro', '#0F2D69', 'makro.png', []],
    ['Metro', '#002D72', 'metro.png', ['metro cash carry']],
    // drogérie a kozmetika
    ['dm', '#002878', 'dm.png', ['dm drogerie', 'dm drogeria', 'moje dm', 'active beauty']],
    ['Rossmann', '#C8102E', 'rossmann.png', []],
    ['Teta', '#E6007E', 'teta.png', ['teta drogerie']],
    ['Douglas', '#9BDCD3', 'douglas.png', []],
    ['Notino', '#17171A', 'notino.png', []],
    ['Sephora', '#17171A', 'sephora.png', []],
    ['Marionnaud', '#17171A', 'marionnaud.png', []],
    ['Yves Rocher', '#0B4D33', 'yves-rocher.png', []],
    // lekárne
    ['Dr.Max', '#009A44', 'drmax.png', ['dr max', 'drmax', 'lekaren dr max', 'lekarna dr max']],
    ['BENU', '#00A651', 'benu.png', ['lekaren benu', 'lekarna benu']],
    ['Pilulka', '#0B5F4A', 'pilulka.png', []],
    // dom a záhrada
    ['IKEA', '#0058A3', 'ikea.svg', ['ikea family']],
    ['Hornbach', '#F27C00', 'hornbach.png', []],
    ['OBI', '#F26F21', 'obi.png', []],
    ['Bauhaus', '#E30613', 'bauhaus.png', []],
    ['Mountfield', '#D0021B', 'mountfield.png', []],
    ['SIKO', '#FFDD00', 'siko.png', []],
    ['JYSK', '#143C8C', 'jysk.png', []],
    ['Möbelix', '#36A9D4', 'mobelix.png', ['mobelix']],
    ['XXXLutz', '#E3000F', 'xxxlutz.png', ['xxx lutz', 'lutz']],
    ['Tedi', '#FFED00', 'tedi.png', []],
    ['Action', '#1A5AD7', 'action.png', []],
    ['Pepco', '#4A4FE0', 'pepco.png', []],
    ['Flying Tiger', '#17171A', 'flying-tiger.png', ['flying tiger copenhagen']],
    // šport, móda, obuv
    ['Decathlon', '#3643BA', 'decathlon.png', []],
    ['Sportisimo', '#0055A5', 'sportisimo.png', []],
    ['Intersport', '#00398B', 'intersport.png', []],
    ['Hervis', '#E3000F', 'hervis.png', []],
    ['H&M', '#E50010', 'hm.png', ['hm', 'h m']],
    ['Reserved', '#17171A', 'reserved.png', []],
    ['Cropp', '#17171A', 'cropp.png', []],
    ['Sinsay', '#22252A', null, []],
    ['C&A', '#0E4FA0', 'ca.png', ['c a', 'ca']],
    ['Lindex', '#C8102E', 'lindex.png', []],
    ['New Yorker', '#17171A', 'new-yorker.png', ['newyorker']],
    ['KiK', '#E3000F', 'kik.png', []],
    ['Takko', '#FFE000', null, ['takko fashion']],
    ['CCC', '#17171A', 'ccc.png', []],
    ['Deichmann', '#00843D', 'deichmann.png', []],
    // elektro a e-shopy
    ['Alza', '#0A80D6', 'alza.png', ['alza cz', 'alza sk', 'alzaplus']],
    ['Datart', '#E3000F', null, []],
    ['Electro World', '#002A6C', 'electro-world.png', ['electroworld']],
    ['NAY', '#00A0E3', 'nay.png', ['nay elektrodom']],
    ['OKAY', '#8DB43F', 'okay.png', []],
    ['Planeo', '#1446A0', 'planeo.png', ['planeo elektro']],
    ['Allegro', '#FF5A00', 'allegro.png', ['mall', 'mall cz', 'mall sk']],
    ['Tchibo', '#002E5D', 'tchibo.png', []],
    // čerpacie stanice
    ['Shell', '#FFD500', 'shell.png', ['shell clubsmart', 'clubsmart']],
    ['OMV', '#00D25F', 'omv.png', ['omv mytankstelle']],
    ['MOL', '#DA291C', 'mol.png', ['mol move']],
    ['Slovnaft', '#006F3C', null, ['slovnaft bonus']],
    ['Orlen', '#E30613', 'orlen.png', ['orlen benzina', 'benzina']],
    // jedlo a káva
    ["McDonald's", '#DA291C', 'mcdonalds.png', ['mcdonalds', 'mcdonald']],
    ['KFC', '#A3080C', 'kfc.png', []],
    ['Starbucks', '#00704A', 'starbucks.png', []],
    ['Costa Coffee', '#6D1F37', null, ['costa']],
    // knihy
    ['Martinus', '#D41F31', 'martinus.png', []],
    ['Panta Rhei', '#002F5F', 'panta-rhei.png', ['pantarhei']],
    ['Luxor', '#17171A', 'luxor.png', ['neoluxor']],
    ['Knihy Dobrovský', '#17171A', 'dobrovsky.png', ['dobrovsky']],
    // zvieratá
    ['Pet Center', '#00B140', 'pet-center.png', ['petcenter']],
    ['Super zoo', '#FFE000', 'super-zoo.png', ['superzoo']],
  ].map(([name, color, logo, aliases]) => ({ name, color, logo: logo && `/logos/${logo}`, keys: [name, ...aliases].map(normalize) }));

  const state = {
    cards: readCache(),
    synced: false,      // dáta zo servera aspoň raz načítané
    loaded: false,      // pokus o načítanie skončil (aj neúspešne)
    query: '',
    draft: null,        // predvyplnené údaje zo skenovania
    cleanup: null,      // upratovanie aktuálnej obrazovky (kamera, wake lock)
    installPrompt: null,
    position: null,     // posledná zistená poloha {lat, lng, accuracy, at}
  };

  /* ---------------- ikony ---------------- */
  const BRAND = '<div class="brand"><img src="/icons/logo.svg" alt="" width="26" height="26"><span class="wordmark">kardo<span>.</span></span></div>';

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
    paste: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
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
    // iOS (najmä nainštalovaná appka) farbí lištu so stavom podľa pozadia stránky, nie podľa theme-color
    document.documentElement.style.background = color;
    document.body.style.background = color;
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

  /** „Môj Albert!“ → „moj albert“ (bez diakritiky a interpunkcie). */
  function normalize(s) {
    return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  /** Obchod podľa začiatku názvu karty, celé slová, najdlhšia zhoda (napr. „Tesco Clubcard“ → Tesco, „Zelený Košík“ nie). */
  function findBrand(name) {
    const n = normalize(name);
    if (!n) return null;
    const padded = ` ${n} `, compact = n.replace(/ /g, '');
    let best = null, bestLen = 0;
    for (const b of BRANDS) {
      for (const k of b.keys) {
        const hit = padded.startsWith(` ${k} `) || (k.length >= 4 && compact === k.replace(/ /g, ''));
        if (hit && k.length > bestLen) { best = b; bestLen = k.length; }
      }
    }
    return best;
  }

  /** Logo obchodu, ak ho poznáme; inak iniciály. Ak sa obrázok nenačíta, ostanú iniciály. */
  function logoInner(name) {
    const brand = findBrand(name);
    const text = `<span>${esc(initials(name))}</span>`;
    if (!brand?.logo) return { cls: '', html: text };
    return { cls: ' has-img', html: text + `<img src="${brand.logo}" alt="" onerror="this.parentNode.classList.remove('has-img');this.remove()">` };
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

  /* ---------------- poloha ---------------- */
  function geoSetting() {
    try { return localStorage.getItem(GEO_KEY); } catch { return null; }
  }
  function setGeoSetting(value) {
    try { localStorage.setItem(GEO_KEY, value); } catch { /* */ }
  }
  const geoEnabled = () => 'geolocation' in navigator && geoSetting() === 'on';

  /** Aktuálna poloha alebo null (vypnuté, zamietnuté, nedostupné). Čerstvú polohu nezisťuje znova. */
  function getPosition(maxAge = 60_000) {
    if (!geoEnabled()) return Promise.resolve(null);
    if (state.position && Date.now() - state.position.at < maxAge) return Promise.resolve(state.position);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          state.position = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() };
          resolve(state.position);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setGeoSetting('off');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: maxAge },
      );
    });
  }

  /** Vzdialenosť dvoch bodov v metroch (haversine). */
  function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  /** Karta, ktorá bola na tomto mieste otvorená naposledy (alebo null). */
  function nearbyCard(pos) {
    if (!pos) return null;
    const radius = NEARBY_RADIUS + Math.min(pos.accuracy || 0, 100);
    let best = null;
    for (const card of state.cards) {
      for (const place of card.places || []) {
        if (distance(pos, place) > radius) continue;
        const at = new Date(place.last_used_at).getTime();
        if (!best || at > best.at) best = { card, at };
      }
    }
    return best?.card || null;
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
    const lg = logoInner(card.name);
    return `<a href="#/card/${card.id}" class="hero-card" style="background:${t.bg};color:${t.fg}">
      <div class="hero-top">
        <div style="min-width:0">
          <span class="hero-name">${esc(card.name)}</span>
          <span class="hero-kind" style="color:${t.sub};opacity:1">${esc(card.kind || 'Vernostná karta')}</span>
        </div>
        <div class="logo${lg.cls}" style="color:${t.light ? t.fg : t.bg};background:${t.light ? t.chip : '#FFFFFF'}">${lg.html}</div>
      </div>
      <div class="hero-bottom">
        <span class="hero-number">${esc(groupNumber(card.number))}</span>
        ${card.last_used_at ? `<span class="pill" style="background:${t.pill}">${esc(usePill(card.last_used_at))}</span>` : ''}
      </div>
    </a>`;
  }

  function tile(card) {
    const t = theme(card.color);
    const lg = logoInner(card.name);
    return `<a href="#/card/${card.id}" class="card-tile" style="background:${t.bg};color:${t.fg}">
      <div class="chip${lg.cls}" style="background:${t.chip}">${lg.html}</div>
      <div style="min-width:0"><span class="tile-name">${esc(card.name)}</span><span class="tile-kind">${esc(card.kind || 'Vernostná karta')}</span></div>
    </a>`;
  }

  function renderList() {
    setThemeColor('#F3F2EE');
    if (!state.cards.length) return state.loaded ? renderEmpty() : renderLoading();

    app.innerHTML = `<div class="screen">
      <header class="list-header">
        ${BRAND}
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
        const near = nearbyCard(state.position);
        const used = state.cards.filter((c) => c.last_used_at)
          .sort((a, b) => new Date(b.last_used_at) - new Date(a.last_used_at));
        const hero = near || used[0];
        if (near) {
          html += `<section class="list-section" aria-label="Tu nablízku"><h2 class="section-title section-near">${I.pin}Tu nablízku</h2>${heroCard(near)}</section>`;
        } else if (hero) {
          html += `<section class="list-section" aria-label="Naposledy použitá"><h2 class="section-title">Naposledy použitá</h2>${heroCard(hero)}</section>`;
        }
        if (!near && showGeoHint()) {
          html += `<section class="list-section"><div class="geo-hint">
            <div class="geo-text">${I.pin}<span>Ponúknem vám správnu kartu podľa toho, kde práve ste.</span></div>
            <div class="geo-actions"><button class="btn btn-dark" id="geo-on">Zapnúť</button><button class="btn btn-ghost" id="geo-no">Teraz nie</button></div>
          </div></section>`;
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
      $('#geo-on')?.addEventListener('click', () => enableGeo());
      $('#geo-no')?.addEventListener('click', () => { setGeoSetting('off'); draw(); });
    };
    draw();

    // podľa polohy ponúkneme kartu otvorenú naposledy na tomto mieste
    const enableGeo = async () => {
      setGeoSetting('on');
      const pos = await getPosition(0);
      if (!pos) {
        toast(geoSetting() === 'off' ? 'Prístup k polohe je zakázaný – povoľte ho v nastaveniach prehliadača.' : 'Polohu sa nepodarilo zistiť.');
      } else if (!nearbyCard(pos)) {
        toast('Hotovo. Keď kartu otvoríte v obchode, nabudúce vám ju tam ponúknem.');
      }
      if (body.isConnected) draw();
    };
    if (geoEnabled()) {
      const before = nearbyCard(state.position);
      getPosition().then((pos) => {
        if (pos && body.isConnected && nearbyCard(pos) !== before) draw();
      });
    }

    $('#q').addEventListener('input', (e) => { state.query = e.target.value; draw(); });
    $('#settings').addEventListener('click', openSettings);
  }

  /** Ponuku na zapnutie polohy ukážeme, kým sa používateľ nerozhodne. */
  function showGeoHint() {
    return 'geolocation' in navigator && geoSetting() === null && state.cards.length >= 2;
  }

  function renderLoading() {
    app.innerHTML = `<div class="screen empty">${BRAND}<h1 class="h1">Moje karty</h1>
      <div class="empty-body"><p style="color:var(--muted);font-weight:600">Načítavam karty…</p></div></div>`;
  }

  function renderEmpty() {
    app.innerHTML = `<div class="screen empty">
      ${BRAND}
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
        <button class="btn btn-ghost" id="paste-empty">${I.paste}Vložiť screenshot karty</button>
        <button class="btn btn-ghost" id="restore">Obnoviť zo zálohy</button>
      </div>
    </div>`;
    $('#restore').addEventListener('click', importBackup);
    $('#paste-empty').addEventListener('click', pasteFromClipboard);
    $('#settings').addEventListener('click', openSettings);
  }

  /* ---------------- detail ---------------- */
  function renderDetail(card) {
    const t = theme(card.color);
    const lg = logoInner(card.name);
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
        <div class="logo${lg.cls}" style="color:${t.light ? t.fg : t.bg};background:${t.light ? t.chip : '#FFFFFF'}">${lg.html}</div>
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
    const pos = await getPosition(30_000);
    // poloha s horšou presnosťou než ~300 m by miesto skôr pokazila
    const body = pos && pos.accuracy <= 300 ? { lat: +pos.lat.toFixed(6), lng: +pos.lng.toFixed(6) } : undefined;
    try {
      const data = await api('POST', `/api/cards/${card.id}/use`, body);
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
    // crop = [x, y, w, h] v pomere 0–1; still = statický obrázok (skúsime aj druhý binarizér)
    return async (source, { maxSide = 1280, crop = [0, 0, 1, 1], still = false } = {}) => {
      const w = source.videoWidth || source.naturalWidth || source.width;
      const h = source.videoHeight || source.naturalHeight || source.height;
      if (!w || !h) return null;
      const [cx, cy, cw, ch] = [crop[0] * w, crop[1] * h, crop[2] * w, crop[3] * h];
      const scale = Math.min(1, maxSide / Math.max(cw, ch));
      canvas.width = Math.round(cw * scale); canvas.height = Math.round(ch * scale);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
      const binarizers = still ? [Z.HybridBinarizer, Z.GlobalHistogramBinarizer] : [Z.HybridBinarizer];
      for (const B of binarizers) {
        try {
          const bitmap = new Z.BinaryBitmap(new B(new Z.HTMLCanvasElementLuminanceSource(canvas)));
          const res = reader.decodeWithState(bitmap);
          return { number: res.getText(), format: ZXING_MAP[Z.BarcodeFormat[res.getBarcodeFormat()]] || 'CODE128' };
        } catch { /* ďalší pokus */ }
      }
      return null;
    };
  }

  /** Kód z fotky / screenshotu. Screenshoty z iných apiek majú kód často malý, preto skúšame aj výrezy. */
  async function detectInImage(blob) {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    try {
      await img.decode();
      const detect = await createDetector();
      const attempts = [
        {},
        { maxSide: 2400 },
        // horizontálne pásy (karta býva v hornej/strednej časti screenshotu)
        ...[0, 0.2, 0.4, 0.6].map((y) => ({ maxSide: 1600, crop: [0, y, 1, 0.4] })),
        { maxSide: 1600, crop: [0.1, 0.25, 0.8, 0.5] },
      ];
      for (const opts of attempts) {
        const hit = await detect(img, { ...opts, still: true }).catch(() => null);
        if (hit && hit.number) return hit;
      }
      return null;
    } finally { URL.revokeObjectURL(img.src); }
  }

  let importing = false;
  async function addFromImage(blob) {
    if (importing) return;
    importing = true;
    toast('Hľadám kód na obrázku…');
    try {
      const hit = await detectInImage(blob);
      if (hit) found(hit); else toast('Na obrázku sme nenašli čiarový ani QR kód.');
    } catch { toast('Obrázok sa nepodarilo načítať.'); }
    finally { importing = false; }
  }

  /** Obrázok zo schránky cez tlačidlo (iOS/Android sa spýtajú „Vložiť“). */
  async function pasteFromClipboard() {
    if (!navigator.clipboard?.read) return toast('Prehliadač nepodporuje čítanie schránky. Použite „Načítať z fotky“.');
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) return addFromImage(await item.getType(type));
      }
      toast('V schránke nie je obrázok. Skopírujte screenshot a skúste znova.');
    } catch { toast('Schránku sa nepodarilo prečítať.'); }
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
        <button class="btn btn-light" id="photo">${I.photo}Načítať z fotky / screenshotu</button>
        <button class="btn btn-light" id="paste">${I.paste}Vložiť obrázok zo schránky</button>
        <input type="file" id="file" accept="image/*" hidden>
      </div>
    </div>`;

    let stream = null, timer = null, stopped = false;
    const video = $('#video');
    const say = (title, sub) => { $('#scan-title').textContent = title; $('#scan-sub').textContent = sub; };

    $('#manual').addEventListener('click', () => { state.draft = null; go('/new'); });
    $('#photo').addEventListener('click', () => $('#file').click());
    $('#paste').addEventListener('click', pasteFromClipboard);
    $('#file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await addFromImage(file);
      e.target.value = '';
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
      name: '', number: state.draft?.number || '', format: state.draft?.format || 'CODE128',
      color: PALETTE[state.cards.length % PALETTE.length],
    };
    // typ kódu sa nevyberá – berie sa zo skenu, inak sa odhadne z čísla
    if (!editing && state.draft?.number && !state.draft.format) draft.format = guessFormat(draft.number);
    state.draft = null;
    const v = { ...draft };
    // farbu podľa obchodu dosadíme, kým si ju používateľ sám nezvolí (pri úprave len pri zmene obchodu)
    let colorPicked = false;
    const originalBrand = editing ? findBrand(card.name) : null;

    app.innerHTML = `<div class="screen form-screen">
      <header class="form-header">
        <a href="${editing ? `#/card/${card.id}` : '#/'}" class="icon-btn" aria-label="Späť">${I.back}</a>
        <h1>${editing ? 'Upraviť kartu' : 'Nová karta'}</h1>
      </header>
      <div class="preview-card" id="preview"></div>
      <form class="fields" id="form" novalidate>
        <label class="field"><span>Názov obchodu</span>
          <input name="name" maxlength="80" required autocomplete="off" list="brand-list" placeholder="napr. Lidl, Billa, dm…" value="${esc(v.name)}">
          <datalist id="brand-list">${BRANDS.map((b) => `<option value="${esc(b.name)}">`).join('')}</datalist>
          <small class="err" data-err="name"></small></label>
        <label class="field"><span>Číslo karty</span>
          <input name="number" maxlength="255" required autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="8590 1234 5678 1" value="${esc(v.number)}">
          <small class="err" data-err="number"></small></label>
        <div class="field"><span>Farba</span>
          <div class="swatches" id="swatches">
            ${PALETTE.map((c) => `<button type="button" class="swatch" data-color="${c}" style="background:${c}" aria-label="Farba ${c}" aria-pressed="${c.toUpperCase() === v.color.toUpperCase()}"></button>`).join('')}
            <label class="swatch custom" aria-label="Vlastná farba"><input type="color" id="custom-color" value="${esc(v.color)}"></label>
          </div></div>
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
      if (name === 'number') v.format = guessFormat(value);
      const err = form.querySelector(`[data-err="${name}"]`);
      if (err) err.textContent = '';
      const brand = name === 'name' && findBrand(value);
      if (brand && brand !== originalBrand && !colorPicked) pickColor(brand.color, false);
      else drawPreview();
    });

    function pickColor(c, byUser = true) {
      v.color = c;
      if (byUser) colorPicked = true;
      $('#custom-color').value = c.toLowerCase();
      form.querySelectorAll('.swatch[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color.toUpperCase() === c.toUpperCase())));
      drawPreview();
    }
    $('#swatches').addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (b) pickColor(b.dataset.color); });
    $('#custom-color').addEventListener('input', (e) => pickColor(e.target.value.toUpperCase()));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.querySelectorAll('.err').forEach((el) => { el.textContent = ''; });
      const payload = {
        name: v.name.trim(), number: v.number.trim().replace(/\s+(?=\d)/g, ''),
        format: v.format, color: v.color.toUpperCase(),
      };
      // čísla zadané s medzerami (8590 1234 …) ukladáme bez medzier
      if (!/^[\d ]+$/.test(v.number.trim())) payload.number = v.number.trim();

      const errors = {};
      if (!payload.name) errors.name = 'Zadajte názov obchodu.';
      if (!payload.number) errors.number = 'Zadajte číslo karty.';
      else if (!codeIsValid(payload.number, payload.format)) payload.format = guessFormat(payload.number);
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

  const isAndroid = () => /android/i.test(navigator.userAgent);

  /* ---------------- inštalácia (PWA) ---------------- */
  const INSTALL_KEY = 'karty:install-offered';
  const INSTALL_AGAIN = 3 * 24 * 3600 * 1000; // po zatvorení ponúkneme znova o 3 dni

  function installSteps() {
    if (isIOS()) {
      const safari = !/crios|fxios|edgios|opios/i.test(navigator.userAgent);
      return `<ol class="steps">
        <li>Ťuknite na <strong>Zdieľať</strong> <span class="ico">${I.share}</span> ${safari ? 'v spodnej lište Safari' : 'v paneli s adresou'}.</li>
        <li>Posuňte ponuku nižšie a vyberte <strong>Pridať na plochu</strong>.</li>
        <li>Potvrďte ťuknutím na <strong>Pridať</strong>.</li>
      </ol>`;
    }
    return `<ol class="steps">
      <li>Otvorte ponuku prehliadača <span class="ico">${I.more}</span>.</li>
      <li>Vyberte <strong>Inštalovať aplikáciu</strong> alebo <strong>Pridať na plochu</strong>.</li>
      <li>Potvrďte inštaláciu.</li>
    </ol>`;
  }

  function openInstall() {
    const native = !!state.installPrompt;
    openSheet(`
      <div class="grabber"></div>
      <div class="install-head">
        <img src="/icons/icon-192.png" width="56" height="56" alt="">
        <div>
          <h2>Nainštalujte si Kardo</h2>
          <p class="small">Kartičky budete mať na ploche ako aplikáciu – otvoríte ich jedným ťuknutím a fungujú aj offline.</p>
        </div>
      </div>
      ${native ? `<button class="btn btn-dark" data-act="install">${I.install}Nainštalovať aplikáciu</button>` : installSteps()}
      <button class="btn btn-ghost" data-act="later">Teraz nie</button>
    `, {
      install: async () => {
        const p = state.installPrompt;
        state.installPrompt = null;
        p.prompt();
        await p.userChoice;
      },
      later: () => {},
    });
  }

  function offerInstall() {
    if (isStandalone() || sheetEl) return;
    if ((location.hash || '#/').replace(/\/$/, '') !== '#') return; // len na zozname kariet, nie pri skenovaní/formulári
    // Chrome/Edge ponúkne vlastnú inštaláciu cez beforeinstallprompt (ak nepríde, appka už je nainštalovaná);
    // ručný návod ukážeme len na iOS a na Androide v prehliadačoch bez tejto udalosti (napr. Firefox).
    const manual = isIOS() || (isAndroid() && !('onbeforeinstallprompt' in window));
    if (!state.installPrompt && !manual) return;
    try {
      if (Date.now() - Number(localStorage.getItem(INSTALL_KEY) || 0) < INSTALL_AGAIN) return;
      localStorage.setItem(INSTALL_KEY, String(Date.now()));
    } catch { /* */ }
    openInstall();
  }

  function openSettings() {
    const install = isStandalone() ? '' : `<button class="btn btn-light" data-act="install">${I.install}Nainštalovať aplikáciu</button>`;
    openSheet(`
      <div class="grabber"></div>
      <h2>${esc(USER.name)}</h2>
      <p class="small">${esc(USER.email)} · ${plural(state.cards.length)}</p>
      ${install}
      ${'geolocation' in navigator ? `<button class="btn btn-light" data-act="geo">${I.pin}${geoEnabled() ? 'Vypnúť návrh karty podľa polohy' : 'Ponúkať kartu podľa polohy'}</button>` : ''}
      <button class="btn btn-light" data-act="shareApp">${I.share}Zdieľať aplikáciu</button>
      <button class="btn btn-light" data-act="export">${I.download}Exportovať zálohu</button>
      <button class="btn btn-light" data-act="import">${I.upload}Obnoviť zo zálohy</button>
      <button class="btn btn-light" data-act="logout">${I.logout}Odhlásiť sa</button>
    `, {
      install: () => setTimeout(openInstall),
      geo: async () => {
        if (geoEnabled()) {
          setGeoSetting('off');
          state.position = null;
          toast('Návrh karty podľa polohy je vypnutý.');
        } else {
          setGeoSetting('on');
          const pos = await getPosition(0);
          toast(pos ? 'Karty vám budem ponúkať podľa polohy.' : 'Prístup k polohe je zakázaný – povoľte ho v nastaveniach prehliadača.');
        }
        if (!location.hash.match(/^#\/(card|new|edit|add)/)) route();
      },
      shareApp: () => setTimeout(openShareApp),
      export: exportBackup,
      import: importBackup,
      logout,
    });
  }

  /* ---------------- zdieľanie aplikácie ---------------- */
  const APP_URL = `${location.origin}/`;
  const SHARE_TEXT = 'Kardo – všetky vernostné a klubové kartičky v mobile. Vyskúšaj:';

  function openShareApp() {
    const native = !!navigator.share;
    openSheet(`
      <div class="grabber"></div>
      <div class="share-app">
        <h2>Zdieľať Kardo</h2>
        <p class="small">Nech si kamarát naskenuje QR kód fotoaparátom, alebo mu pošlite odkaz.</p>
        <div class="share-qr"></div>
        <div class="share-url">${esc(APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>
        <button class="btn btn-share" data-act="send">${native ? `${I.share}Poslať odkaz` : `${I.paste}Kopírovať odkaz`}</button>
      </div>
    `, {
      send: async () => {
        if (native) {
          try { await navigator.share({ title: 'Kardo', text: SHARE_TEXT, url: APP_URL }); } catch { /* zrušené */ }
          return;
        }
        try { await navigator.clipboard.writeText(APP_URL); toast('Odkaz je skopírovaný.'); }
        catch { toast(APP_URL); }
      },
    });
    try { $('.share-qr', sheetEl).append(qrSvg(APP_URL)); } catch { /* knižnica sa nenačítala */ }
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
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; setTimeout(offerInstall, 1500); });
  window.addEventListener('appinstalled', () => { state.installPrompt = null; closeSheet(); toast('Kardo je nainštalované na ploche.'); });
  setTimeout(offerInstall, 2500);
  window.addEventListener('hashchange', route);
  // Ctrl/Cmd+V so screenshotom kdekoľvek okrem formulára pridá kartu
  document.addEventListener('paste', (e) => {
    if (location.hash.match(/^#\/(new|edit)/) || e.target.closest?.('input, textarea')) return;
    const file = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'))?.getAsFile();
    if (!file) return;
    e.preventDefault();
    addFromImage(file);
  });
  window.addEventListener('online', () => sync().then((ok) => { if (ok && !location.hash.match(/^#\/(new|edit|add)/)) route(); }));

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  route();
  sync().then(() => {
    // po synchronizácii prekreslíme, ale nerušíme rozpísaný formulár ani kameru
    if (!location.hash.match(/^#\/(new|edit|add)/)) route();
  });
})();
