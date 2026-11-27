/* Senso Bar app: screens, actions and start-up. */
(function () {
  'use strict';
  const C = window.SensoCore, I = window.SensoI18n, ART = window.SensoArt, SEED = window.SensoSeed;
  const t = I.t;
  const native = window.sensoNative || null; // set by the Windows app
  const FS = window.SensoFiles;
  const QS = new URLSearchParams(location.search);
  const DEMO = QS.has('demo') && !!window.SensoDemo;
  const QLANG = ['en', 'fa'].includes(QS.get('lang')) ? QS.get('lang') : null;

  let db = null, S = null;
  const U = {
    tab: 'sell', anim: true, cat: 'all', q: '', cart: [], lastAdded: null,
    ord: blankOrder(), rep: { kind: 'day', anchor: C.dayKey() }, ordersDay: null, ordersQ: '',
    money: 'exp', closeDay: C.dayKey(), stockQ: '', stockF: 'all', custQ: '', custF: 'all', plan: [],
    sheet: null, edit: null, unlocked: false, pendingTab: null,
  };
  function blankOrder() { return { service: 'dine', table: '', note: '', dType: 'amt', dVal: '', customer: null, pointsUse: '', pay: 'cash', received: '', parkedId: null }; }

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cur = () => S.settings.currency || '؋';
  const M = n => `${I.n(n)} ${cur()}`;
  const cal = () => S.settings.calendar;
  const today = () => C.dayKey();
  const ingName = i => (i ? (I.lang === 'fa' ? (i.nameFa || i.name) : (i.name || i.nameFa)) : '');
  const itemName = m => (m ? (I.lang === 'fa' ? (m.fa || m.en) : (m.en || m.fa)) : '');
  const catName = k => I.pick(C.cat(S, k));
  const payName = id => (id === 'credit' ? t('credit_short') : I.pick(S.settings.payMethods.find(p => p.id === id)) || id);
  const expName = id => I.pick(S.settings.expenseCats.find(c => c.id === id)) || id;
  const look = m => C.cat(S, m.cat).look || 'glass';
  const art = m => ART.draw(look(m), m.color);
  const pic = m => (m.photo ? `<img src="${esc(m.photo)}" alt="" loading="lazy" decoding="async" draggable="false">` : art(m));
  const buzz = () => { try { if (navigator.vibrate) navigator.vibrate(12); } catch (_) { /* no vibration */ } };
  const unitName = u => (I.lang === 'fa' ? ({ pcs: 'دانه', kg: 'کیلو', g: 'گرام', L: 'لیتر', ml: 'ملی‌لیتر', bunch: 'دسته', pack: 'بسته' }[u] || u) : u);
  const step = u => (['kg', 'L'].includes(u) ? 0.5 : ['g', 'ml'].includes(u) ? 50 : 1);
  function fmtDay(k, withWeekday = true) {
    const p = C.parts(k, cal());
    const wd = C.WEEKDAYS[I.lang][C.fromKey(k).getDay()];
    return I.d(`${withWeekday ? wd + ' ' : ''}${p.d} ${C.monthName(p.m, cal(), I.lang)} ${p.y}`);
  }
  function shortDay(k) {
    if (k === today()) return t('today');
    if (k === C.addDays(today(), -1)) return t('yesterday');
    const p = C.parts(k, cal());
    return I.d(`${C.WEEKDAYS[I.lang][C.fromKey(k).getDay()]} ${p.d} ${C.monthName(p.m, cal(), I.lang)}`);
  }
  const fmtTime = at => { const d = new Date(at); return I.d(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`); };
  function periodLabel(kind, anchor) {
    const p = C.parts(anchor, cal());
    if (kind === 'day') return fmtDay(anchor);
    if (kind === 'month') return I.d(`${C.monthName(p.m, cal(), I.lang)} ${p.y}`);
    return I.d(String(p.y));
  }
  let toastT;
  function toast(m, bad) { const el = $('#toast'); el.textContent = m; el.className = bad ? 'bad' : ''; el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 3000); }
  function armed(el, fn) {
    if (el.dataset.armed) { fn(); return; }
    el.dataset.armed = '1'; const o = el.innerHTML; el.textContent = t('confirm_again'); el.classList.add('armed');
    setTimeout(() => { if (el.isConnected && el.dataset.armed) { delete el.dataset.armed; el.innerHTML = o; el.classList.remove('armed'); } }, 3200);
  }
  const ICON = {
    sell: '<path d="M4 8h16l-1.4 10.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    money: '<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.6"/><path d="M6 10v.01M18 15v.01"/>',
    customers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5A6.5 6.5 0 0 1 21.5 20"/>',
    menu: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h4"/>',
    stock: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    buy: '<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8a1.5 1.5 0 0 0 1.5-1.1L20 8H6.2"/>',
    make: '<path d="M6 3v6a3 3 0 0 0 6 0V3M9 3v18M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M4 6h3M17 6h3M4 18h9M17 18h3M4 12h3"/><circle cx="12" cy="6" r="2"/><circle cx="15" cy="18" r="2"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
    backup: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 10v6m-3-3 3 3 3-3"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    folder: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    upload: '<path d="M12 21V9m-5 5 5-5 5 5M4 3h16"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    camera: '<path d="M4 8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  };
  // Persian zero looks like a dot, so Dari text uses a comma between parts instead of a middle dot.
  const dots = h => (I.lang === 'fa' ? h.replace(/ · /g, '، ') : h);
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const NAV = [
    ['sell', 'nav_sell', true], ['orders', 'nav_orders', true], ['reports', 'nav_reports', true, true], ['money', 'nav_money', true, true],
    ['customers', 'nav_customers'], ['menu', 'nav_menu'], ['stock', 'nav_stock'], ['buy', 'nav_buy'], ['make', 'nav_make'], ['backup', 'nav_backup'], ['settings', 'nav_settings', false, true],
  ];
  const narrow = () => matchMedia('(max-width:860px)').matches;
  const isLocked = tab => !!S.settings.ownerPin && !U.unlocked && NAV.some(n => n[0] === tab && n[3]);

  /* ---------- saving ---------- */
  async function commit(changes, ok) {
    if (!changes || !changes.length) return true;
    C.apply(S, changes);
    try { if (db) await C.save(db, changes); } catch (e) { console.error(e); toast(t('storage_fail'), true); }
    render();
    if (ok) toast(ok);
    scheduleBackup();
    return true;
  }
  const setSettings = (patch, ok) => commit([{ store: 'settings', put: { ...S.settings, ...patch, shop: { ...S.settings.shop, ...(patch.shop || {}) } } }], ok);
  let backupT;
  const lastBackup = () => { try { return +localStorage.getItem('senso-last-backup') || 0; } catch (_) { return 0; } };
  const markBackup = () => { try { localStorage.setItem('senso-last-backup', String(Date.now())); } catch (_) { /* ignore */ } };
  const backupName = () => `senso-backup-${today()}.json`;
  function scheduleBackup() {
    if (DEMO || FS.kind === 'web' || S.settings.autoBackup === false) return;
    clearTimeout(backupT);
    backupT = setTimeout(async () => {
      try {
        await FS.save('Backups', backupName(), C.exportJSON(S), 'application/json'); markBackup();
        const old = (await FS.list('Backups')).map(f => f.name).filter(n => /^senso-backup-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().reverse().slice(30);
        for (const n of old) await FS.remove('Backups', n).catch(() => {});
        if (U.tab === 'backup') render();
      } catch (e) { console.warn('auto backup', e); }
    }, 5000);
  }

  /* ---------- render ---------- */
  function applyLook() {
    const set = S.settings;
    I.setup(set.lang, set.digits);
    document.documentElement.lang = set.lang === 'fa' ? 'fa' : 'en';
    document.documentElement.dir = set.lang === 'fa' ? 'rtl' : 'ltr';
    if (set.theme === 'dark' || set.theme === 'light') document.documentElement.dataset.theme = set.theme; else delete document.documentElement.dataset.theme;
    document.title = set.shop.name;
  }
  function render() {
    if (!S) return;
    const a = document.activeElement, aid = a && a.id, sel = a && typeof a.selectionStart === 'number' ? a.selectionStart : null;
    const low = C.lowIngs(S).length;
    $('#nav').innerHTML = NAV.map(([k, lbl, primary, locked]) => `<button class="nv${primary ? '' : ' secondary'}" data-act="tab" data-id="${k}" ${U.tab === k ? 'aria-current="page"' : ''}>${svg(k)}${t(lbl)}${k === 'buy' && low ? `<span class="badge">${I.n(low)}</span>` : ''}${locked && isLocked(k) ? `<svg class="lock" viewBox="0 0 24 24">${ICON.lock}</svg>` : ''}</button>`).join('')
      + `<button class="nv more${['customers', 'menu', 'stock', 'buy', 'make', 'backup', 'settings'].includes(U.tab) ? '" aria-current="page' : ''}" data-act="more">${svg('more')}${t('nav_more')}${low ? `<span class="badge">${I.n(low)}</span>` : ''}</button>`;
    const langLbl = I.lang === 'fa' ? 'EN' : 'دری';
    $('#lang-btn').textContent = langLbl; $('#lang-btn-m').textContent = langLbl;
    $('#mname').textContent = I.lang === 'fa' ? (S.settings.shop.fa || S.settings.shop.name) : S.settings.shop.name;
    const main = $('#main');
    main.classList.toggle('view', U.anim);
    main.innerHTML = dots(demoBanner() + (V[U.tab] || V.sell)());
    if (U.anim) { countUp(main); }
    U.anim = false;
    const n = U.cart.reduce((s, c) => s + c.qty, 0);
    $('#orderbar').hidden = !(U.tab === 'sell' && n);
    $('#ob-n').textContent = t('items_n', { n: I.n(n), c: n }); $('#ob-go').textContent = t('review_order');
    if (n) $('#ob-t').textContent = M(safePrice().total);
    if (U.sheet === 'ticket') { if (!U.cart.length) closeSheet(); else $('#sheet .sheet').innerHTML = dots(`<div class="sh"><h2>${t('new_order')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>${ticketBody()}`); }
    if (aid) { const el = document.getElementById(aid); if (el && el !== a) { el.focus(); if (sel != null) try { el.setSelectionRange(sel, sel); } catch (_) { /* not text */ } } }
  }
  function countUp(root) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 700;
      const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = I.n(to * e) + suffix; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }
  const V = {};
  function demoBanner() {
    if (!DEMO) return '';
    const real = location.pathname + (QLANG ? '?lang=' + QLANG : '');
    return `<div class="note demo-note"><p><b>${t('demo_title')}</b> ${t('demo_text')}</p><div class="row"><button class="btn sm" data-act="demoReset">${t('demo_reset')}</button><a class="btn sm go" href="${esc(real)}">${t('demo_real')}</a></div></div>`;
  }
  const empty = (h, b) => `<div class="empty"><b>${h}</b>${b || ''}</div>`;
  const chip = (act, id, on, label, color) => `<button class="chip" data-act="${act}" data-id="${esc(id)}" aria-pressed="${on}" ${color ? `style="--c:${esc(color)}"` : ''}>${color ? '<i></i>' : ''}${label}</button>`;
  const seg = (act, cur_, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="${act}" data-id="${esc(v)}" aria-pressed="${cur_ === v}">${l}</button>`).join('')}</div>`;

  /* ---------- SELL ---------- */
  function safePrice() {
    try { return C.price(S, { cart: U.cart, discountType: U.ord.dType, discountValue: U.ord.dVal, customer: U.ord.customer, pointsUse: U.ord.pointsUse }); }
    catch (_) { return { sub: 0, discount: 0, pointsValue: 0, tax: 0, total: 0, lines: [] }; }
  }
  const nextNo = () => S.orders.filter(o => o.day === today()).reduce((x, o) => Math.max(x, o.no), 0) + 1;
  function tile(m) {
    const c = U.cart.find(x => x.id === m.id); const cm = C.canMake(m, S);
    const flags = (cm === 0 ? `<span class="pill bad">${t('out')}</span>` : cm !== null && cm <= 5 ? `<span class="pill warn">${t('left', { n: I.n(cm) })}</span>` : '') + (m.verify ? `<span class="pill info">${t('check')}</span>` : '');
    return `<button class="tile${c ? ' in' : ''}${cm === 0 ? ' off' : ''}" style="--c:${esc(m.color)}" data-act="add" data-id="${esc(m.id)}" aria-label="${esc(itemName(m))}, ${M(m.price)}">
      ${c ? `<span class="qty">${I.n(c.qty)}</span>` : ''}<span class="art${m.photo ? ' photo' : ''}">${pic(m)}</span><span class="tfa" lang="fa">${esc(m.fa)}</span><span class="ten" lang="en">${esc(m.en)}</span>
      <span class="tfoot"><span class="price">${I.n(m.price)}<small>${esc(cur())}</small></span>${flags}</span></button>`;
  }
  function ticketBody() {
    if (!U.cart.length) {
      return `<div class="blank"><b>${t('no_items')}</b>${t('tap_to_start')}</div>${heldChips()}`;
    }
    const p = safePrice(); const o = U.ord;
    const cust = o.customer && C.byId(S.customers, o.customer);
    const pays = [...S.settings.payMethods.map(x => [x.id, I.pick(x)]), ['credit', t('credit_short')]];
    const change = o.pay === 'cash' && C.num(o.received) > 0 ? C.num(o.received) - p.total : null;
    return `<div class="tk-lines">${U.cart.map(c => {
      const m = C.byId(S.menu, c.id) || { fa: '?', en: '?', price: 0 };
      return `<div class="tl${U.lastAdded === c.id ? ' new' : ''}"><div class="n"><b lang="fa">${esc(m.fa)}</b><small lang="en">${esc(m.en)} · ${I.n(m.price)} ${t('each')}</small></div><span></span>
        <div class="step"><button data-act="dec" data-id="${esc(c.id)}" aria-label="−">−</button><span>${I.n(c.qty)}</span><button data-act="inc" data-id="${esc(c.id)}" aria-label="+">+</button></div>
        <div class="amt">${I.n(m.price * c.qty)}</div></div>`;
    }).join('')}</div>
    <div class="fields">
      ${seg('svc', o.service, [['dine', t('dine')], ['take', t('take')], ['delivery', t('delivery')]])}
      <div class="two"><label class="f">${t('table')}<input id="o-table" data-bind="table" value="${esc(o.table)}" autocomplete="off"></label>
        <div class="f"><span>${t('discount')}</span><span style="display:flex;gap:4px"><input id="o-disc" data-bind="dVal" inputmode="decimal" value="${esc(o.dVal)}" placeholder="${I.d(0)}" style="flex:1;min-width:0" aria-label="${t('discount')}"><button class="btn sm" data-act="dtype" style="min-width:44px;background:#fff;color:#24211C;border-color:#D8D0C1" aria-label="% / ${esc(cur())}">${o.dType === 'pct' ? '%' : esc(cur())}</button></span></div></div>
      <button class="btn sm" data-act="pickCustomer" style="justify-content:space-between;background:#fff;color:#24211C;border-color:#D8D0C1;width:100%">
        <span>${cust ? esc(cust.name) : t('no_customer')}</span><span style="opacity:.6">${cust ? `${t('has_points', { n: I.n(cust.points || 0) })}${cust.balance > 0 ? ` · ${t('owes')} ${I.n(cust.balance)}` : ''}` : t('pick_customer')}</span></button>
      ${cust && cust.points > 0 ? `<label class="f">${t('points_use')} (${I.n(cust.points)})<input id="o-pts" data-bind="pointsUse" inputmode="numeric" value="${esc(o.pointsUse)}" placeholder="${I.d(0)}"></label>` : ''}
      <div class="pays">${pays.map(([id, l]) => `<button data-act="pay" data-id="${id}" aria-pressed="${o.pay === id}">${esc(l)}</button>`).join('')}</div>
      ${o.pay === 'cash' ? `<label class="f">${t('received')}<input id="o-rec" data-bind="received" inputmode="decimal" value="${esc(o.received)}" placeholder="${I.n(p.total)}"></label><div class="quick">${quickCash(p.total).map(v => `<button data-act="cashQuick" data-id="${v}">${v === p.total ? t('exact_amt') : I.n(v)}</button>`).join('')}</div>` : ''}
      <label class="f">${t('note')}<input id="o-note" data-bind="note" value="${esc(o.note)}" autocomplete="off"></label>
    </div>
    <div class="tk-tot">
      ${p.discount || p.pointsValue || p.tax ? `<div><span>${t('subtotal')}</span><span>${I.n(p.sub)}</span></div>` : ''}
      ${p.discount ? `<div><span>${t('discount')}</span><span>−${I.n(p.discount)}</span></div>` : ''}
      ${p.pointsValue ? `<div><span>${t('points_disc')}</span><span>−${I.n(p.pointsValue)}</span></div>` : ''}
      ${p.tax ? `<div><span>${t('tax')}</span><span>${I.n(p.tax)}</span></div>` : ''}
      <div class="grand"><span>${t('total')}</span><span class="num" id="tk-total">${M(p.total)}</span></div>
      <div class="chg" id="tk-change" ${change === null ? 'hidden' : ''}><span>${t('change')}</span><span>${change === null ? '' : M(change)}</span></div>
    </div>
    <button class="charge" data-act="checkout">${t('complete')} <span class="num">${M(p.total)}</span></button>
    <div class="tk-actions"><button class="linkbtn" data-act="hold">${t('hold')}</button><button class="linkbtn" data-act="clearcart">${t('clear_order')}</button></div>`;
  }
  function quickCash(total) {
    const out = [total];
    for (const step_ of [50, 100, 500, 1000]) { const v = Math.ceil(total / step_) * step_; if (v > total && !out.includes(v)) out.push(v); }
    return out.slice(0, 4);
  }
  function heldChips() {
    if (!S.parked.length) return '';
    return `<div style="margin-top:14px;font-size:13px;opacity:.7">${t('held_orders')}</div><div class="held">${S.parked.slice().sort((a, b) => a.at - b.at).map(p => `<button data-act="resume" data-id="${esc(p.id)}" style="color:#5c554a;border-color:#D8D0C1">${esc(p.ord.table || fmtTime(p.at))} · ${I.n(p.cart.reduce((s, c) => s + c.qty, 0))}</button>`).join('')}</div>`;
  }
  V.sell = () => {
    if (!S.menu.length) return `<div class="head"><h1>${t('nav_sell')}</h1></div>${empty(t('none_yet'), '')}`;
    const live = S.orders.filter(o => o.day === today() && o.status !== 'void');
    const q = U.q.trim().toLowerCase();
    const act = S.menu.filter(m => m.active && (U.cat === 'all' || m.cat === U.cat) && (!q || (m.en || '').toLowerCase().includes(q) || (m.fa || '').includes(U.q.trim())));
    const cats = S.cats.slice().sort((a, b) => a.ord - b.ord);
    let body = '';
    for (const c of cats) {
      const its = act.filter(m => m.cat === c.key).sort((a, b) => a.ord - b.ord);
      if (its.length) body += `<section class="band"><div class="band-h"><span class="fa-name" lang="fa">${esc(c.fa || c.en)}</span><span>${esc(c.en)}</span></div><div class="tiles">${its.map(tile).join('')}</div></section>`;
    }
    if (!body) body = `<div style="margin-top:20px">${empty(t('nothing_matches'), '')}</div>`;
    const usedCats = cats.filter(c => S.menu.some(m => m.active && m.cat === c.key));
    const catColor = k => (S.menu.find(m => m.cat === k) || {}).color;
    return `<div class="sell"><div>
      <div class="hello"><div><p class="greet">${greeting()}</p><h1>${fmtDay(today())}</h1></div>
        <div class="today-pills"><span class="tp"><b class="num">${I.n(live.length)}</b>${t('orders')}</span><span class="tp gold"><b class="num">${I.n(live.reduce((s, o) => s + o.total, 0))}</b>${esc(cur())}</span>${S.parked.length ? `<span class="tp"><b class="num">${I.n(S.parked.length)}</b>${t('held_orders')}</span>` : ''}</div></div>
      ${popularRow(live)}
      <div class="sell-top"><div class="find">${svg('search')}<input id="find" data-bind="q" placeholder="${t('find_item')}" value="${esc(U.q)}" autocomplete="off"></div></div>
      <div class="chips">${chip('cat', 'all', U.cat === 'all', t('everything'))}${usedCats.map(c => chip('cat', c.key, U.cat === c.key, esc(I.pick(c)), catColor(c.key))).join('')}</div>
      ${body}</div>
      ${narrow() ? '' : `<div class="ticket-col"><div class="ticket" id="ticket"><div class="tk-h"><h2>${t('new_order')}</h2><span class="no">#${I.n(nextNo())}</span></div>${ticketBody()}</div></div>`}</div>`;
  };
  function greeting() {
    const h = new Date().getHours();
    return t(h < 5 ? 'good_night' : h < 12 ? 'good_morning' : h < 17 ? 'good_afternoon' : h < 21 ? 'good_evening' : 'good_night');
  }
  function popularRow(live) {
    const by = {}; live.forEach(o => o.items.forEach(i => (by[i.id] = (by[i.id] || 0) + i.qty)));
    let ids = Object.entries(by).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    if (ids.length < 4) { const all = {}; S.orders.slice(-400).forEach(o => o.status !== 'void' && o.items.forEach(i => (all[i.id] = (all[i.id] || 0) + i.qty))); ids = [...new Set([...ids, ...Object.entries(all).sort((a, b) => b[1] - a[1]).map(x => x[0])])]; }
    const items = ids.map(id => C.byId(S.menu, id)).filter(m => m && m.active).slice(0, 8);
    if (!items.length) return '';
    return `<div class="popular"><span class="pl">${t('popular')}</span><div class="chips">${items.map(m => `<button class="pchip" data-act="add" data-id="${esc(m.id)}" style="--c:${esc(m.color)}"><span class="pimg">${pic(m)}</span>${esc(itemName(m))}<b class="num">${I.n(m.price)}</b></button>`).join('')}</div></div>`;
  }
  function fly(fromEl, color) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !fromEl) return;
    const target = $('#ticket') && $('#ticket').offsetParent ? $('#ticket') : $('#orderbar button');
    if (!target) return;
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dot = document.createElement('div'); dot.className = 'flyer'; dot.style.background = color; const src = fromEl.querySelector('img'); if (src) { dot.style.background = `url("${src.getAttribute('src')}") center/contain no-repeat`; dot.classList.add('pic'); }
    const x0 = a.left + a.width / 2 - 9, y0 = a.top + 50, x1 = b.left + b.width / 2 - 9, y1 = b.top + 40;
    dot.style.left = x0 + 'px'; dot.style.top = y0 + 'px'; document.body.appendChild(dot);
    const dx = x1 - x0, dy = y1 - y0;
    dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(1.25)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: 0.2 },
    ], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => {
      dot.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
    };
  }

  /* ---------- ORDERS ---------- */
  V.orders = () => {
    const day = U.ordersDay || today();
    const days = [...new Set([today(), ...S.orders.map(o => o.day)])].sort().reverse().slice(0, 14);
    if (!days.includes(day)) days.push(day);
    const q = C.ascii(U.ordersQ.trim()).toLowerCase();
    let list = S.orders.filter(o => o.day === day).slice().reverse();
    if (q) list = list.filter(o => String(o.no) === q || (o.table || '').toLowerCase().includes(q) || o.items.some(i => (i.en || '').toLowerCase().includes(q) || (i.fa || '').includes(U.ordersQ.trim())));
    const live = list.filter(o => o.status !== 'void');
    return `<div class="head"><div><h1>${t('orders_title')}</h1><p class="sub">${fmtDay(day)} · ${t('orders_n', { n: I.n(live.length), c: live.length })} · ${M(live.reduce((s, o) => s + o.total, 0))}</p></div>
      <input type="date" id="o-day" data-change="ordersDay" value="${day}" style="max-width:190px" aria-label="${t('date')}"></div>
      <div class="chips">${days.map(k => chip('oday', k, k === day, shortDay(k))).join('')}</div>
      <div class="tools" style="margin-top:6px"><input id="o-q" data-bind="ordersQ" placeholder="${t('find_order')}" value="${esc(U.ordersQ)}" autocomplete="off"></div>
      ${list.length ? `<div class="list">${list.map(orderRow).join('')}</div>` : empty(t('no_orders_day'), t('no_orders_hint'))}`;
  };
  function orderRow(o) {
    const cust = o.customer && C.byId(S.customers, o.customer);
    return `<button class="orow${o.status === 'void' ? ' void' : ''}" data-act="order" data-id="${esc(o.id)}"><span class="no">${I.n(o.no)}</span>
      <span class="what"><div>${esc(o.items.map(i => `${I.n(i.qty)} ${itemName(i)}`).join('، '))}</div>
      <small>${fmtTime(o.at)} · ${t(o.service === 'take' ? 'take' : o.service === 'delivery' ? 'delivery' : 'dine')}${o.table ? ` · ${esc(o.table)}` : ''}${cust ? ` · ${esc(cust.name)}` : ''}${o.status === 'void' ? ` · ${t('voided')}` : ''}</small></span>
      <span class="tot">${I.n(o.total)}<small>${esc(payName(o.pay))}</small></span></button>`;
  }

  /* ---------- REPORTS ---------- */
  V.reports = () => {
    const { kind, anchor } = U.rep;
    const per = C.period(kind, anchor, cal());
    const r = C.report(S, per.days);
    const prevAnchor = C.shift(kind, anchor, cal(), -1);
    const pr = C.report(S, C.period(kind, prevAnchor, cal()).days);
    const delta = (a, b) => { if (!b) return ''; const d = Math.round((a - b) / b * 100); return `<small class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${I.n(Math.abs(d))}% ${t('vs_prev')}</small>`; };
    const k = (lbl, val, extra, i, cls) => `<div class="kpi ${cls || ''}" style="--i:${i}"><span>${lbl}</span><b data-count="${Math.round(val)}" data-suffix=" ${esc(cur())}">${M(val)}</b>${extra || ''}</div>`;
    const kn = (lbl, val, extra, i) => `<div class="kpi" style="--i:${i}"><span>${lbl}</span><b data-count="${Math.round(val)}">${I.n(val)}</b>${extra || ''}</div>`;
    // chart buckets
    let buckets = [];
    if (kind === 'day') {
      const hs = Object.keys(r.hours).map(Number); const h0 = Math.min(8, ...hs), h1 = Math.max(22, ...hs);
      for (let h = h0; h <= h1; h++) buckets.push({ l: I.d(h), v: r.hours[h] || 0, tip: `${I.d(h)}:00` });
    } else if (kind === 'month') {
      buckets = per.days.map(d => ({ l: I.d(C.parts(d, cal()).d), v: r.byDay[d] || 0, tip: shortDay(d) }));
    } else {
      for (let m = 1; m <= 12; m++) {
        const ds = new Set(C.monthDays(per.y, m, cal()));
        let v = 0; for (const [d, x] of Object.entries(r.byDay)) if (ds.has(d)) v += x;
        buckets.push({ l: C.monthName(m, cal(), I.lang).slice(0, I.lang === 'fa' ? 5 : 3), v, tip: C.monthName(m, cal(), I.lang) });
      }
    }
    const mx = Math.max(1, ...buckets.map(b => b.v));
    const chartTitle = kind === 'day' ? t('sales_by_hour') : kind === 'month' ? t('sales_by_day') : t('sales_by_month');
    const bars = (obj, nameFn, colorFn) => {
      const arr = Object.entries(obj).sort((a, b) => b[1] - a[1]); const m = Math.max(1, ...arr.map(x => x[1]));
      return arr.length ? `<div class="bars">${arr.map(([id, v], i) => `<div class="r"><span>${esc(nameFn(id))}</span><span class="muted num">${M(v)}</span><div class="track"><i style="width:${Math.max(3, v / m * 100)}%;background:${colorFn ? colorFn(id, i) : 'var(--stool)'};animation-delay:${i * 50}ms"></i></div></div>`).join('')}</div>` : `<p class="muted" style="margin-top:8px">${t('none_yet')}</p>`;
    };
    const top = r.top.slice(0, 8); const tmx = Math.max(1, ...top.map(x => x.qty));
    const isToday = kind === 'day' ? anchor === today() : C.period(kind, today(), cal()).days.includes(anchor);
    const noCosts = r.net > 0 && r.cogs === 0;
    return `<div class="head"><div><h1>${t('reports_title')}</h1></div>
      <div class="row"><button class="btn sm" data-act="repCsv">${svg('download')}${t('export_csv')}</button><button class="btn sm" data-act="repPrint">${svg('print')}${t('print_report')}</button></div></div>
      <div class="period">${seg('repKind', kind, [['day', t('r_day')], ['month', t('r_month')], ['year', t('r_year')]])}
        <span class="grow"></span>
        <button class="icon-btn" data-act="repPrev" aria-label="‹">${svg(I.lang === 'fa' ? 'next' : 'prev')}</button>
        <span class="lbl">${periodLabel(kind, anchor)}</span>
        <button class="icon-btn" data-act="repNext" aria-label="›">${svg(I.lang === 'fa' ? 'prev' : 'next')}</button>
        ${isToday ? '' : `<button class="btn sm" data-act="repNow">${kind === 'day' ? t('today') : kind === 'month' ? t('this_month') : t('r_year')}</button>`}</div>
      <div class="kpis">
        ${k(t('net_sales'), r.net, delta(r.net, pr.net), 0, 'hero')}
        ${kn(t('orders'), r.orders, delta(r.orders, pr.orders), 1)}
        ${k(t('avg_order'), r.avg, '', 2)}
        ${k(t('profit'), r.profit, delta(r.profit, pr.profit), 3, r.profit < 0 ? 'neg' : '')}
        ${k(t('expenses'), r.expenses, '', 4)}
        ${k(t('withdrawals'), r.withdrawals, '', 5)}
      </div>
      ${noCosts ? `<div class="note"><p>${t('cost_hint')}</p><button class="btn sm" data-act="tab" data-id="stock">${t('nav_stock')}</button></div>` : ''}
      <div class="grid2">
        <div class="card"><h3>${chartTitle}</h3><div class="scroll-x"><div class="chart" style="--n:${buckets.length};min-width:${buckets.length * 14}px">${buckets.map((b, i) => `<div><span class="tip">${esc(b.tip)}: ${M(b.v)}</span><i class="${b.v ? '' : 'zero'}" style="height:${b.v / mx * 100}%;--i:${i}"></i><small>${esc(b.l)}</small></div>`).join('')}</div></div></div>
        <div class="card"><h3>${t('money_summary')}</h3><p class="hint">${t('profit_hint')}</p><div class="ledger">
          <div><span>${t('gross_sales')}</span><span class="num">${M(r.gross)}</span></div>
          <div><span>− ${t('discounts')}</span><span class="num">${M(r.discounts)}</span></div>
          ${r.tax ? `<div><span>− ${t('tax')}</span><span class="num">${M(r.tax)}</span></div>` : ''}
          <div><span>− ${t('cogs')}</span><span class="num">${M(r.cogs)}</span></div>
          <div><span>− ${t('expenses')}</span><span class="num">${M(r.expenses)}</span></div>
          ${r.waste ? `<div><span>− ${t('waste')}</span><span class="num">${M(r.waste)}</span></div>` : ''}
          <div class="tot ${r.profit < 0 ? 'neg' : ''}"><span>${t('profit')}</span><span class="num">${M(r.profit)}</span></div>
          <div style="margin-top:8px"><span class="muted">${t('withdrawals')}</span><span class="num muted">${M(r.withdrawals)}</span></div>
          <div><span class="muted">${t('credit_sales')}</span><span class="num muted">${M(r.creditSales)}</span></div>
          <div><span class="muted">${t('credit_collected')}</span><span class="num muted">${M(r.creditCollected)}</span></div>
          <div><span class="muted">${t('voids')}</span><span class="num muted">${I.n(r.voidCount)} · ${M(r.voidValue)}</span></div>
          <div><span class="muted">${t('items_sold')}</span><span class="num muted">${I.n(r.items)}</span></div>
        </div></div>
      </div>
      <div class="grid3" style="margin-top:18px">
        <div class="card"><h3>${t('best_sellers')}</h3>${top.length ? `<div class="bars">${top.map((x, i) => { const m = C.byId(S.menu, x.id); return `<div class="r"><span>${esc(itemName(x))}</span><span class="muted num">${I.n(x.qty)} ${t('sold')} · ${I.n(x.amount)}</span><div class="track"><i style="width:${Math.max(4, x.qty / tmx * 100)}%;background:${esc(m ? m.color : '#A99F92')};animation-delay:${i * 50}ms"></i></div></div>`; }).join('')}</div>` : `<p class="muted" style="margin-top:8px">${t('none_yet')}</p>`}</div>
        <div class="card"><h3>${t('by_payment')}</h3>${bars(r.byPay, payName, (id) => ({ cash: '#86CF98', card: '#93BCE6', mobile: '#C8A2E8', credit: '#F38A79' }[id] || 'var(--stool)'))}
          <h3 style="margin-top:18px">${t('by_service')}</h3>${bars(r.byService, id => t(id === 'take' ? 'take' : id === 'delivery' ? 'delivery' : 'dine'))}</div>
        <div class="card"><h3>${t('by_category')}</h3>${bars(r.byCat, catName, id => (S.menu.find(m => m.cat === id) || {}).color || 'var(--stool)')}
          <h3 style="margin-top:18px">${t('expenses')}</h3>${bars(r.byExpense, expName, () => 'var(--bad)')}</div>
      </div>`;
  };

  /* ---------- MONEY ---------- */
  V.money = () => {
    const tab = U.money;
    const head = `<div class="head"><div><h1>${t('money_title')}</h1></div>${seg('moneyTab', tab, [['exp', t('tab_expenses')], ['wd', t('tab_withdrawals')], ['close', t('tab_close')]])}</div>`;
    const monthDays = new Set(C.period('month', today(), cal()).days);
    if (tab === 'exp') {
      const list = S.expenses.filter(e => monthDays.has(e.day)).sort((a, b) => b.at - a.at);
      const total = list.reduce((s, e) => s + e.amount, 0);
      return head + `<div class="grid2"><div class="card"><h3>${t('add_expense')}</h3><div class="form" style="margin-top:10px">
        <div class="two"><label class="f">${t('category')}<select id="e-cat">${S.settings.expenseCats.map(c => `<option value="${c.id}">${esc(I.pick(c))}</option>`).join('')}</select></label>
        <label class="f">${t('amount')} (${esc(cur())})<input id="e-amt" inputmode="decimal" autocomplete="off"></label></div>
        <div class="two"><label class="f">${t('date')}<input type="date" id="e-day" value="${today()}"></label>
        <label class="f">${t('paid_from')}<select id="e-method"><option value="cash">${t('from_cash')}</option><option value="bank">${t('from_bank')}</option></select></label></div>
        <label class="f">${t('note')}<input id="e-note" autocomplete="off"></label>
        <button class="btn go" data-act="addExpense">${t('add_expense')}</button></div></div>
        <div class="card"><div class="row" style="justify-content:space-between"><h3>${t('this_month')} · ${periodLabel('month', today())}</h3><b class="num">${M(total)}</b></div>
        ${list.length ? `<div class="list" style="margin-top:12px">${list.map(e => `<div class="er"><div><b>${esc(expName(e.cat))}</b><small>${shortDay(e.day)}${e.note ? ' · ' + esc(e.note) : ''} · ${e.method === 'cash' ? t('from_cash') : t('from_bank')}</small></div><b class="num">${M(e.amount)}</b><button class="x" data-act="delExpense" data-id="${esc(e.id)}" aria-label="${t('delete')}">×</button></div>`).join('')}</div>` : `<div style="margin-top:12px">${empty(t('no_expenses'), '')}</div>`}</div></div>`;
    }
    if (tab === 'wd') {
      const list = S.withdrawals.filter(e => monthDays.has(e.day)).sort((a, b) => b.at - a.at);
      const total = list.reduce((s, e) => s + e.amount, 0);
      const byPerson = {}; for (const w of list) byPerson[w.person] = (byPerson[w.person] || 0) + w.amount;
      const people = [...new Set(S.withdrawals.map(w => w.person))];
      return head + `<div class="note"><p>${t('withdraw_hint')}</p></div><div class="grid2"><div class="card"><h3>${t('add_withdrawal')}</h3><div class="form" style="margin-top:10px">
        <div class="two"><label class="f">${t('person')}<input id="w-person" list="w-people" autocomplete="off"><datalist id="w-people">${people.map(p => `<option value="${esc(p)}">`).join('')}</datalist></label>
        <label class="f">${t('amount')} (${esc(cur())})<input id="w-amt" inputmode="decimal" autocomplete="off"></label></div>
        <div class="two"><label class="f">${t('date')}<input type="date" id="w-day" value="${today()}"></label><label class="f">${t('reason')}<input id="w-note" autocomplete="off"></label></div>
        <button class="btn go" data-act="addWithdrawal">${t('add_withdrawal')}</button></div>
        ${Object.keys(byPerson).length ? `<div class="bars" style="margin-top:18px">${Object.entries(byPerson).sort((a, b) => b[1] - a[1]).map(([p, v]) => `<div class="r"><span>${esc(p)}</span><span class="num muted">${M(v)}</span><div class="track"><i style="width:${v / total * 100}%;background:var(--stool)"></i></div></div>`).join('')}</div>` : ''}</div>
        <div class="card"><div class="row" style="justify-content:space-between"><h3>${t('this_month')} · ${periodLabel('month', today())}</h3><b class="num">${M(total)}</b></div>
        ${list.length ? `<div class="list" style="margin-top:12px">${list.map(w => `<div class="er"><div><b>${esc(w.person)}</b><small>${shortDay(w.day)}${w.note ? ' · ' + esc(w.note) : ''}</small></div><b class="num">${M(w.amount)}</b><button class="x" data-act="delWithdrawal" data-id="${esc(w.id)}" aria-label="${t('delete')}">×</button></div>`).join('')}</div>` : `<div style="margin-top:12px">${empty(t('no_withdrawals'), '')}</div>`}</div></div>`;
    }
    const day = U.closeDay;
    const existing = S.closes.find(c => c.day === day);
    const opening = existing ? existing.opening : (U.closeOpening ?? S.settings.openingCash ?? 0);
    const cs = C.cashSummary(S, day, opening);
    const counted = existing && U.closeCounted == null ? existing.counted : U.closeCounted;
    const diff = counted != null && counted !== '' ? C.num(counted) - cs.expected : null;
    const hist = S.closes.slice().sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 30);
    return head + `<div class="grid2"><div class="card"><div class="row" style="justify-content:space-between"><h3>${fmtDay(day)}</h3><input type="date" id="c-day" data-change="closeDay" value="${day}" style="max-width:180px"></div>
      <div class="close-box" style="margin-top:14px">
        <label class="f">${t('opening_cash')}<input id="c-open" data-bind="closeOpening" inputmode="decimal" value="${esc(I.d(opening))}"></label>
        <div><span>+ ${t('cash_sales')}</span><b class="num">${M(cs.cashSales)}</b></div>
        <div><span>+ ${t('cash_in')}</span><b class="num">${M(cs.cashIn)}</b></div>
        <div><span>− ${t('cash_exp')}</span><b class="num">${M(cs.cashExp)}</b></div>
        <div><span>− ${t('withdrawals')}</span><b class="num">${M(cs.withdrawals)}</b></div>
        <div class="big"><span>${t('expected')}</span><span class="num" id="c-exp">${M(cs.expected)}</span></div>
        <label class="f">${t('counted')}<input id="c-count" data-bind="closeCounted" inputmode="decimal" value="${esc(counted ?? '')}" placeholder="${I.n(cs.expected)}"></label>
        <div id="c-diff" ${diff === null ? 'hidden' : ''}><span>${t('difference')}</span><b class="num">${diff === null ? '' : diffText(diff)}</b></div>
        <label class="f">${t('note')}<input id="c-note" value="${esc(existing ? existing.note : '')}" autocomplete="off"></label>
        <button class="btn go" data-act="closeDayBtn">${t('close_day_btn')}</button>
      </div></div>
      <div class="card"><h3>${t('closes_history')}</h3>${hist.length ? `<div class="list" style="margin-top:12px">${hist.map(c => `<div class="er"><div><b>${shortDay(c.day)}</b><small>${t('expected')} ${M(c.expected)} · ${t('counted')} ${M(c.counted)}</small></div><span>${diffPill(c.diff)}</span><span></span></div>`).join('')}</div>` : `<div style="margin-top:12px">${empty(t('none_yet'), '')}</div>`}</div></div>`;
  };
  const diffText = d => (Math.abs(d) < 0.5 ? t('exact') : `${d > 0 ? '+' : '−'}${M(Math.abs(d))} ${d > 0 ? t('over') : t('short')}`);
  const diffPill = d => `<span class="pill ${Math.abs(d) < 0.5 ? 'ok' : d > 0 ? 'info' : 'bad'}">${diffText(d)}</span>`;

  /* ---------- CUSTOMERS ---------- */
  const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hue = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 70% 60%)`; };
  V.customers = () => {
    const owed = S.customers.reduce((s, c) => s + Math.max(0, c.balance || 0), 0);
    const q = U.custQ.trim().toLowerCase();
    let list = S.customers.slice().sort((a, b) => (b.balance || 0) - (a.balance || 0) || (b.last || 0) - (a.last || 0));
    if (U.custF === 'owing') list = list.filter(c => c.balance > 0);
    if (q) list = list.filter(c => (c.name || '').toLowerCase().includes(q) || C.ascii(c.phone || '').includes(C.ascii(q)));
    return `<div class="head"><div><h1>${t('customers_title')}</h1><p class="sub">${t('owed_total')}: <b class="num">${M(owed)}</b></p></div><button class="btn go" data-act="newCustomer">${t('add_customer')}</button></div>
      <div class="tools"><input id="cu-q" data-bind="custQ" placeholder="${t('search')}" value="${esc(U.custQ)}" autocomplete="off">${chip('custF', 'all', U.custF === 'all', t('all'))}${chip('custF', 'owing', U.custF === 'owing', t('owing_only'))}</div>
      ${!S.customers.length ? empty(t('no_customers'), t('no_customers_hint')) : list.length ? `<div class="list">${list.map(c => `<button class="orow" data-act="openCustomer" data-id="${esc(c.id)}"><span class="avatar" style="--c:${hue(c.name)}">${esc(initials(c.name))}</span>
        <span class="what"><div><b>${esc(c.name)}</b></div><small>${esc(I.d(c.phone || ''))}${c.phone ? ' · ' : ''}${t('has_points', { n: I.n(c.points || 0) })} · ${t('visits')} ${I.n(c.visits || 0)}</small></span>
        <span class="tot">${c.balance > 0 ? `<span class="pill bad">${t('owes')} ${M(c.balance)}</span>` : c.balance < 0 ? `<span class="pill ok">${M(-c.balance)}</span>` : ''}</span></button>`).join('')}</div>` : empty(t('nothing_matches'), '')}`;
  };
  function customerSheet(c) {
    const isNew = !c;
    c = c || { id: C.uid('c'), name: '', phone: '', note: '', balance: 0, points: 0, visits: 0, created: Date.now() };
    U.edit = { kind: 'customer', obj: c, isNew };
    let hist = '';
    if (!isNew) {
      const ev = [
        ...S.orders.filter(o => o.customer === c.id).map(o => ({ at: o.at, html: `<div class="er"><div><b>#${I.n(o.no)} · ${esc(o.items.map(i => itemName(i)).join('، '))}</b><small>${shortDay(o.day)} · ${esc(payName(o.pay))}${o.status === 'void' ? ' · ' + t('voided') : ''}</small></div><b class="num" ${o.pay === 'credit' && o.status !== 'void' ? 'style="color:var(--bad)"' : ''}>${M(o.total)}</b><span></span></div>` })),
        ...S.payments.filter(p => p.customer === c.id).map(p => ({ at: p.at, html: `<div class="er"><div><b>${t('paid_amount')}</b><small>${shortDay(p.day)} · ${esc(payName(p.method))}${p.note ? ' · ' + esc(p.note) : ''}</small></div><b class="num" style="color:var(--ok)">−${M(p.amount)}</b><span></span></div>` })),
      ].sort((a, b) => b.at - a.at).slice(0, 60);
      hist = `<h3>${t('history')}</h3>${ev.length ? `<div class="list">${ev.map(e => e.html).join('')}</div>` : `<p class="muted">${t('none_yet')}</p>`}`;
    }
    openSheet('customer', `<div class="sh"><div class="cust-top"><span class="avatar" style="--c:${hue(c.name)}">${esc(initials(c.name || '+'))}</span><div><h2>${isNew ? t('add_customer') : esc(c.name)}</h2>${isNew ? '' : `<span class="muted">${t('has_points', { n: I.n(c.points || 0) })} · ${t('visits')} ${I.n(c.visits || 0)}</span>`}</div></div><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
      ${!isNew ? `<div class="card" style="padding:14px"><div class="row" style="justify-content:space-between"><span>${t('owes')}</span><b style="font-size:24px" class="num">${M(c.balance || 0)}</b></div>
        <div class="two" style="margin-top:10px"><input id="p-amt" inputmode="decimal" placeholder="${t('amount')}"><select id="p-method">${S.settings.payMethods.map(p => `<option value="${p.id}">${esc(I.pick(p))}</option>`).join('')}</select></div>
        <button class="btn go" data-act="receivePay" style="width:100%;margin-top:8px">${t('receive_payment')}</button></div>` : ''}
      <div class="form"><div class="two"><label class="f">${t('name')}<input id="cu-name" value="${esc(c.name)}"></label><label class="f">${t('phone')}<input id="cu-phone" inputmode="tel" value="${esc(c.phone)}"></label></div>
      <label class="f">${t('note')}<input id="cu-note" value="${esc(c.note || '')}"></label></div>
      <div class="actions"><button class="btn go" data-act="saveCustomer">${t('save')}</button>${isNew ? '' : `<button class="btn danger quiet" data-act="delCustomer">${t('delete')}</button>`}</div>${hist}`, 'wide');
  }

  /* ---------- MENU ---------- */
  V.menu = () => {
    const check = S.menu.filter(m => m.verify).length;
    let h = `<div class="head"><div><h1>${t('menu_title')}</h1><p class="sub">${t('items_n', { n: I.n(S.menu.length), c: S.menu.length })}</p></div><button class="btn go" data-act="newItem">${t('add_item')}</button></div>`;
    if (check) h += `<div class="note"><p>${t('check_banner', { n: I.n(check) })}</p></div>`;
    for (const c of S.cats.slice().sort((a, b) => a.ord - b.ord)) {
      const its = S.menu.filter(m => m.cat === c.key).sort((a, b) => a.ord - b.ord);
      if (!its.length) continue;
      h += `<section class="band"><div class="band-h"><span class="fa-name" lang="fa">${esc(c.fa || c.en)}</span><span>${esc(c.en)}</span></div><div class="list">${its.map(m => {
        const cm = C.canMake(m, S), cost = C.itemCost(m, S), mg = cost > 0 && m.price > 0 ? Math.round((m.price - cost) / m.price * 100) : null;
        return `<button class="mi${m.active ? '' : ' off'}" style="--c:${esc(m.color)}" data-act="editItem" data-id="${esc(m.id)}"><span class="sw">${pic(m)}</span>
          <span class="nm"><span class="fa-name" lang="fa">${esc(m.fa)}</span><small lang="en">${esc(m.en)}</small></span><span class="pr">${M(m.price)}</span>
          <span class="meta">${m.recipe.length ? `<span>${t('recipe')}: ${I.n(m.recipe.length)}</span>` : `<span class="pill mute">${t('no_recipe')}</span>`}${cm !== null ? (cm === 0 ? ` <span class="pill bad">${t('cant_make')}</span>` : ` · ${t('enough_for', { n: I.n(cm) })}`) : ''}${mg !== null ? ` · <span class="pill ${mg >= 50 ? 'ok' : mg >= 25 ? 'warn' : 'bad'}">${t('margin')} ${I.n(mg)}%</span>` : ''}${m.verify ? ` <span class="pill info">${t('check')}</span>` : ''}${m.active ? '' : ` <span class="pill mute">${t('hidden')}</span>`}</span></button>`;
      }).join('')}</div></section>`;
    }
    return h;
  };
  function recipeRows() {
    const ings = S.ings.slice().sort((a, b) => ingName(a).localeCompare(ingName(b)));
    return U.edit.obj.recipe.map((l, ix) => { const ig = C.byId(S.ings, l.ing); return `<div class="rl">
      <select id="r-ing-${ix}" data-change="rIng" data-id="${ix}" aria-label="${t('add_ingredient')}"><option value="">—</option>${ings.map(g => `<option value="${esc(g.id)}" ${g.id === l.ing ? 'selected' : ''}>${esc(ingName(g))}</option>`).join('')}</select>
      <input id="r-qty-${ix}" inputmode="decimal" value="${esc(l.qty)}" aria-label="${t('amount')}"><span id="r-u-${ix}">${esc(ig ? unitName(ig.unit) : '')}</span>
      <button class="x" data-act="rmLine" data-id="${ix}" aria-label="${t('delete')}">×</button></div>`; }).join('');
  }
  function itemSheet(m) {
    const isNew = !m;
    m = m ? JSON.parse(JSON.stringify(m)) : { id: C.uid('m'), fa: '', en: '', cat: U.cat !== 'all' ? U.cat : S.cats[0].key, price: '', cost: 0, color: '#C9A27E', active: true, verify: false, recipe: [], ord: 99 };
    U.edit = { kind: 'item', obj: m, isNew };
    const cats = S.cats.slice().sort((a, b) => a.ord - b.ord);
    openSheet('item', `<div class="sh"><h2>${isNew ? t('add_item') : esc(itemName(m))}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
      <div class="form"><div class="two"><label class="f">${t('name_fa')}<input id="e-fa" dir="rtl" lang="fa" value="${esc(m.fa)}"></label><label class="f">${t('name_en')}<input id="e-en" dir="ltr" lang="en" value="${esc(m.en)}"></label></div>
      <div class="three"><label class="f">${t('category')}<select id="e-cat" data-change="eCat">${cats.map(c => `<option value="${esc(c.key)}" ${c.key === m.cat ? 'selected' : ''}>${esc(I.pick(c))}</option>`).join('')}<option value="__new">${t('new_category')}…</option></select></label>
      <label class="f">${t('price')} (${esc(cur())})<input id="e-price" inputmode="decimal" value="${esc(m.price)}"></label>
      <label class="f">${t('manual_cost')}<input id="e-cost" inputmode="decimal" value="${esc(m.cost || 0)}"></label></div>
      <div id="e-newcat" class="three" hidden><label class="f">${t('name_fa')}<input id="e-cat-fa" dir="rtl"></label><label class="f">${t('name_en')}<input id="e-cat-en" dir="ltr"></label>
        <label class="f">${t('colour')}<select id="e-cat-look">${ART.LOOKS.map(l => `<option>${l}</option>`).join('')}</select></label></div>
      <div class="photo-row"><span class="photo-prev${m.photo ? ' has' : ''}" id="e-photo" style="--c:${esc(m.color)}">${pic(m)}</span>
        <label class="btn sm" style="cursor:pointer">${svg('camera')}${t('choose_photo')}<input type="file" accept="image/*" data-change="itemPhoto" hidden></label>
        <button class="btn sm quiet" data-act="rmPhoto">${t('remove_photo')}</button></div>
      <div class="colorrow"><input type="color" id="e-color" value="${esc(m.color)}" aria-label="${t('colour')}"><span class="muted">${t('colour')}</span>${m.recipe.length ? `<span class="grow"></span><span class="pill gold">${t('cost')} ${M(C.recipeCost(m, S))}</span>` : ''}</div>
      <label class="ck"><input type="checkbox" id="e-active" ${m.active ? 'checked' : ''}> ${t('show_on_sell')}</label>
      <label class="ck"><input type="checkbox" id="e-verify" ${m.verify ? 'checked' : ''}> ${t('mark_check')}</label>
      <fieldset><legend>${t('recipe')}</legend><div id="e-recipe" style="display:grid;gap:6px">${recipeRows()}</div><div><button class="btn sm" data-act="addLine">${t('add_ingredient')}</button></div></fieldset></div>
      <div class="actions"><button class="btn go" data-act="saveItem">${t('save')}</button>${isNew ? '' : `<button class="btn danger quiet" data-act="delItem">${t('delete')}</button>`}</div>`);
  }
  function syncItem() {
    const m = U.edit.obj, v = id => (document.getElementById(id) || {}).value ?? '';
    Object.assign(m, { fa: v('e-fa').trim(), en: v('e-en').trim(), cat: v('e-cat'), price: v('e-price'), cost: v('e-cost'), color: v('e-color'), active: $('#e-active').checked, verify: $('#e-verify').checked });
    m.recipe = m.recipe.map((l, ix) => ({ ing: v('r-ing-' + ix), qty: v('r-qty-' + ix) }));
  }

  /* ---------- STOCK ---------- */
  V.stock = () => {
    const lo = C.lowIngs(S).length;
    const q = U.stockQ.trim().toLowerCase();
    let list = S.ings.slice().sort((a, b) => ingName(a).localeCompare(ingName(b)));
    if (q) list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.nameFa || '').includes(U.stockQ.trim()));
    if (U.stockF === 'need') list = list.filter(i => C.ingState(i) !== 'ok');
    const val = S.ings.reduce((s, i) => s + (+i.qty || 0) * (+i.cost || 0), 0);
    const moves = S.stockLog.slice().sort((a, b) => b.at - a.at).slice(0, 12);
    let h = `<div class="head"><div><h1>${t('stock_title')}</h1><p class="sub">${t('items_n', { n: I.n(S.ings.length), c: S.ings.length })}${val ? ' · ' + t('stock_value', { v: M(val) }) : ''}</p></div><button class="btn go" data-act="newIng">${t('add_ingredient')}</button></div>`;
    if (S.settings.sampleStock) h += `<div class="note warn"><p>${t('sample_stock')}</p><button class="btn sm" data-act="sampleDone">${t('counted_all')}</button></div>`;
    h += `<div class="tools"><input id="s-q" data-bind="stockQ" placeholder="${t('search')}" value="${esc(U.stockQ)}" autocomplete="off">${chip('sf', 'all', U.stockF === 'all', t('all'))}${chip('sf', 'need', U.stockF === 'need', `${t('low_or_out')} (${I.n(lo)})`)}</div>`;
    if (!list.length) return h + empty(t('nothing_matches'), '');
    h += `<div class="list">${list.map(i => {
      const s = C.ingState(i), full = Math.max((+i.min || 0) * 3, +i.qty || 0, 1);
      return `<div class="sr"><div class="nm"><b>${esc(ingName(i))}</b><small>${t('reorder_at')} ${I.q(i.min)} ${esc(unitName(i.unit))}${i.cost ? ` · ${t('cost_per', { u: unitName(i.unit) })} ${M(i.cost)}` : ''}${i.supplier ? ' · ' + esc(i.supplier) : ''}</small></div>
        <div class="q"><b class="num">${I.q(i.qty)}</b><small>${esc(unitName(i.unit))}</small><div>${s === 'out' ? `<span class="pill bad">${t('out')}</span>` : s === 'low' ? `<span class="pill warn">${t('low')}</span>` : `<span class="pill ok">${t('ok')}</span>`}</div></div>
        <div class="acts"><div class="sstep"><button data-act="idec" data-id="${esc(i.id)}" aria-label="−">−</button><span>${I.q(step(i.unit))}</span><button data-act="iinc" data-id="${esc(i.id)}" aria-label="+">+</button></div>
          <button class="btn sm" data-act="stockMove" data-id="${esc(i.id)}" data-kind="receive">${t('receive')}</button><button class="btn sm" data-act="stockMove" data-id="${esc(i.id)}" data-kind="waste">${t('waste_btn')}</button><button class="btn sm quiet" data-act="editIng" data-id="${esc(i.id)}">${t('edit')}</button></div>
        <div class="gauge ${s}"><i style="width:${Math.min(100, (+i.qty || 0) / full * 100)}%"></i><u style="inset-inline-start:${(+i.min || 0) / full * 100}%"></u></div></div>`;
    }).join('')}</div>`;
    if (moves.length) h += `<div class="card" style="margin-top:18px"><h3>${t('stock_moves')}</h3><div class="list" style="margin-top:10px">${moves.map(l => { const i = C.byId(S.ings, l.ing); return `<div class="er"><div><b>${esc(ingName(i) || '?')}</b><small>${shortDay(l.day)} ${fmtTime(l.at)} · ${t('move_' + l.kind)}${l.note ? ' · ' + esc(l.note) : ''}</small></div><b class="num" style="color:${l.delta >= 0 ? 'var(--ok)' : 'var(--bad)'}">${l.delta >= 0 ? '+' : '−'}${I.q(Math.abs(l.delta))} ${esc(unitName(i ? i.unit : ''))}</b><span class="muted num">${l.value ? M(l.value) : ''}</span></div>`; }).join('')}</div></div>`;
    return h;
  };
  function ingSheet(i) {
    const isNew = !i;
    i = i ? { ...i } : { id: C.uid('i'), name: '', nameFa: '', qty: 0, unit: 'kg', min: 0, cost: 0, supplier: '' };
    U.edit = { kind: 'ing', obj: i, isNew };
    const used = S.menu.filter(m => m.recipe.some(l => l.ing === i.id));
    openSheet('ing', `<div class="sh"><h2>${isNew ? t('add_ingredient') : esc(ingName(i))}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
      <div class="form"><div class="two"><label class="f">${t('name_fa')}<input id="g-fa" dir="rtl" value="${esc(i.nameFa)}"></label><label class="f">${t('name_en')}<input id="g-en" dir="ltr" value="${esc(i.name)}"></label></div>
      <div class="three"><label class="f">${t('in_stock')}<input id="g-qty" inputmode="decimal" value="${esc(i.qty)}"></label>
        <label class="f">${t('unit')}<select id="g-unit">${['pcs', 'kg', 'g', 'L', 'ml', 'bunch', 'pack'].map(u => `<option value="${u}" ${u === i.unit ? 'selected' : ''}>${esc(unitName(u))}</option>`).join('')}</select></label>
        <label class="f">${t('reorder_at')}<input id="g-min" inputmode="decimal" value="${esc(i.min)}"></label></div>
      <div class="two"><label class="f">${t('cost_per', { u: unitName(i.unit) })} (${esc(cur())})<input id="g-cost" inputmode="decimal" value="${esc(i.cost || '')}"></label><label class="f">${t('supplier')}<input id="g-sup" value="${esc(i.supplier)}"></label></div>
      ${used.length ? `<p class="hint">${t('used_in')}: ${used.map(m => esc(itemName(m))).join('، ')}</p>` : ''}</div>
      <div class="actions"><button class="btn go" data-act="saveIng">${t('save')}</button>${isNew ? '' : `<button class="btn danger quiet" data-act="delIng">${t('delete')}</button>`}</div>`);
  }
  function stockMoveSheet(i, kind) {
    U.edit = { kind: 'move', obj: i, move: kind };
    openSheet('move', `<div class="sh"><h2>${t('move_' + kind)} · ${esc(ingName(i))}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
      <div class="form"><div class="two"><label class="f">${t('how_much')} (${esc(unitName(i.unit))})<input id="mv-qty" inputmode="decimal" value="${kind === 'receive' ? I.d(sugg(i)) : ''}"></label>
      ${kind === 'receive' ? `<label class="f">${t('cost_per', { u: unitName(i.unit) })} (${esc(cur())})<input id="mv-cost" inputmode="decimal" value="${esc(i.cost || '')}"></label>` : `<label class="f">${t('note')}<input id="mv-note"></label>`}</div>
      ${kind === 'receive' ? `<label class="ck"><input type="checkbox" id="mv-exp" checked> ${t('record_expense')}</label><label class="f">${t('note')}<input id="mv-note"></label>` : ''}</div>
      <div class="actions"><button class="btn go" data-act="saveMove">${t('save')}</button></div>`);
    setTimeout(() => { const el = $('#mv-qty'); if (el) { el.focus(); el.select(); } }, 60);
  }
  const sugg = i => { const s = step(i.unit); return Math.max(s, Math.ceil(C.r3((+i.min || 0) * 2 - (+i.qty || 0)) / s) * s); };

  /* ---------- BUY ---------- */
  V.buy = () => {
    const low = C.lowIngs(S).sort((a, b) => ingName(a).localeCompare(ingName(b)));
    const list = S.shopping.slice().sort((a, b) => (a.done - b.done) || (a.at - b.at));
    return `<div class="head"><div><h1>${t('buy_title')}</h1></div><button class="btn" data-act="copyList">${t('copy_list')}</button></div>
      <div class="grid2"><div class="card"><h3>${t('running_low')}</h3>
        ${low.length ? `<div class="list" style="margin-top:10px">${low.map(i => `<div class="low"><div><b>${esc(ingName(i))}</b><br><small class="muted">${t('in_stock')} ${I.q(i.qty)} · ${t('reorder_at')} ${I.q(i.min)} ${esc(unitName(i.unit))}</small></div>
          <input id="b-${esc(i.id)}" inputmode="decimal" value="${I.d(sugg(i))}" aria-label="${t('how_much')}">
          <div class="b"><button class="btn sm go" data-act="recv" data-id="${esc(i.id)}">${t('receive')}</button><button class="btn sm" data-act="lowToList" data-id="${esc(i.id)}">${t('to_list')}</button></div></div>`).join('')}</div>` : `<p class="muted" style="margin-top:8px">${t('all_good')}</p>`}</div>
      <div class="card"><h3>${t('shopping_list')}</h3>
        <div class="addf" style="margin-top:10px"><input id="sh-text" placeholder="${t('name')}" autocomplete="off"><input id="sh-qty" placeholder="${t('how_much')}" inputmode="decimal"><button class="btn sm go" data-act="shAdd">${t('add')}</button></div>
        ${list.length ? `<div class="list">${list.map(s => `<div class="lr${s.done ? ' done' : ''}"><input type="checkbox" data-act="shToggle" data-id="${esc(s.id)}" ${s.done ? 'checked' : ''} aria-label="${esc(s.text)}">
          <div class="t"><span>${esc(s.text)}${s.qty ? ` — ${I.q(s.qty)} ${esc(unitName(s.unit || ''))}` : ''}</span></div><button class="x" data-act="shDel" data-id="${esc(s.id)}" aria-label="${t('delete')}">×</button></div>`).join('')}</div>
          ${list.some(s => s.done) ? `<div style="margin-top:12px"><button class="btn sm quiet" data-act="shClear">${t('clear_bought')}</button></div>` : ''}` : empty(t('list_empty'), '')}</div></div>`;
  };

  /* ---------- MAKE ---------- */
  V.make = () => {
    const items = S.menu.filter(m => m.active).sort((a, b) => itemName(a).localeCompare(itemName(b)));
    const need = {}; U.plan.forEach(p => { const m = C.byId(S.menu, p.id); (m ? m.recipe : []).forEach(l => (need[l.ing] = C.r3((need[l.ing] || 0) + l.qty * p.qty))); });
    const rows = Object.entries(need).map(([id, q]) => { const i = C.byId(S.ings, id) || { name: '?', unit: '', qty: 0 }; return { i, q, short: C.r3(Math.max(0, q - (+i.qty || 0))) }; }).sort((a, b) => b.short - a.short);
    const shorts = rows.filter(r => r.short > 0).length;
    const prep = S.prep.slice().sort((a, b) => (a.done - b.done) || (a.at - b.at));
    return `<div class="head"><div><h1>${t('make_title')}</h1></div></div><div class="grid2">
      <div class="card"><h3>${t('can_we_make')}</h3>
        <div class="addf" style="margin-top:10px"><select id="p-item"><option value="">${t('choose_item')}</option>${items.map(m => `<option value="${esc(m.id)}">${esc(itemName(m))}</option>`).join('')}</select><input id="p-qty" inputmode="numeric" value="${I.d(10)}" aria-label="${t('how_many')}"><button class="btn sm go" data-act="planAdd">${t('add')}</button></div>
        ${U.plan.length ? `<div class="chips" style="flex-wrap:wrap">${U.plan.map((p, ix) => `<button class="chip" data-act="planRm" data-id="${ix}">${I.n(p.qty)} × ${esc(itemName(C.byId(S.menu, p.id)))} ✕</button>`).join('')}</div>
          ${rows.length ? `<div class="scroll-x"><table class="tbl" style="margin-top:10px"><thead><tr><th></th><th class="n">${t('needs')}</th><th class="n">${t('in_stock')}</th><th class="n">${t('short_by')}</th></tr></thead><tbody>${rows.map(r => `<tr class="${r.short > 0 ? 'short' : ''}"><td>${esc(ingName(r.i))}</td><td class="n">${I.q(r.q)} ${esc(unitName(r.i.unit))}</td><td class="n">${I.q(r.i.qty)}</td><td class="n">${r.short > 0 ? I.q(r.short) : '—'}</td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">${t('no_recipe')}</p>`}
          <div class="actions" style="margin-top:12px">${shorts ? `<button class="btn go" data-act="planToList">${t('add_missing', { n: I.n(shorts) })}</button>` : rows.length ? `<span class="pill ok" style="padding:6px 12px">${t('enough_all')}</span>` : ''}<button class="btn quiet" data-act="planClear">${t('clear_order')}</button></div>` : ''}</div>
      <div class="card"><h3>${t('prep_list')}</h3>
        <div class="addf" style="grid-template-columns:minmax(0,1fr) auto;margin-top:10px"><input id="pr-text" autocomplete="off"><button class="btn sm go" data-act="prAdd" style="grid-column:auto">${t('add')}</button></div>
        ${prep.length ? `<div class="list">${prep.map(p => `<div class="lr${p.done ? ' done' : ''}"><input type="checkbox" data-act="prToggle" data-id="${esc(p.id)}" ${p.done ? 'checked' : ''} aria-label="${esc(p.text)}"><div class="t"><span>${esc(p.text)}</span></div><button class="x" data-act="prDel" data-id="${esc(p.id)}" aria-label="${t('delete')}">×</button></div>`).join('')}</div>
          ${prep.some(p => p.done) ? `<div style="margin-top:12px"><button class="btn sm quiet" data-act="prClear">${t('clear_done')}</button></div>` : ''}` : empty(t('none_yet'), '')}</div></div>`;
  };

  /* ---------- SETTINGS ---------- */
  V.settings = () => {
    const s = S.settings, sh = s.shop;
    return `<div class="head"><div><h1>${t('settings_title')}</h1></div>${s.ownerPin ? `<button class="btn" data-act="lockNow">${svg('lock')}${t('lock_now')}</button>` : ''}</div>
    <div class="grid2"><div class="card"><div class="form">
      <div class="f">${t('language')}${seg('setLang', s.lang, [['fa', 'دری'], ['en', 'English']])}</div>
      <div class="f">${t('calendar')}${seg('setCal', s.calendar, [['hijri', t('hijri')], ['greg', t('gregorian')]])}</div>
      <div class="f">${t('digits')}${seg('setDigits', s.digits, [['fa', t('digits_fa')], ['en', t('digits_en')]])}</div>
      <div class="f">${t('theme')}${seg('setTheme', s.theme, [['auto', t('theme_auto')], ['dark', t('theme_dark')], ['light', t('theme_light')]])}</div>
    </div></div>
    <div class="card"><h3>${t('shop_info')}</h3><div class="form" style="margin-top:10px">
      <div class="two"><label class="f">${t('shop_name')}<input id="st-name" value="${esc(sh.name)}"></label><label class="f">${t('name_fa')}<input id="st-fa" dir="rtl" value="${esc(sh.fa)}"></label></div>
      <div class="two"><label class="f">${t('phone')}<input id="st-phone" value="${esc(sh.phone)}"></label><label class="f">Instagram<input id="st-insta" dir="ltr" value="${esc(sh.insta)}"></label></div>
      <div class="two"><label class="f">${t('tagline')}<input id="st-tag" value="${esc(sh.tagline)}"></label><label class="f">${t('address')}<input id="st-addr" value="${esc(sh.address)}"></label></div>
      <label class="f">${t('receipt_footer')}<input id="st-foot" value="${esc(sh.footer)}"></label>
      <div class="three"><label class="f">${t('paper')}<select id="st-paper"><option value="80" ${+s.paper === 80 ? 'selected' : ''}>80 mm</option><option value="58" ${+s.paper === 58 ? 'selected' : ''}>58 mm</option></select></label>
      <label class="f">${t('currency')}<input id="st-cur" value="${esc(s.currency)}"></label><label class="f">${t('tax_rate')}<input id="st-tax" inputmode="decimal" value="${esc(I.d(s.taxRate))}"></label></div>
      ${native ? `<label class="ck"><input type="checkbox" id="st-silent" ${s.silentPrint ? 'checked' : ''}> ${t('silent_print')}</label>` : ''}
      <button class="btn go" data-act="saveShop">${t('save')}</button></div></div>
    <div class="card"><h3>${t('loyalty')}</h3><div class="form" style="margin-top:10px">
      <div class="two"><label class="f">${t('points_per_100')}<input id="st-pp" inputmode="decimal" value="${esc(I.d(s.pointsPer100))}"></label><label class="f">${t('point_value')} (${esc(cur())})<input id="st-pv" inputmode="decimal" value="${esc(I.d(s.pointValue))}"></label></div>
      <label class="f">${t('opening_cash')}<input id="st-open" inputmode="decimal" value="${esc(I.d(s.openingCash || 0))}"></label>
      <label class="f">${t('owner_pin')}<input id="st-pin" inputmode="numeric" type="password" autocomplete="new-password" value="${esc(s.ownerPin)}" maxlength="8"></label><p class="hint">${t('pin_hint')}</p>
      <button class="btn go" data-act="saveMore">${t('save')}</button></div></div>
    <div class="card"><h3>${t('data')}</h3><p class="hint">${t('backup_hint')}</p><button class="btn go" data-act="tab" data-id="backup">${svg('backup')}${t('nav_backup')}</button>
      <p class="hint" style="margin-top:12px">Senso Bar 2.1 · ${FS.kind === 'win' ? 'Windows' : FS.kind === 'android' ? 'Android' : 'Web'}</p></div></div></div>`;
  };

  /* ---------- BACKUP & EXPORT ---------- */
  async function loadBackups() {
    U.backups = null;
    try { U.where = await FS.where(); U.backups = FS.kind === 'web' ? [] : (await FS.list('Backups')).sort((a, b) => (a.name < b.name ? 1 : -1)); }
    catch (_) { U.backups = []; }
    if (U.tab === 'backup') render();
  }
  const fileDate = n => { const m = /(\d{4}-\d{2}-\d{2})/.exec(n); return m ? fmtDay(m[1]) : n; };
  const kb = b => (b ? (b > 1048576 ? `${I.q(b / 1048576)} MB` : `${I.n(Math.max(1, b / 1024))} KB`) : '');
  const EXPORTS = ['orders_all', 'orders_month', 'items', 'daily', 'expenses', 'withdrawals', 'customers', 'stock', 'menu'];
  V.backup = () => {
    if (U.backups === undefined) loadBackups();
    const last = lastBackup();
    const auto = S.settings.autoBackup !== false;
    const size = C.exportJSON(S).length;
    const list = U.backups || [];
    return `<div class="head"><div><h1>${t('backup_title')}</h1><p class="sub">${t('data_counts', { o: I.n(S.orders.length), c: I.n(S.customers.length), m: I.n(S.menu.length) })} · ${kb(size)}</p></div></div>
    <div class="${FS.kind === 'web' ? 'stack' : 'grid2'}">
      <div class="card bk-hero"><div class="bk-icon">${svg('backup')}</div>
        <h3>${t('backup_safe')}</h3>
        <p class="hint">${FS.kind === 'web' ? t('web_backup_hint') : `${t('saved_in')}: <b dir="ltr">${esc(U.where || '…')}</b>`}</p>
        <div class="bk-last"><span>${t('last_backup')}</span><b>${last ? `${shortDay(C.dayKey(last))} ${fmtTime(last)}` : t('never')}</b></div>
        <div class="actions"><button class="btn go" data-act="backupNow">${svg('download')}${t('backup_now')}</button>
          ${FS.canShare ? `<button class="btn" data-act="shareBackup">${svg('share')}${t('share_backup')}</button>` : ''}
          ${FS.canOpenFolder ? `<button class="btn" data-act="openFolder" data-id="Backups">${svg('folder')}${t('open_folder')}</button>` : ''}</div>
        ${FS.canShare ? `<p class="hint">${t('android_share_hint')}</p>` : ''}
        ${FS.kind !== 'web' ? `<label class="ck" style="margin-top:6px"><input type="checkbox" data-act="toggleAuto" ${auto ? 'checked' : ''}> ${t('auto_daily')}</label>` : ''}
        <label class="btn quiet" style="cursor:pointer;margin-top:4px">${svg('upload')}${t('restore')}<input type="file" id="restore-file" accept=".json,application/json" data-change="restore" hidden></label>
        <p class="hint">${t('restore_warn')}</p></div>
      ${FS.kind === 'web' ? '' : `<div class="card"><h3>${t('saved_backups')}</h3>
        ${U.backups === null ? `<p class="muted">…</p>` : list.length ? `<div class="list" style="margin-top:10px">${list.slice(0, 40).map(f => `<div class="er"><div><b>${esc(fileDate(f.name))}</b><small dir="ltr">${esc(f.name)} · ${kb(f.size)}</small></div>
          <span class="row" style="gap:6px">${FS.canShare ? `<button class="icon-btn" data-act="shareSaved" data-id="${esc(f.name)}" aria-label="${t('share')}">${svg('share')}</button>` : ''}<button class="btn sm" data-act="restoreSaved" data-id="${esc(f.name)}">${t('restore_this')}</button></span>
          <button class="x" data-act="delSaved" data-id="${esc(f.name)}" aria-label="${t('delete')}">×</button></div>`).join('')}</div>` : `<div style="margin-top:10px">${empty(t('no_backups'), '')}</div>`}</div>`}
    </div>
    <div class="card" style="margin-top:18px"><div class="row" style="justify-content:space-between"><div><h3>${t('exports')}</h3><p class="hint" style="margin:2px 0 0">${t('exports_hint')}</p></div>${FS.canOpenFolder ? `<button class="btn sm" data-act="openFolder" data-id="Exports">${svg('folder')}${t('open_folder')}</button>` : ''}</div>
      <div class="exports">${EXPORTS.map(k => `<div class="xrow"><span class="xi">${svg('file')}</span><b>${t('exp_' + k)}</b>
        <span class="row" style="gap:6px">${FS.canShare ? `<button class="icon-btn" data-act="exportShare" data-id="${k}" aria-label="${t('share')}">${svg('share')}</button>` : ''}<button class="btn sm" data-act="exportSave" data-id="${k}">${svg('download')}CSV</button></span></div>`).join('')}</div></div>
    <div class="card" style="margin-top:18px"><button class="btn danger quiet" data-act="eraseAll">${t('reset_all')}</button><p class="hint" style="margin-top:6px">${t('erase_warn')}</p></div>`;
  };
  function buildExport(kind) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = rows => '\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n');
    const hj = d => (C.hasHijri ? (({ y, m, d: dd }) => `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`)(C.hijri(d)) : '');
    const month = new Set(C.period('month', today(), cal()).days);
    const tag = today();
    if (kind === 'orders_all' || kind === 'orders_month') {
      const rows = [['order_no', 'date', 'date_hijri', 'time', 'service', 'table', 'customer', 'payment', 'status', 'item_en', 'item_fa', 'qty', 'unit_price', 'line_total', 'order_discount', 'order_total', 'note']];
      for (const o of S.orders) {
        if (kind === 'orders_month' && !month.has(o.day)) continue;
        const cu = o.customer ? (C.byId(S.customers, o.customer) || {}).name : '';
        for (const i of o.items) rows.push([o.no, o.day, hj(o.day), new Date(o.at).toTimeString().slice(0, 5), o.service, o.table, cu, o.pay, o.status, i.en, i.fa, i.qty, i.price, i.qty * i.price, o.discount, o.total, o.note]);
      }
      return { name: `senso-${kind === 'orders_all' ? 'orders-all' : 'orders-month'}-${tag}.csv`, text: csv(rows) };
    }
    if (kind === 'items') {
      const r = C.report(S, [...month]);
      return { name: `senso-items-sold-${tag}.csv`, text: csv([['item_en', 'item_fa', 'qty', 'amount'], ...r.top.map(x => [x.en, x.fa, x.qty, x.amount])]) };
    }
    if (kind === 'daily') {
      const rows = [['date', 'date_hijri', 'orders', 'sales', 'ingredient_cost', 'expenses', 'withdrawals', 'profit']];
      for (const d of C.period('year', today(), cal()).days) {
        if (d > today()) break;
        const r = C.report(S, [d]);
        if (!r.orders && !r.expenses && !r.withdrawals) continue;
        rows.push([d, hj(d), r.orders, r.net, C.r2(r.cogs), r.expenses, r.withdrawals, C.r2(r.profit)]);
      }
      return { name: `senso-daily-totals-${tag}.csv`, text: csv(rows) };
    }
    if (kind === 'expenses') return { name: `senso-expenses-${tag}.csv`, text: csv([['date', 'date_hijri', 'category', 'amount', 'paid_from', 'note'], ...S.expenses.slice().sort((a, b) => a.at - b.at).map(e => [e.day, hj(e.day), expName(e.cat), e.amount, e.method, e.note])]) };
    if (kind === 'withdrawals') return { name: `senso-withdrawals-${tag}.csv`, text: csv([['date', 'date_hijri', 'person', 'amount', 'reason'], ...S.withdrawals.slice().sort((a, b) => a.at - b.at).map(w => [w.day, hj(w.day), w.person, w.amount, w.note])]) };
    if (kind === 'customers') return { name: `senso-customers-${tag}.csv`, text: csv([['name', 'phone', 'owes', 'points', 'visits', 'note'], ...S.customers.map(c => [c.name, c.phone, c.balance || 0, c.points || 0, c.visits || 0, c.note])]) };
    if (kind === 'stock') return { name: `senso-stock-${tag}.csv`, text: csv([['ingredient_en', 'ingredient_fa', 'in_stock', 'unit', 'reorder_at', 'cost_per_unit', 'value', 'supplier'], ...S.ings.map(i => [i.name, i.nameFa, i.qty, i.unit, i.min, i.cost || 0, C.r2((i.qty || 0) * (i.cost || 0)), i.supplier])]) };
    return { name: `senso-menu-${tag}.csv`, text: csv([['item_fa', 'item_en', 'category', 'price', 'cost', 'shown'], ...S.menu.map(m => [m.fa, m.en, catName(m.cat), m.price, C.itemCost(m, S), m.active ? 'yes' : 'no'])]) };
  }

  /* ---------- receipts and printing ---------- */
  function receiptHTML(o) {
    const s = S.settings, sh = s.shop, cust = o.customer && C.byId(S.customers, o.customer);
    return `<div class="rc" style="--pw:${+s.paper || 80}mm"><div class="c"><div class="nm">${esc(sh.name)}</div><div class="fa">${esc(sh.fa)}${sh.tagline ? ' · ' + esc(sh.tagline) : ''}</div><div class="sm">${esc(sh.phone)}${sh.insta ? ' · ' + esc(sh.insta) : ''}</div>${sh.address ? `<div class="sm">${esc(sh.address)}</div>` : ''}</div>
      <div class="cut"></div><div class="r"><b>#${I.n(o.no)}</b><span>${esc(o.table)} ${t(o.service === 'take' ? 'take' : o.service === 'delivery' ? 'delivery' : 'dine')}</span></div><div class="r sm"><span>${fmtDay(o.day)}</span><span>${fmtTime(o.at)}</span></div>
      ${cust ? `<div class="r sm"><span>${t('customer')}</span><span>${esc(cust.name)}</span></div>` : ''}${o.status === 'void' ? '<div class="void">VOID · باطل</div>' : ''}
      <div class="cut"></div>${o.items.map(i => `<div class="r"><span class="fa">${esc(i.fa)}</span><span>${I.n(i.qty * i.price)}</span></div><div class="r sm"><span>${esc(i.en)}</span><span>${I.n(i.qty)} × ${I.n(i.price)}</span></div>`).join('')}
      <div class="cut"></div>${o.discount || o.pointsValue || o.tax ? `<div class="r"><span>${t('subtotal')}</span><span>${I.n(o.sub)}</span></div>` : ''}${o.discount ? `<div class="r"><span>${t('discount')}</span><span>−${I.n(o.discount)}</span></div>` : ''}${o.pointsValue ? `<div class="r"><span>${t('points_disc')}</span><span>−${I.n(o.pointsValue)}</span></div>` : ''}${o.tax ? `<div class="r"><span>${t('tax')}</span><span>${I.n(o.tax)}</span></div>` : ''}
      <div class="r big"><span>${t('total')}</span><span>${M(o.total)}</span></div><div class="r sm"><span>${t('pay_by')}</span><span>${esc(payName(o.pay))}</span></div>
      ${o.received ? `<div class="r sm"><span>${t('received')}</span><span>${I.n(o.received)}</span></div><div class="r sm"><span>${t('change')}</span><span>${I.n(o.change)}</span></div>` : ''}
      ${cust && (o.pointsEarned || cust.balance) ? `<div class="r sm"><span>${t('points')}</span><span>+${I.n(o.pointsEarned)} → ${I.n(cust.points)}</span></div>${cust.balance > 0 ? `<div class="r sm"><span>${t('owes')}</span><span>${M(cust.balance)}</span></div>` : ''}` : ''}
      ${o.note ? `<div class="sm" style="margin-top:6px">${t('note')}: ${esc(o.note)}</div>` : ''}<div class="cut"></div><div class="c sm">${esc(sh.footer)}</div></div>`;
  }
  async function printHTML(html) {
    const w = +S.settings.paper || 80;
    $('#print-area').innerHTML = `<style>@page{size:${w}mm auto;margin:0}#print-area .rc{width:${w}mm;box-shadow:none;margin:0;max-width:none}</style>${html}`;
    try {
      if (native && native.print) await native.print({ silent: !!S.settings.silentPrint });
      else if (FS.kind === 'android') { const tx = $('#print-area').innerText; await FS.shareText(tx, t('print_receipt')); }
      else window.print();
    } catch (e) { toast(String(e && e.message || e), true); }
  }
  function receiptText(o) {
    const sh = S.settings.shop, L = [sh.name, `${sh.fa} · ${sh.tagline}`, `${sh.phone} · ${sh.insta}`, '------------------------------', `#${o.no}  ${o.table || ''}`, `${fmtDay(o.day)} ${fmtTime(o.at)}`];
    if (o.status === 'void') L.push('*** VOID ***');
    L.push('------------------------------'); o.items.forEach(i => L.push(`${i.qty} × ${i.fa} (${i.en})  ${I.n(i.qty * i.price)}`));
    L.push('------------------------------'); if (o.discount) L.push(`${t('discount')} −${I.n(o.discount)}`); L.push(`${t('total')} ${M(o.total)}`, `${t('pay_by')}: ${payName(o.pay)}`); if (o.note) L.push(`${t('note')}: ${o.note}`); L.push('', sh.footer);
    return L.join('\n');
  }
  function openReceipt(o, fresh) {
    U.edit = { kind: 'order', obj: o };
    openSheet('receipt', `${fresh ? `<div class="done"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><div><b>${M(o.total)}</b><span>${esc(payName(o.pay))}${o.change ? ' · ' + t('change') + ' ' + M(o.change) : ''}</span></div></div>` : ''}<div class="sh"><h2>${fresh ? t('order_done', { n: I.n(o.no) }) : '#' + I.n(o.no)}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
      <div class="preview-r">${receiptHTML(o)}</div>
      <div class="actions"><button class="btn go" data-act="printReceipt">${svg('print')}${t('print_receipt')}</button><button class="btn" data-act="copyReceipt">${t('copy_text')}</button>
      ${fresh ? `<button class="btn ink" data-act="close">${t('next_order')}</button>` : o.status !== 'void' ? `<button class="btn danger quiet" data-act="voidOrder">${t('void_order')}</button>` : ''}</div>
      ${!fresh && o.status !== 'void' ? `<label class="f" id="void-wrap" hidden>${t('void_reason')}<input id="void-reason"></label>` : ''}${o.voidReason ? `<p class="hint">${t('voided')}: ${esc(o.voidReason)}</p>` : ''}`);
  }
  function reportPrintHTML() {
    const { kind, anchor } = U.rep; const r = C.report(S, C.period(kind, anchor, cal()).days); const sh = S.settings.shop;
    const row = (l, v) => `<div class="r"><span>${l}</span><span>${v}</span></div>`;
    return `<div class="rc" style="--pw:${+S.settings.paper || 80}mm"><div class="c"><div class="nm">${esc(sh.name)}</div><div>${t('reports_title')}</div><div class="sm">${periodLabel(kind, anchor)}</div></div><div class="cut"></div>
      ${row(t('net_sales'), M(r.net))}${row(t('orders'), I.n(r.orders))}${row(t('avg_order'), M(r.avg))}${row(t('items_sold'), I.n(r.items))}<div class="cut"></div>
      ${Object.entries(r.byPay).map(([k, v]) => row(payName(k), M(v))).join('')}<div class="cut"></div>
      ${row(t('discounts'), M(r.discounts))}${row(t('voids'), `${I.n(r.voidCount)} · ${M(r.voidValue)}`)}${row(t('cogs'), M(r.cogs))}${row(t('expenses'), M(r.expenses))}${row(t('waste'), M(r.waste))}
      <div class="r big"><span>${t('profit')}</span><span>${M(r.profit)}</span></div>${row(t('withdrawals'), M(r.withdrawals))}<div class="cut"></div>
      ${r.top.slice(0, 10).map(x => row(`${esc(x.fa)}`, `${I.n(x.qty)} · ${I.n(x.amount)}`)).join('')}</div>`;
  }
  async function saveFile(name, text, mime, folder = 'Exports') {
    try {
      const where = await FS.save(folder, name, text, mime);
      if (FS.kind !== 'web') toast(t('saved_to', { w: FS.kind === 'win' ? where : (await FS.where()) + '/' + folder }));
      return where;
    } catch (e) { toast(t('save_failed') + ' ' + String(e && e.message || e), true); return null; }
  }
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast(ok); }
    catch (_) { openSheet('copy', `<div class="sh"><h2>${t('copy_text')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div><textarea id="copybox" rows="14" readonly>${esc(text)}</textarea>`); const b = $('#copybox'); b.focus(); b.select(); }
  }

  /* ---------- sheets ---------- */
  function openSheet(kind, html, cls) {
    U.sheet = kind; const s = $('#sheet');
    s.innerHTML = `<div class="sheet ${cls || ''}" role="dialog" aria-modal="true">${dots(html)}</div>`; s.hidden = false; document.body.classList.add('noscroll');
    setTimeout(() => { const f = s.querySelector('input:not([type=checkbox]):not([type=file]):not([type=color])'); if (f && kind !== 'receipt' && kind !== 'customer' && matchMedia('(min-width:861px)').matches) f.focus(); }, 50);
  }
  function closeSheet() { const s = $('#sheet'); s.hidden = true; s.innerHTML = ''; U.sheet = null; U.edit = null; document.body.classList.remove('noscroll'); }
  function pinSheet(then) {
    let v = '';
    const draw = () => { $('#pin-dots').innerHTML = Array.from({ length: Math.max(4, S.settings.ownerPin.length) }, (_, i) => `<i class="${i < v.length ? 'on' : ''}"></i>`).join(''); };
    openSheet('pin', `<div class="sh"><h2>${t('enter_pin')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div><div class="pin-dots" id="pin-dots"></div>
      <div class="pin-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<button data-pin="${k}">${typeof k === 'number' ? I.d(k) : k}</button>`).join('')}</div>`);
    draw();
    const tryIt = () => {
      if (v === S.settings.ownerPin) { U.unlocked = true; closeSheet(); then(); }
      else { const p = $('.pin-pad'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); v = ''; draw(); toast(t('wrong_pin'), true); }
    };
    U.pinKey = k => {
      if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') return tryIt(); else if (v.length < 8) v += k;
      draw(); if (v.length === S.settings.ownerPin.length) tryIt();
    };
  }
  const needPin = fn => (S.settings.ownerPin && !U.unlocked ? pinSheet(fn) : fn());

  /* ---------- actions ---------- */
  const val = id => (document.getElementById(id) || {}).value ?? '';
  const ACT = {
    tab: id => { if (isLocked(id)) { pinSheet(() => go(id)); return; } go(id); },
    more: () => openSheet('more', `<div class="sh"><h2>${t('nav_more')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div><div class="more-grid">${['customers', 'menu', 'stock', 'buy', 'make', 'backup', 'settings'].map(k => `<button data-act="moreGo" data-id="${k}">${svg(k)}${t('nav_' + k)}</button>`).join('')}</div>`),
    moreGo: id => { closeSheet(); ACT.tab(id); },
    lang: () => setSettings({ lang: S.settings.lang === 'fa' ? 'en' : 'fa', digits: S.settings.lang === 'fa' ? 'en' : 'fa', calendar: S.settings.lang === 'fa' ? S.settings.calendar : 'hijri' }).then(() => { applyLook(); U.anim = true; render(); }),
    theme: () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; setSettings({ theme: dark ? 'light' : 'dark' }).then(applyLook); },
    close: () => closeSheet(),
    cat: id => { U.cat = id; render(); },
    add: (id, el) => {
      const c = U.cart.find(x => x.id === id); if (c) c.qty++; else U.cart.push({ id, qty: 1 });
      U.lastAdded = id; const m = C.byId(S.menu, id); buzz(); render(); U.lastAdded = null;
      fly(document.querySelector(`.tile[data-id="${CSS.escape(id)}"]`) || el, m ? m.color : '#F2B632');
    },
    cashQuick: id => { U.ord.received = String(id); render(); },
    inc: id => { const c = U.cart.find(x => x.id === id); if (c) c.qty++; render(); },
    dec: id => { const c = U.cart.find(x => x.id === id); if (!c) return; if (--c.qty <= 0) U.cart = U.cart.filter(x => x !== c); render(); },
    clearcart: (id, el) => armed(el, () => { U.cart = []; U.ord = blankOrder(); render(); }),
    svc: id => { U.ord.service = id; render(); },
    pay: id => { U.ord.pay = id; if (id === 'credit' && !U.ord.customer) ACT.pickCustomer(); render(); },
    dtype: () => { U.ord.dType = U.ord.dType === 'pct' ? 'amt' : 'pct'; render(); },
    openTicket: () => openSheet('ticket', `<div class="sh"><h2>${t('new_order')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>${ticketBody()}`, 'ticket-sheet'),
    pickCustomer: () => {
      const back = U.sheet === 'ticket';
      const list = S.customers.slice().sort((a, b) => (b.last || 0) - (a.last || 0));
      openSheet('pick', `<div class="sh"><h2>${t('pick_customer')}</h2><button class="x" data-act="close" aria-label="${t('close')}">×</button></div>
        <div class="two"><input id="pk-q" data-bind="pickQ" placeholder="${t('search')}" autocomplete="off"><button class="btn go" data-act="quickCustomer">${t('add_customer')}</button></div>
        <div class="list" id="pk-list">${pickRows(list)}</div>${U.ord.customer ? `<button class="btn quiet" data-act="setCustomer" data-id="">${t('no_customer')}</button>` : ''}`);
      U.pickBack = back;
    },
    setCustomer: id => { U.ord.customer = id || null; U.ord.pointsUse = ''; if (!id && U.ord.pay === 'credit') U.ord.pay = 'cash'; closeSheet(); if (U.pickBack) ACT.openTicket(); render(); },
    quickCustomer: () => { const name = val('pk-q').trim(); if (!name) { $('#pk-q').focus(); return; } const c = { id: C.uid('c'), name, phone: '', note: '', balance: 0, points: 0, visits: 0, created: Date.now() }; commit([{ store: 'customers', put: c }]).then(() => ACT.setCustomer(c.id)); },
    checkout: async (id, el) => {
      if (el.disabled) return;
      let res;
      try { res = C.checkout(S, { cart: U.cart, ...U.ord, discountType: U.ord.dType, discountValue: U.ord.dVal }); }
      catch (e) { toast(t('err_' + (e.code || 'empty')), true); if (e.code === 'credit_needs_customer') ACT.pickCustomer(); return; }
      el.disabled = true;
      await commit(res.changes);
      U.cart = []; U.ord = blankOrder(); if (U.sheet) closeSheet(); render();
      openReceipt(res.order, true);
    },
    hold: () => { const p = { id: C.uid('h'), at: Date.now(), cart: U.cart.map(c => ({ ...c })), ord: { ...U.ord } }; if (U.ord.parkedId) p.id = U.ord.parkedId; commit([{ store: 'parked', put: p }], t('order_held')).then(() => { U.cart = []; U.ord = blankOrder(); if (U.sheet) closeSheet(); render(); }); },
    resume: id => { const p = C.byId(S.parked, id); if (!p) return; U.cart = p.cart.map(c => ({ ...c })).filter(c => C.byId(S.menu, c.id)); U.ord = { ...blankOrder(), ...p.ord, parkedId: p.id }; render(); },
    order: id => { const o = C.byId(S.orders, id); if (o) openReceipt(o, false); },
    oday: id => { U.ordersDay = id; render(); },
    printReceipt: () => printHTML(receiptHTML(U.edit.obj)),
    copyReceipt: () => copy(receiptText(U.edit.obj), t('copied')),
    voidOrder: () => {
      const oid = U.edit && U.edit.obj && U.edit.obj.id;
      needPin(() => {
        if (U.sheet !== 'receipt') openReceipt(C.byId(S.orders, oid), false);
        const w = $('#void-wrap'); if (w && w.hidden) { w.hidden = false; $('#void-reason').focus(); }
        armed(document.querySelector('[data-act="voidOrder"]'), async () => { await commit(C.voidOrder(S, oid, val('void-reason')), t('order_voided')); closeSheet(); });
      });
    },
    repKind: id => { U.rep.kind = id; U.anim = true; render(); },
    repPrev: () => { U.rep.anchor = C.shift(U.rep.kind, U.rep.anchor, cal(), -1); U.anim = true; render(); },
    repNext: () => { U.rep.anchor = C.shift(U.rep.kind, U.rep.anchor, cal(), 1); U.anim = true; render(); },
    repNow: () => { U.rep.anchor = today(); U.anim = true; render(); },
    repPrint: () => printHTML(reportPrintHTML()),
    repCsv: () => {
      const days = new Set(C.period(U.rep.kind, U.rep.anchor, cal()).days);
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['order_no', 'date', 'date_hijri', 'time', 'service', 'table', 'customer', 'payment', 'status', 'item_en', 'item_fa', 'qty', 'unit_price', 'line_total', 'order_discount', 'order_total']];
      for (const o of S.orders.filter(o => days.has(o.day))) {
        const h = C.hasHijri ? C.hijri(o.day) : null; const cu = o.customer ? (C.byId(S.customers, o.customer) || {}).name : '';
        for (const i of o.items) rows.push([o.no, o.day, h ? `${h.y}-${h.m}-${h.d}` : '', new Date(o.at).toTimeString().slice(0, 5), o.service, o.table, cu, o.pay, o.status, i.en, i.fa, i.qty, i.price, i.qty * i.price, o.discount, o.total]);
      }
      const ex = S.expenses.filter(e => days.has(e.day));
      if (ex.length) { rows.push([]); rows.push(['expense_date', 'category', 'amount', 'paid_from', 'note']); for (const e of ex) rows.push([e.day, expName(e.cat), e.amount, e.method, e.note]); }
      const wd = S.withdrawals.filter(e => days.has(e.day));
      if (wd.length) { rows.push([]); rows.push(['withdrawal_date', 'person', 'amount', 'reason']); for (const w of wd) rows.push([w.day, w.person, w.amount, w.note]); }
      saveFile(`senso-${U.rep.kind}-${U.rep.anchor}.csv`, '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv');
    },
    moneyTab: id => { U.money = id; U.anim = true; render(); },
    addExpense: () => {
      const amount = C.num(val('e-amt')); if (!(amount > 0)) { toast(t('amount'), true); $('#e-amt').focus(); return; }
      const day = val('e-day') || today(); const at = day === today() ? Date.now() : C.fromKey(day).getTime();
      commit([{ store: 'expenses', put: { id: C.uid('ex'), at, day, cat: val('e-cat'), amount, method: val('e-method'), note: val('e-note').trim() } }], t('saved'));
    },
    delExpense: (id, el) => armed(el, () => commit([{ store: 'expenses', del: id }], t('deleted'))),
    addWithdrawal: () => {
      const amount = C.num(val('w-amt')), person = val('w-person').trim();
      if (!person) { $('#w-person').focus(); return; } if (!(amount > 0)) { $('#w-amt').focus(); return; }
      const day = val('w-day') || today(); const at = day === today() ? Date.now() : C.fromKey(day).getTime();
      commit([{ store: 'withdrawals', put: { id: C.uid('wd'), at, day, person, amount, note: val('w-note').trim() } }], t('saved'));
    },
    delWithdrawal: (id, el) => armed(el, () => commit([{ store: 'withdrawals', del: id }], t('deleted'))),
    closeDayBtn: () => {
      const day = U.closeDay, cs = C.cashSummary(S, day, C.num(val('c-open'))), counted = val('c-count') === '' ? cs.expected : C.num(val('c-count'));
      U.closeCounted = null; U.closeOpening = null;
      commit([{ store: 'closes', put: { id: 'close-' + day, day, at: Date.now(), ...cs, counted, diff: C.r2(counted - cs.expected), note: val('c-note').trim() } }], t('day_closed'));
    },
    custF: id => { U.custF = id; render(); },
    newCustomer: () => customerSheet(null),
    openCustomer: id => customerSheet(C.byId(S.customers, id)),
    saveCustomer: () => {
      const c = { ...U.edit.obj, name: val('cu-name').trim(), phone: val('cu-phone').trim(), note: val('cu-note').trim() };
      if (!c.name) { $('#cu-name').focus(); return; }
      commit([{ store: 'customers', put: c }], t('saved')).then(closeSheet);
    },
    delCustomer: (id, el) => armed(el, () => commit([{ store: 'customers', del: U.edit.obj.id }], t('deleted')).then(closeSheet)),
    receivePay: () => {
      const ch = C.receivePayment(S, U.edit.obj.id, val('p-amt'), val('p-method'), '');
      if (!ch.length) { $('#p-amt').focus(); return; }
      commit(ch, t('payment_saved')).then(() => customerSheet(C.byId(S.customers, U.edit.obj.id)));
    },
    newItem: () => itemSheet(null),
    editItem: id => itemSheet(C.byId(S.menu, id)),
    addLine: () => { syncItem(); U.edit.obj.recipe.push({ ing: '', qty: '' }); $('#e-recipe').innerHTML = recipeRows(); },
    rmLine: ix => { syncItem(); U.edit.obj.recipe.splice(+ix, 1); $('#e-recipe').innerHTML = recipeRows(); },
    saveItem: async () => {
      syncItem(); const m = U.edit.obj; const changes = [];
      if (!m.fa && !m.en) { $('#e-fa').focus(); return; }
      if (m.cat === '__new') {
        const fa = val('e-cat-fa').trim(), en = val('e-cat-en').trim(); if (!fa && !en) { $('#e-cat-fa').focus(); return; }
        const key = 'cat-' + Date.now().toString(36);
        changes.push({ store: 'cats', put: [...S.cats, { key, fa: fa || en, en: en || fa, look: val('e-cat-look') || 'glass', ord: S.cats.length }] });
        m.cat = key;
      }
      const price = C.num(m.price); if (!(price >= 0) || m.price === '') { $('#e-price').focus(); return; }
      changes.push({ store: 'menu', put: { ...m, price: Math.round(price), cost: C.r2(C.num(m.cost)), recipe: m.recipe.filter(l => l.ing && C.num(l.qty) > 0).map(l => ({ ing: l.ing, qty: C.r3(C.num(l.qty)) })) } });
      await commit(changes, t('saved')); closeSheet();
    },
    delItem: (id, el) => armed(el, async () => { const mid = U.edit.obj.id; await commit([{ store: 'menu', del: mid }], t('deleted')); U.cart = U.cart.filter(c => c.id !== mid); closeSheet(); render(); }),
    iinc: id => { const i = C.byId(S.ings, id); if (i) commit(C.adjustStock(S, id, step(i.unit), 'manual')); },
    idec: id => { const i = C.byId(S.ings, id); if (i) commit(C.adjustStock(S, id, -step(i.unit), 'manual')); },
    stockMove: (id, el) => { const i = C.byId(S.ings, id); if (i) stockMoveSheet(i, el.dataset.kind); },
    saveMove: async () => {
      const i = U.edit.obj, kind = U.edit.move, q = C.num(val('mv-qty'));
      if (!(q > 0)) { $('#mv-qty').focus(); return; }
      await commit(C.adjustStock(S, i.id, kind === 'waste' ? -q : q, kind, { unitCost: kind === 'receive' ? val('mv-cost') : null, asExpense: kind === 'receive' && $('#mv-exp') && $('#mv-exp').checked, note: val('mv-note') }), t('saved'));
      closeSheet();
    },
    newIng: () => ingSheet(null),
    editIng: id => ingSheet(C.byId(S.ings, id)),
    saveIng: async () => {
      const i = { ...U.edit.obj, nameFa: val('g-fa').trim(), name: val('g-en').trim(), qty: C.r3(C.num(val('g-qty'))), unit: val('g-unit'), min: C.r3(C.num(val('g-min'))), cost: C.r2(C.num(val('g-cost'))), supplier: val('g-sup').trim() };
      if (!i.name && !i.nameFa) { $('#g-fa').focus(); return; }
      if (!i.name) i.name = i.nameFa; if (!i.nameFa) i.nameFa = i.name;
      await commit([{ store: 'ings', put: i }], t('saved')); closeSheet();
    },
    delIng: (id, el) => armed(el, async () => {
      const iid = U.edit.obj.id;
      const ch = [{ store: 'ings', del: iid }, ...S.menu.filter(m => m.recipe.some(l => l.ing === iid)).map(m => ({ store: 'menu', put: { ...m, recipe: m.recipe.filter(l => l.ing !== iid) } }))];
      await commit(ch, t('deleted')); closeSheet();
    }),
    sf: id => { U.stockF = id; render(); },
    sampleDone: () => setSettings({ sampleStock: false }, t('saved')),
    recv: id => { const q = C.num(val('b-' + id)); if (!(q > 0)) return; const i = C.byId(S.ings, id); stockMoveSheet(i, 'receive'); $('#mv-qty').value = I.d(q); },
    lowToList: id => { const i = C.byId(S.ings, id); const q = C.num(val('b-' + id)) || sugg(i); if (S.shopping.some(s => s.ing === id && !s.done)) { toast(ingName(i)); return; } commit([{ store: 'shopping', put: { id: C.uid('s'), text: ingName(i), qty: q, unit: i.unit, ing: id, done: false, at: Date.now() } }], t('saved')); },
    shAdd: () => {
      const text = val('sh-text').trim(); if (!text) { $('#sh-text').focus(); return; }
      const m = S.ings.find(g => [g.name, g.nameFa].some(n => (n || '').toLowerCase() === text.toLowerCase()));
      commit([{ store: 'shopping', put: { id: C.uid('s'), text, qty: C.num(val('sh-qty')), unit: m ? m.unit : '', ing: m ? m.id : null, done: false, at: Date.now() } }]).then(() => { const e = $('#sh-text'); if (e) { e.value = ''; e.focus(); } });
    },
    shToggle: (id, el) => {
      const s = C.byId(S.shopping, id); if (!s) return; const done = el.checked; const ch = [{ store: 'shopping', put: { ...s, done } }];
      if (s.ing && s.qty > 0) ch.push(...C.adjustStock(S, s.ing, done ? s.qty : -s.qty, done ? 'receive' : 'manual'));
      commit(ch);
    },
    shDel: id => commit([{ store: 'shopping', del: id }]),
    shClear: (id, el) => armed(el, () => commit(S.shopping.filter(s => s.done).map(s => ({ store: 'shopping', del: s.id })))),
    copyList: () => {
      const L = [`${t('shopping_list')} · ${S.settings.shop.name} · ${fmtDay(today())}`, ''];
      const listed = new Set(S.shopping.filter(s => !s.done && s.ing).map(s => s.ing));
      S.shopping.filter(s => !s.done).forEach(s => L.push(`- ${s.text}${s.qty ? `: ${I.q(s.qty)} ${unitName(s.unit || '')}` : ''}`));
      C.lowIngs(S).filter(i => !listed.has(i.id)).forEach(i => L.push(`- ${ingName(i)}: ${I.q(sugg(i))} ${unitName(i.unit)}`));
      copy(L.join('\n'), t('copied'));
    },
    planAdd: () => { const id = val('p-item'), q = Math.max(1, Math.floor(C.num(val('p-qty')))); if (!id) { $('#p-item').focus(); return; } const p = U.plan.find(x => x.id === id); if (p) p.qty += q; else U.plan.push({ id, qty: q }); render(); },
    planRm: ix => { U.plan.splice(+ix, 1); render(); },
    planClear: () => { U.plan = []; render(); },
    planToList: () => {
      const need = {}; U.plan.forEach(p => (C.byId(S.menu, p.id) || { recipe: [] }).recipe.forEach(l => (need[l.ing] = (need[l.ing] || 0) + l.qty * p.qty)));
      const ch = [];
      for (const [id, q] of Object.entries(need)) {
        const i = C.byId(S.ings, id); if (!i) continue; const s = C.r3(q - i.qty); if (s <= 0) continue; const st = step(i.unit); const qty = Math.ceil(s / st) * st;
        const ex = S.shopping.find(x => x.ing === id && !x.done);
        ch.push({ store: 'shopping', put: ex ? { ...ex, qty: Math.max(ex.qty || 0, qty) } : { id: C.uid('s'), text: ingName(i), qty, unit: i.unit, ing: id, done: false, at: Date.now() } });
      }
      commit(ch, t('saved'));
    },
    prAdd: () => { const text = val('pr-text').trim(); if (!text) { $('#pr-text').focus(); return; } commit([{ store: 'prep', put: { id: C.uid('p'), text, done: false, at: Date.now() } }]).then(() => { const e = $('#pr-text'); if (e) e.focus(); }); },
    prToggle: (id, el) => { const p = C.byId(S.prep, id); if (p) commit([{ store: 'prep', put: { ...p, done: el.checked } }]); },
    prDel: id => commit([{ store: 'prep', del: id }]),
    prClear: (id, el) => armed(el, () => commit(S.prep.filter(p => p.done).map(p => ({ store: 'prep', del: p.id })))),
    setLang: id => setSettings({ lang: id }).then(() => { applyLook(); U.anim = true; render(); }),
    setCal: id => setSettings({ calendar: id }),
    setDigits: id => setSettings({ digits: id }).then(() => { applyLook(); render(); }),
    setTheme: id => setSettings({ theme: id }).then(applyLook),
    saveShop: () => setSettings({ shop: { name: val('st-name').trim() || 'Senso Bar', fa: val('st-fa').trim(), phone: val('st-phone').trim(), insta: val('st-insta').trim(), tagline: val('st-tag').trim(), address: val('st-addr').trim(), footer: val('st-foot').trim() },
      paper: +val('st-paper') || 80, currency: val('st-cur').trim() || '؋', taxRate: C.clamp(C.num(val('st-tax')), 0, 100), silentPrint: !!($('#st-silent') && $('#st-silent').checked) }, t('saved')).then(applyLook),
    saveMore: () => setSettings({ pointsPer100: Math.max(0, C.num(val('st-pp'))), pointValue: Math.max(0, C.num(val('st-pv'))), openingCash: Math.max(0, C.num(val('st-open'))), ownerPin: C.ascii(val('st-pin')).replace(/\D/g, '').slice(0, 8) }, t('saved')).then(() => { U.unlocked = true; }),
    lockNow: () => { U.unlocked = false; go('sell'); },
    backup: () => ACT.backupNow(),
    backupNow: async () => { const w = await saveFile(backupName(), C.exportJSON(S), 'application/json', 'Backups'); if (w) { markBackup(); loadBackups(); } },
    shareBackup: () => FS.share(backupName(), C.exportJSON(S), t('share_backup')).catch(e => toast(String(e.message || e), true)),
    openFolder: id => FS.openFolder(id).catch(e => toast(String(e.message || e), true)),
    toggleAuto: (id, el) => setSettings({ autoBackup: el.checked }, t('saved')),
    shareSaved: async id => { try { FS.share(id, await FS.read('Backups', id), t('share_backup')); } catch (e) { toast(String(e.message || e), true); } },
    restoreSaved: (id, el) => armed(el, async () => {
      try { const s = C.importJSON(await FS.read('Backups', id)); await C.wipeAndLoad(db, s); S = s; applyLook(); toast(t('restored')); go('sell'); }
      catch (_) { toast(t('not_backup'), true); }
    }),
    delSaved: (id, el) => armed(el, async () => { await FS.remove('Backups', id).catch(() => {}); loadBackups(); }),
    exportSave: id => { const f = buildExport(id); saveFile(f.name, f.text, 'text/csv'); },
    exportShare: id => { const f = buildExport(id); FS.share(f.name, f.text, t('exp_' + id)).catch(e => toast(String(e.message || e), true)); },
    rmPhoto: () => { syncItem(); U.edit.obj.photo = ''; $('#e-photo').innerHTML = pic(U.edit.obj); },
    demoReset: (id, el) => armed(el, async () => { S = window.SensoDemo.build(C, SEED, { lang: S.settings.lang }); if (db) await C.wipeAndLoad(db, S); U.cart = []; U.ord = blankOrder(); applyLook(); toast(t('demo_restarted')); go('sell'); }),
    eraseAll: (id, el) => armed(el, async () => { const fresh = seedState(); fresh.settings = { ...fresh.settings, lang: S.settings.lang, digits: S.settings.digits, calendar: S.settings.calendar, theme: S.settings.theme, shop: S.settings.shop }; await C.wipeAndLoad(db, fresh); S = fresh; U.cart = []; U.ord = blankOrder(); toast(t('deleted')); go('sell'); }),
  };
  function pickRows(list) {
    return list.length ? list.slice(0, 50).map(c => `<button class="orow" data-act="setCustomer" data-id="${esc(c.id)}"><span class="avatar" style="--c:${hue(c.name)};width:38px;height:38px;font-size:15px">${esc(initials(c.name))}</span><span class="what"><div>${esc(c.name)}</div><small>${esc(I.d(c.phone || ''))} ${t('has_points', { n: I.n(c.points || 0) })}</small></span><span class="tot">${c.balance > 0 ? `<span class="pill bad">${M(c.balance)}</span>` : ''}</span></button>`).join('') : `<div style="padding:16px" class="muted">${t('no_customers')}</div>`;
  }
  function go(tab) { U.tab = tab; U.anim = true; if (tab === 'backup') U.backups = undefined; if (location.hash.slice(1) !== tab) history.replaceState(null, '', '#' + tab); closeSheet(); render(); scrollTo(0, 0); }
  const BIND = {
    q: el => { U.q = el.value; render(); }, ordersQ: el => { U.ordersQ = el.value; render(); }, stockQ: el => { U.stockQ = el.value; render(); }, custQ: el => { U.custQ = el.value; render(); },
    table: el => { U.ord.table = el.value; }, note: el => { U.ord.note = el.value; },
    dVal: el => { U.ord.dVal = el.value; render(); }, pointsUse: el => { U.ord.pointsUse = el.value; render(); },
    received: el => {
      U.ord.received = el.value; const p = safePrice(); const r = C.num(el.value);
      document.querySelectorAll('#tk-change').forEach(x => { x.hidden = !(r > 0); x.lastElementChild.textContent = M(r - p.total); });
    },
    closeOpening: el => { U.closeOpening = C.num(el.value); render(); }, closeCounted: el => { U.closeCounted = el.value; render(); },
    pickQ: el => { const q = el.value.trim().toLowerCase(); $('#pk-list').innerHTML = pickRows(S.customers.filter(c => !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q))); },
  };
  const CHANGE = {
    ordersDay: el => { if (el.value) { U.ordersDay = el.value; render(); } },
    closeDay: el => { if (el.value) { U.closeDay = el.value; U.closeCounted = null; U.closeOpening = null; render(); } },
    itemPhoto: el => {
      const f = el.files && el.files[0]; if (!f) return;
      const img = new Image(); const url = URL.createObjectURL(f);
      img.onload = () => {
        const n = 320, cv = document.createElement('canvas'); cv.width = n; cv.height = n;
        const s0 = Math.min(img.naturalWidth, img.naturalHeight);
        cv.getContext('2d').drawImage(img, (img.naturalWidth - s0) / 2, (img.naturalHeight - s0) / 2, s0, s0, 0, 0, n, n);
        U.edit.obj.photo = cv.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(url);
        $('#e-photo').innerHTML = pic(U.edit.obj);
      };
      img.onerror = () => { URL.revokeObjectURL(url); toast(t('save_failed'), true); };
      img.src = url; el.value = '';
    },
    eCat: el => { $('#e-newcat').hidden = el.value !== '__new'; },
    rIng: el => { const i = C.byId(S.ings, el.value); const u = document.getElementById('r-u-' + el.dataset.id); if (u) u.textContent = i ? unitName(i.unit) : ''; },
    restore: async el => {
      const f = el.files && el.files[0]; if (!f) return;
      try { const s = C.importJSON(await f.text()); await C.wipeAndLoad(db, s); S = s; applyLook(); toast(t('restored')); go('sell'); }
      catch (_) { toast(t('not_backup'), true); }
      el.value = '';
    },
  };
  document.addEventListener('click', e => {
    if (e.target.id === 'sheet') { closeSheet(); return; }
    const pin = e.target.closest('[data-pin]'); if (pin && U.pinKey) { U.pinKey(pin.dataset.pin === '0' ? '0' : isNaN(+pin.dataset.pin) ? pin.dataset.pin : pin.dataset.pin); return; }
    const el = e.target.closest('[data-act]'); if (!el || !S) return;
    if (!(el.tagName === 'INPUT')) e.preventDefault();
    const f = ACT[el.dataset.act]; if (f) f(el.dataset.id, el, e);
  });
  document.addEventListener('input', e => { const b = e.target.dataset && e.target.dataset.bind; if (b && BIND[b]) BIND[b](e.target); });
  document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.change; if (c && CHANGE[c]) CHANGE[c](e.target); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && U.sheet) { closeSheet(); return; }
    if (U.sheet === 'pin' && /^[0-9۰-۹]$/.test(e.key)) { U.pinKey(C.ascii(e.key)); return; }
    if (U.sheet === 'pin' && e.key === 'Backspace') { U.pinKey('⌫'); return; }
    if (e.key !== 'Enter') return;
    const id = e.target.id;
    if (id === 'sh-text' || id === 'sh-qty') ACT.shAdd();
    else if (id === 'pr-text') ACT.prAdd();
    else if (id === 'p-qty') ACT.planAdd();
    else if (id === 'find') { const first = document.querySelector('.tile'); if (first) first.click(); }
    else if (id === 'pk-q') { const first = document.querySelector('#pk-list [data-act="setCustomer"]'); if (first) first.click(); else ACT.quickCustomer(); }
    else if (id === 'o-rec' || id === 'o-note' || id === 'o-table') { const b = document.querySelector('.charge'); if (b) b.click(); }
  });
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h !== U.tab && NAV.some(n => n[0] === h)) ACT.tab(h); });
  matchMedia('(max-width:860px)').addEventListener?.('change', () => { if (U.sheet === 'ticket') closeSheet(); render(); });
  if (matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => render());

  /* ---------- start ---------- */
  function seedState() {
    const s = C.emptyState(); s.menu = SEED.menu(); s.ings = SEED.ings(); return s;
  }
  async function start() {
    try {
      db = await C.openDB(DEMO ? 'senso-bar-demo' : undefined);
      const r = await C.loadAll(db);
      if (!r.seeded) { S = DEMO ? window.SensoDemo.build(C, SEED, { lang: QLANG }) : seedState(); await C.wipeAndLoad(db, S); } else S = r.state;
      if (QLANG && S.settings.lang !== QLANG) { const ch = [{ store: 'settings', put: { ...S.settings, lang: QLANG, digits: QLANG } }]; C.apply(S, ch); await C.save(db, ch); }
      const P = SEED.photos(); const fix = S.menu.filter(m => P[m.id] && (m.photo === undefined || /^img\/items\/.+\.jpg$/.test(m.photo))).map(m => ({ store: 'menu', put: { ...m, photo: P[m.id] } }));
      if (fix.length) { C.apply(S, fix); await C.save(db, fix); }
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (e) {
      console.error(e); db = null; S = DEMO ? window.SensoDemo.build(C, SEED, { lang: QLANG }) : seedState();
      setTimeout(() => toast(t('storage_fail'), true), 600);
    }
    applyLook();
    const h = location.hash.slice(1);
    U.tab = NAV.some(n => n[0] === h) && !isLocked(h) ? h : 'sell';
    render();
    scheduleBackup();
    if ('serviceWorker' in navigator && location.protocol === 'https:' && FS.kind === 'web') navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  start();
  window.__senso = { get state() { return S; }, U };
})();
