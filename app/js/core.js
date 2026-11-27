/* Senso Bar core: numbers, dates (Solar Hijri and Gregorian), storage, and
   the cafe's rules. No DOM here, so the rules run in tests under Node too. */
(function (root) {
  'use strict';
  const C = {};

  /* ---------- numbers ---------- */
  const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  C.ascii = s => String(s ?? '')
    .replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => AR.indexOf(d))
    .replace(/٫/g, '.').replace(/[٬,]/g, '');
  C.num = v => { const n = parseFloat(C.ascii(v)); return Number.isFinite(n) ? n : 0; };
  C.r2 = n => Math.round((+n || 0) * 100) / 100;
  C.r3 = n => Math.round((+n || 0) * 1000) / 1000;
  C.uid = p => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  C.clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------- dates ---------- */
  const pad = n => String(n).padStart(2, '0');
  C.dayKey = (d = new Date()) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  C.fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  C.addDays = (k, n) => { const d = C.fromKey(k); d.setDate(d.getDate() + n); return C.dayKey(d); };
  C.hour = at => new Date(at).getHours();

  let persianFmt = null;
  try { persianFmt = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }); } catch (_) { persianFmt = null; }
  C.hasHijri = !!persianFmt;
  const hijriCache = new Map();
  C.hijri = k => {
    let v = hijriCache.get(k);
    if (v) return v;
    const p = {};
    for (const x of persianFmt.formatToParts(C.fromKey(k))) if (x.type !== 'literal') p[x.type] = parseInt(x.value, 10);
    v = { y: p.year, m: p.month, d: p.day };
    hijriCache.set(k, v);
    return v;
  };
  C.parts = (k, cal) => {
    if (cal === 'hijri' && persianFmt) return C.hijri(k);
    const [y, m, d] = k.split('-').map(Number);
    return { y, m, d };
  };
  const cmp = (a, b) => a.y - b.y || a.m - b.m;
  /** Day keys of one calendar month. */
  C.monthDays = (y, m, cal) => {
    if (cal !== 'hijri' || !persianFmt) {
      const out = []; const n = new Date(y, m, 0).getDate();
      for (let d = 1; d <= n; d++) out.push(`${y}-${pad(m)}-${pad(d)}`);
      return out;
    }
    // Hijri year y starts near 21 March of y+621; walk to the first day of month m.
    let k = C.dayKey(new Date(y + 621, 2, 21 + Math.round((m - 1) * 30.5), 12));
    for (let i = 0; i < 80 && cmp(C.hijri(k), { y, m }) < 0; i++) k = C.addDays(k, 1);
    for (let i = 0; i < 80 && cmp(C.hijri(k), { y, m }) > 0; i++) k = C.addDays(k, -1);
    while (C.hijri(k).d > 1) k = C.addDays(k, -1);
    const out = [];
    while (C.hijri(k).m === m) { out.push(k); k = C.addDays(k, 1); }
    return out;
  };
  /** The days of the day, month or year containing `anchor`. */
  C.period = (kind, anchor, cal) => {
    const p = C.parts(anchor, cal);
    if (kind === 'day') return { kind, days: [anchor], y: p.y, m: p.m, d: p.d };
    if (kind === 'month') return { kind, days: C.monthDays(p.y, p.m, cal), y: p.y, m: p.m };
    const days = []; for (let m = 1; m <= 12; m++) days.push(...C.monthDays(p.y, m, cal));
    return { kind, days, y: p.y };
  };
  C.shift = (kind, anchor, cal, dir) => {
    if (kind === 'day') return C.addDays(anchor, dir);
    const per = C.period(kind, anchor, cal);
    const edge = dir < 0 ? C.addDays(per.days[0], -1) : C.addDays(per.days[per.days.length - 1], 1);
    return C.period(kind, edge, cal).days[0];
  };
  C.HIJRI_MONTHS = {
    fa: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
    en: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sunbula', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hut'],
  };
  C.GREG_MONTHS = {
    fa: ['جنوری', 'فبروری', 'مارچ', 'اپریل', 'می', 'جون', 'جولای', 'اگست', 'سپتامبر', 'اکتوبر', 'نومبر', 'دسامبر'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };
  C.WEEKDAYS = {
    fa: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };
  C.monthName = (m, cal, lang) => (cal === 'hijri' && persianFmt ? C.HIJRI_MONTHS : C.GREG_MONTHS)[lang === 'fa' ? 'fa' : 'en'][m - 1];

  /* ---------- defaults ---------- */
  C.DEFAULT_SETTINGS = {
    lang: 'fa', calendar: 'hijri', digits: 'fa', theme: 'auto', currency: '؋',
    shop: { name: 'Senso Bar', fa: 'سنسو بار', tagline: 'حس خوب', phone: '0794456022', insta: '@senso_bar_', address: '', footer: 'ممنون از شما · Thank you' },
    paper: 80, silentPrint: false, taxRate: 0, pointsPer100: 1, pointValue: 1,
    ownerPin: '', openingCash: 0, sampleStock: true,
    payMethods: [
      { id: 'cash', en: 'Cash', fa: 'نقد' },
      { id: 'card', en: 'Card', fa: 'کارت' },
      { id: 'mobile', en: 'Mobile money', fa: 'پول موبایلی' },
    ],
    expenseCats: [
      { id: 'supplies', en: 'Ingredients & supplies', fa: 'خرید مواد' },
      { id: 'salary', en: 'Salaries', fa: 'معاش کارمندان' },
      { id: 'rent', en: 'Rent', fa: 'کرایه' },
      { id: 'utilities', en: 'Electricity & water', fa: 'برق و آب' },
      { id: 'gas', en: 'Gas & fuel', fa: 'گاز و تیل' },
      { id: 'repairs', en: 'Repairs', fa: 'ترمیمات' },
      { id: 'packaging', en: 'Cups & packaging', fa: 'گیلاس و بسته‌بندی' },
      { id: 'transport', en: 'Transport', fa: 'ترانسپورت' },
      { id: 'other', en: 'Other', fa: 'متفرقه' },
    ],
  };
  C.DEFAULT_CATS = [
    ['shakes', 'Shakes', 'شیک ها', 'glass'], ['mocktails', 'Mocktails', 'ماکتیل ها', 'tall'], ['energy', 'Energy drinks', 'مقوی ها', 'glass'],
    ['smoothies', 'Smoothies', 'اسموتی ها', 'glass'], ['pancakes', 'Pancakes', 'پنکیک ها', 'stack'], ['waffles', 'Waffles', 'وافل ها', 'waffle'],
    ['crepe', 'Crepe', 'کرپ', 'crepe'], ['hot', 'Hot drinks', 'نوشیدنی گرم', 'mug'], ['tea', 'Tea & herbal', 'چای و دمنوش', 'mug'],
  ].map(([key, en, fa, look], i) => ({ key, en, fa, look, ord: i }));

  /* ---------- state ---------- */
  C.STORES = ['menu', 'ings', 'orders', 'parked', 'customers', 'payments', 'expenses', 'withdrawals', 'closes', 'stockLog', 'shopping', 'prep'];
  C.emptyState = () => {
    const s = { settings: structuredCloneSafe(C.DEFAULT_SETTINGS), cats: C.DEFAULT_CATS.map(c => ({ ...c })) };
    for (const k of C.STORES) s[k] = [];
    return s;
  };
  function structuredCloneSafe(o) { return JSON.parse(JSON.stringify(o)); }
  C.mergeSettings = saved => {
    const d = structuredCloneSafe(C.DEFAULT_SETTINGS);
    if (!saved) return d;
    return { ...d, ...saved, shop: { ...d.shop, ...(saved.shop || {}) } };
  };

  /** Apply a list of changes ({store, put} or {store, del}) to state in memory. */
  C.apply = (state, changes) => {
    for (const ch of changes) {
      if (ch.store === 'settings') { state.settings = ch.put; continue; }
      if (ch.store === 'cats') { state.cats = ch.put; continue; }
      const arr = state[ch.store];
      if (ch.put) {
        const i = arr.findIndex(x => x.id === ch.put.id);
        if (i >= 0) arr[i] = ch.put; else arr.push(ch.put);
      } else if (ch.del) {
        const i = arr.findIndex(x => x.id === ch.del);
        if (i >= 0) arr.splice(i, 1);
      }
    }
    return state;
  };

  /* ---------- lookups ---------- */
  C.byId = (arr, id) => arr.find(x => x.id === id);
  C.cat = (state, key) => state.cats.find(c => c.key === key) || { key, en: key, fa: key, look: 'glass', ord: 99 };
  C.ingState = i => (+i.qty || 0) <= 0 ? 'out' : (+i.qty || 0) <= (+i.min || 0) ? 'low' : 'ok';
  C.lowIngs = state => state.ings.filter(i => C.ingState(i) !== 'ok');
  C.recipeCost = (m, state) => C.r2((m.recipe || []).reduce((s, l) => { const i = C.byId(state.ings, l.ing); return s + (i && i.cost ? l.qty * i.cost : 0); }, 0));
  C.itemCost = (m, state) => (+m.cost > 0 ? +m.cost : C.recipeCost(m, state));
  C.canMake = (m, state) => {
    if (!m.recipe || !m.recipe.length) return null;
    let n = Infinity;
    for (const l of m.recipe) { const i = C.byId(state.ings, l.ing); if (!i || !(l.qty > 0)) continue; n = Math.min(n, Math.floor((+i.qty || 0) / l.qty + 1e-9)); }
    return n === Infinity ? null : Math.max(0, n);
  };
  C.usageOf = (lines, state) => {
    const u = {};
    for (const c of lines) {
      const m = C.byId(state.menu, c.id); if (!m) continue;
      for (const l of m.recipe || []) if (l.qty > 0 && l.ing) u[l.ing] = C.r3((u[l.ing] || 0) + l.qty * c.qty);
    }
    return u;
  };
  const stockChanges = (state, usage, sign) => Object.entries(usage).map(([id, q]) => {
    const i = C.byId(state.ings, id); if (!i) return null;
    return { store: 'ings', put: { ...i, qty: C.r3(Math.max(0, (+i.qty || 0) + sign * q)) } };
  }).filter(Boolean);

  /* ---------- selling ---------- */
  /** Price a cart. Throws Error with a `code` the UI translates. */
  C.price = (state, o) => {
    const set = state.settings;
    const lines = [];
    for (const c of o.cart || []) {
      const m = C.byId(state.menu, c.id);
      if (!m) { const e = new Error('item_gone'); e.code = 'item_gone'; throw e; }
      const qty = Math.max(1, Math.floor(c.qty));
      lines.push({ id: m.id, fa: m.fa, en: m.en, cat: m.cat, price: +m.price, cost: C.itemCost(m, state), qty });
    }
    const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const dv = Math.max(0, C.num(o.discountValue));
    let discount = o.discountType === 'pct' ? Math.round(sub * Math.min(dv, 100) / 100) : Math.round(dv);
    discount = C.clamp(discount, 0, sub);
    const cust = o.customer ? C.byId(state.customers, o.customer) : null;
    const pointsUse = cust ? C.clamp(Math.floor(C.num(o.pointsUse)), 0, cust.points || 0) : 0;
    const pointsValue = C.clamp(pointsUse * (+set.pointValue || 0), 0, sub - discount);
    const taxable = sub - discount - pointsValue;
    const tax = Math.round(taxable * (+set.taxRate || 0) / 100);
    const total = taxable + tax;
    return { lines, sub, discount, pointsUse: pointsValue > 0 ? pointsUse : 0, pointsValue, tax, total, cust };
  };

  /** Complete a sale: returns {order, changes}. */
  C.checkout = (state, o, now = Date.now()) => {
    const err = code => { const e = new Error(code); e.code = code; return e; };
    if (!o.cart || !o.cart.length) throw err('empty');
    const p = C.price(state, o);
    const pay = o.pay || 'cash';
    if (pay === 'credit' && !p.cust) throw err('credit_needs_customer');
    const day = C.dayKey(now);
    const no = state.orders.filter(x => x.day === day).reduce((mx, x) => Math.max(mx, x.no || 0), 0) + 1;
    const usage = C.usageOf(p.lines, state);
    const cogs = C.r2(p.lines.reduce((s, l) => s + l.cost * l.qty, 0));
    const received = pay === 'cash' ? Math.max(C.num(o.received), 0) : 0;
    const pointsEarned = p.cust ? Math.floor(p.total / 100) * (+state.settings.pointsPer100 || 0) : 0;
    const order = {
      id: C.uid('o'), no, at: now, day, items: p.lines, sub: p.sub, discount: p.discount,
      pointsUsed: p.pointsUse, pointsValue: p.pointsValue, tax: p.tax, total: p.total, cogs,
      pay, received, change: received ? Math.max(0, received - p.total) : 0,
      service: o.service || 'dine', table: String(o.table || '').slice(0, 40), note: String(o.note || '').slice(0, 300),
      customer: p.cust ? p.cust.id : null, pointsEarned, usage: Object.entries(usage).map(([ing, qty]) => ({ ing, qty })), status: 'paid',
    };
    const changes = [{ store: 'orders', put: order }, ...stockChanges(state, usage, -1)];
    if (p.cust) {
      changes.push({ store: 'customers', put: {
        ...p.cust,
        balance: C.r2((+p.cust.balance || 0) + (pay === 'credit' ? p.total : 0)),
        points: Math.max(0, (p.cust.points || 0) - p.pointsUse + pointsEarned),
        visits: (p.cust.visits || 0) + 1, last: now,
      } });
    }
    if (o.parkedId) changes.push({ store: 'parked', del: o.parkedId });
    return { order, changes };
  };

  /** Void an order: stock goes back, a credit sale comes off the customer's balance. */
  C.voidOrder = (state, id, reason, now = Date.now()) => {
    const o = C.byId(state.orders, id);
    if (!o || o.status === 'void') return [];
    const usage = {}; for (const u of o.usage || []) usage[u.ing] = u.qty;
    const changes = [{ store: 'orders', put: { ...o, status: 'void', voidReason: String(reason || '').slice(0, 200), voidAt: now } }, ...stockChanges(state, usage, 1)];
    const cust = o.customer && C.byId(state.customers, o.customer);
    if (cust) changes.push({ store: 'customers', put: {
      ...cust,
      balance: C.r2((+cust.balance || 0) - (o.pay === 'credit' ? o.total : 0)),
      points: Math.max(0, (cust.points || 0) + (o.pointsUsed || 0) - (o.pointsEarned || 0)),
    } });
    return changes;
  };

  /* ---------- customers, money, stock ---------- */
  C.receivePayment = (state, custId, amount, method, note, now = Date.now()) => {
    const c = C.byId(state.customers, custId); const a = C.r2(C.num(amount));
    if (!c || !(a > 0)) return [];
    const pay = { id: C.uid('pay'), customer: custId, at: now, day: C.dayKey(now), amount: a, method: method || 'cash', note: String(note || '').slice(0, 200) };
    return [{ store: 'payments', put: pay }, { store: 'customers', put: { ...c, balance: C.r2((+c.balance || 0) - a) } }];
  };
  C.adjustStock = (state, ingId, delta, kind, opts = {}, now = Date.now()) => {
    const i = C.byId(state.ings, ingId); if (!i) return [];
    const d = C.r3(delta);
    const qty = kind === 'count' ? C.r3(Math.max(0, d)) : C.r3(Math.max(0, (+i.qty || 0) + d));
    const moved = C.r3(qty - (+i.qty || 0));
    const unitCost = opts.unitCost != null && opts.unitCost !== '' ? C.num(opts.unitCost) : (+i.cost || 0);
    const changes = [{ store: 'ings', put: { ...i, qty, cost: kind === 'receive' && unitCost > 0 ? unitCost : i.cost } }];
    changes.push({ store: 'stockLog', put: { id: C.uid('sl'), at: now, day: C.dayKey(now), ing: ingId, kind, delta: moved, value: C.r2(Math.abs(moved) * unitCost), note: String(opts.note || '').slice(0, 200) } });
    if (kind === 'receive' && opts.asExpense && moved > 0 && unitCost > 0) {
      changes.push({ store: 'expenses', put: { id: C.uid('ex'), at: now, day: C.dayKey(now), cat: 'supplies', amount: C.r2(moved * unitCost), method: opts.method || 'cash', note: `${i.name} ${moved} ${i.unit}` } });
    }
    return changes;
  };

  /** Cash that should be in the drawer at the end of `day`. */
  C.cashSummary = (state, day, opening) => {
    const live = state.orders.filter(o => o.day === day && o.status !== 'void');
    const cashSales = live.filter(o => o.pay === 'cash').reduce((s, o) => s + o.total, 0);
    const cashIn = state.payments.filter(p => p.day === day && p.method === 'cash').reduce((s, p) => s + p.amount, 0);
    const cashExp = state.expenses.filter(e => e.day === day && e.method === 'cash').reduce((s, e) => s + e.amount, 0);
    const out = state.withdrawals.filter(w => w.day === day).reduce((s, w) => s + w.amount, 0);
    const open = C.num(opening);
    return { opening: open, cashSales, cashIn, cashExp, withdrawals: out, expected: C.r2(open + cashSales + cashIn - cashExp - out) };
  };

  /* ---------- reports ---------- */
  C.report = (state, days) => {
    const set = new Set(days);
    const all = state.orders.filter(o => set.has(o.day));
    const live = all.filter(o => o.status !== 'void');
    const voids = all.filter(o => o.status === 'void');
    const sum = (a, f) => a.reduce((s, x) => s + (+f(x) || 0), 0);
    const r = {
      orders: live.length, gross: sum(live, o => o.sub), discounts: sum(live, o => o.discount + (o.pointsValue || 0)), tax: sum(live, o => o.tax || 0),
      net: sum(live, o => o.total), cogs: sum(live, o => o.cogs || 0), items: sum(live, o => o.items.reduce((s, i) => s + i.qty, 0)),
      voidCount: voids.length, voidValue: sum(voids, o => o.total),
      creditSales: sum(live.filter(o => o.pay === 'credit'), o => o.total),
      creditCollected: sum(state.payments.filter(p => set.has(p.day)), p => p.amount),
      byPay: {}, byService: {}, byCat: {}, items_: {}, hours: {}, byDay: {},
    };
    for (const o of live) {
      r.byPay[o.pay] = (r.byPay[o.pay] || 0) + o.total;
      r.byService[o.service] = (r.byService[o.service] || 0) + o.total;
      r.hours[C.hour(o.at)] = (r.hours[C.hour(o.at)] || 0) + o.total;
      r.byDay[o.day] = (r.byDay[o.day] || 0) + o.total;
      for (const i of o.items) {
        r.byCat[i.cat] = (r.byCat[i.cat] || 0) + i.price * i.qty;
        const t = r.items_[i.id] || (r.items_[i.id] = { id: i.id, fa: i.fa, en: i.en, qty: 0, amount: 0 });
        t.qty += i.qty; t.amount += i.price * i.qty;
      }
    }
    r.top = Object.values(r.items_).sort((a, b) => b.qty - a.qty || b.amount - a.amount);
    delete r.items_;
    const ex = state.expenses.filter(e => set.has(e.day));
    r.expenses = sum(ex, e => e.amount);
    r.byExpense = {}; for (const e of ex) r.byExpense[e.cat] = (r.byExpense[e.cat] || 0) + e.amount;
    r.withdrawals = sum(state.withdrawals.filter(w => set.has(w.day)), w => w.amount);
    r.waste = sum(state.stockLog.filter(l => set.has(l.day) && l.kind === 'waste'), l => l.value);
    r.avg = r.orders ? r.net / r.orders : 0;
    r.grossProfit = r.net - r.tax - r.cogs;
    r.profit = r.grossProfit - r.expenses - r.waste;
    return r;
  };

  /* ---------- storage (IndexedDB) ---------- */
  const DB_NAME = 'senso-bar', DB_VER = 1;
  C.openDB = (name = DB_NAME) => new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('no_indexeddb'));
    const rq = indexedDB.open(name, DB_VER);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      for (const s of ['kv', ...C.STORES]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
    };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
  C.loadAll = async db => {
    const getAll = s => new Promise((res, rej) => { const rq = db.transaction(s).objectStore(s).getAll(); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
    const state = C.emptyState();
    const kv = await getAll('kv');
    const g = id => kv.find(x => x.id === id);
    if (g('settings')) state.settings = C.mergeSettings(g('settings').value);
    if (g('cats')) state.cats = g('cats').value;
    for (const s of C.STORES) state[s] = await getAll(s);
    state.orders.sort((a, b) => a.at - b.at);
    return { state, seeded: !!g('meta') };
  };
  /** Persist changes in one transaction. */
  C.save = (db, changes, extraKv = []) => new Promise((res, rej) => {
    const stores = new Set(['kv']);
    for (const c of changes) stores.add(c.store === 'settings' || c.store === 'cats' ? 'kv' : c.store);
    const tx = db.transaction([...stores], 'readwrite');
    for (const c of changes) {
      if (c.store === 'settings' || c.store === 'cats') tx.objectStore('kv').put({ id: c.store, value: c.put });
      else if (c.put) tx.objectStore(c.store).put(c.put);
      else if (c.del) tx.objectStore(c.store).delete(c.del);
    }
    for (const kv of extraKv) tx.objectStore('kv').put(kv);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error('aborted'));
  });
  C.wipeAndLoad = (db, state) => new Promise((res, rej) => {
    const tx = db.transaction(['kv', ...C.STORES], 'readwrite');
    for (const s of ['kv', ...C.STORES]) tx.objectStore(s).clear();
    tx.objectStore('kv').put({ id: 'settings', value: state.settings });
    tx.objectStore('kv').put({ id: 'cats', value: state.cats });
    tx.objectStore('kv').put({ id: 'meta', value: { seeded: true } });
    for (const s of C.STORES) for (const x of state[s] || []) tx.objectStore(s).put(x);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
  C.exportJSON = state => JSON.stringify({ format: 'senso-js/1', exported: new Date().toISOString(), ...state });
  C.importJSON = text => {
    const j = JSON.parse(text);
    if (!j || !Array.isArray(j.menu) || !Array.isArray(j.orders)) throw new Error('not_backup');
    const s = C.emptyState();
    s.settings = C.mergeSettings(j.settings); if (Array.isArray(j.cats)) s.cats = j.cats;
    for (const k of C.STORES) if (Array.isArray(j[k])) s[k] = j[k];
    return s;
  };

  root.SensoCore = C;
  if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
