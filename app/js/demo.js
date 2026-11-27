/* Example data for the demo link (index.html?demo). Made-up sales, customers,
   expenses and withdrawals over the last 75 days so every screen has something
   to show. Kept in its own browser database, separate from real data. */
(function (root) {
  'use strict';

  function rng(seed) { // mulberry32: the same example every time
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const COSTS = { // Afghani per unit
    milk: 50, icecream: 160, banana: 60, strawberry: 150, mango: 140, kiwi: 160, blueberry: 300, oreo: 3, creamcheese: 450,
    lotusbisc: 4, lotusspread: 600, chocsyrup: 350, nutella: 600, honey: 450, lemon: 5, lime: 6, mint: 20, sugarsyrup: 80, soda: 40,
    ice: 5, batter: 90, eggs: 7, crepemix: 100, nuts: 600, dates: 250, coffee: 1200, cocoa: 600, blacktea: 600, greentea: 700,
    saffron: 150, masala: 2, cups: 5, herbal: 900,
  };
  const SUPPLIERS = { milk: 'Kabul Dairy', icecream: 'Kabul Dairy', banana: 'Mandawi', strawberry: 'Mandawi', mango: 'Mandawi', kiwi: 'Mandawi', coffee: 'Shahr-e Naw Coffee' };
  const POPULAR = { // how often each item is ordered
    'm-shake-oreo': 9, 'm-shake-lotus': 8, 'm-shake-chocbanana': 7, 'm-shake-strawberry': 6, 'm-shake-vanilla': 4, 'm-mojito': 8, 'm-lemonade': 7,
    'm-banana-milk': 6, 'm-energy-bomb': 4, 'm-smoothie-mango': 6, 'm-smoothie-strawberry': 5, 'm-smoothie-kiwi': 3, 'm-smoothie-berry': 3,
    'm-smoothie-banana': 3, 'm-smoothie-mix': 4, 'm-pancake-senso': 5, 'm-pancake-nutella': 5, 'm-pancake-honey': 3, 'm-waffle-honey-nutella': 4,
    'm-waffle-senso': 5, 'm-waffle-nutella': 4, 'm-crepe': 5, 'm-espresso-single': 3, 'm-espresso-double': 2, 'm-hot-chocolate': 4,
    'm-masala-chai': 3, 'm-saffron-tea': 3, 'm-green-tea': 5, 'm-black-tea': 6,
  };
  const CUSTOMERS = [
    ['احمد شاه', '0700 123 456', 'Regular, likes Oreo shake'], ['مرسل', '0788 222 310', ''], ['فرید', '0729 845 112', 'Pays on Thursdays'],
    ['زهرا', '0766 410 905', ''], ['سحر', '0795 300 128', 'Office order, delivery'], ['ولی', '0711 654 980', ''],
  ];
  const TABLES = ['میز ۱', 'میز ۲', 'میز ۳', 'میز ۴', 'میز ۵', 'میز ۶', 'بالکن'];

  function build(C, Seed, opts = {}) {
    const r = rng(1405);
    const pick = a => a[Math.floor(r() * a.length)];
    const weighted = obj => { const e = Object.entries(obj); let x = r() * e.reduce((s, [, w]) => s + w, 0); for (const [k, w] of e) { if ((x -= w) <= 0) return k; } return e[0][0]; };
    const s = C.emptyState();
    s.menu = Seed.menu(); s.ings = Seed.ings();
    for (const i of s.ings) { const k = i.id.slice(2); i.cost = COSTS[k] || 0; i.supplier = SUPPLIERS[k] || ''; }
    const start = s.ings.map(i => ({ ...i }));
    s.settings.sampleStock = false;
    s.settings.openingCash = 1000;
    if (opts.lang === 'en') { s.settings.lang = 'en'; s.settings.digits = 'en'; }

    const now = Date.now();
    const custs = CUSTOMERS.map(([name, phone, note], i) => ({ id: 'c-demo-' + i, name, phone, note, balance: 0, points: 0, visits: 0, created: now - 80 * 864e5 }));
    s.customers.push(...custs);
    const at = (daysAgo, h, m) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, Math.floor(r() * 60), 0); return d.getTime(); };
    const apply = ch => C.apply(s, ch);
    const DAYS = 75;

    for (let back = DAYS - 1; back >= 0; back--) {
      const dayStart = at(back, 0, 0);
      const wd = new Date(dayStart).getDay();
      let n = 14 + Math.floor(r() * 10) + (wd === 5 ? 10 : wd === 4 ? 5 : 0) + Math.floor((DAYS - back) / 12);
      const events = [];
      for (let i = 0; i < n; i++) {
        const h = r() < 0.55 ? 15 + Math.floor(r() * 6) : 10 + Math.floor(r() * 12);
        events.push(at(back, h, Math.floor(r() * 60)));
      }
      events.sort((a, b) => a - b);
      for (const t of events) {
        if (t > now - 5 * 60e3) continue;
        const cart = [];
        const lines = r() < 0.5 ? 1 : r() < 0.7 ? 2 : 3;
        for (let l = 0; l < lines; l++) { const id = weighted(POPULAR); const c = cart.find(x => x.id === id); if (c) c.qty++; else cart.push({ id, qty: r() < 0.15 ? 2 : 1 }); }
        const cust = r() < 0.22 ? pick(custs) : null;
        let pay = r() < 0.72 ? 'cash' : r() < 0.45 ? 'card' : 'mobile';
        if (cust && r() < 0.35) pay = 'credit';
        const service = r() < 0.64 ? 'dine' : r() < 0.88 ? 'take' : 'delivery';
        const disc = r() < 0.06 ? { discountType: 'pct', discountValue: 10 } : {};
        try {
          const res = C.checkout(s, { cart, pay, customer: cust && cust.id, service, table: service === 'dine' ? pick(TABLES) : '', ...disc }, t);
          apply(res.changes);
          if (r() < 0.012) apply(C.voidOrder(s, res.order.id, 'Wrong item', t + 120e3));
        } catch (_) { /* skip */ }
      }
      // credit payments
      for (const c of s.customers) {
        const cur = C.byId(s.customers, c.id);
        if (cur.balance > 300 && r() < 0.18) apply(C.receivePayment(s, c.id, Math.round(cur.balance * (r() < 0.5 ? 1 : 0.5) / 10) * 10, r() < 0.8 ? 'cash' : 'mobile', '', at(back, 18, 30)));
      }
      // expenses and withdrawals
      const quiet = back === 0; // keep today's numbers about sales
      const ex = (cat, amount, method, note, h) => quiet ? null : s.expenses.push({ id: C.uid('ex'), at: at(back, h || 9, 15), day: C.dayKey(at(back, h || 9, 15)), cat, amount, method, note });
      if (back % 30 === 12) { ex('rent', 15000, 'bank', 'Shop rent'); ex('salary', 9000, 'cash', 'Barista'); ex('salary', 7000, 'cash', 'Helper'); ex('utilities', 1800, 'cash', 'Electricity'); }
      if (back % 7 === 2) ex('gas', 600 + Math.round(r() * 4) * 50, 'cash', 'Gas cylinder');
      if (back % 3 === 0) ex('supplies', 1500 + Math.round(r() * 30) * 100, 'cash', pick(['Fruit from Mandawi', 'Milk and ice cream', 'Biscuits and syrups', 'Coffee beans']), 8);
      if (back % 10 === 5) ex('packaging', 900 + Math.round(r() * 6) * 100, 'cash', 'Cups and straws');
      if (back === 40) ex('repairs', 2500, 'cash', 'Blender repair');
      const wdr = (person, amount, note) => quiet ? null : s.withdrawals.push({ id: C.uid('wd'), at: at(back, 21, 40), day: C.dayKey(at(back, 21, 40)), person, amount, note });
      if (back % 7 === 0) wdr('نجیب', 3000 + Math.round(r() * 8) * 500, 'Owner');
      if (back % 15 === 9) wdr('فرهاد', 1000, 'Salary advance');
      // close each finished day
      if (back > 0) {
        const day = C.dayKey(dayStart);
        const cs = C.cashSummary(s, day, 1000);
        const diff = r() < 0.7 ? 0 : (r() < 0.5 ? -1 : 1) * (10 + Math.round(r() * 9) * 10);
        s.closes.push({ id: 'close-' + day, day, at: at(back, 22, 30), ...cs, counted: cs.expected + diff, diff, note: '' });
      }
    }

    // Stock as it might look today: mostly fine, a few running low.
    s.ings = start.map(i => ({ ...i }));
    const set = (id, qty) => { const i = C.byId(s.ings, 'i-' + id); if (i) i.qty = qty; };
    set('icecream', 1.5); set('mint', 0); set('lotusbisc', 12); set('strawberry', 1);
    s.stockLog.push(
      { id: C.uid('sl'), at: at(2, 9, 10), day: C.dayKey(at(2, 9, 10)), ing: 'i-milk', kind: 'receive', delta: 10, value: 600, note: 'Kabul Dairy' },
      { id: C.uid('sl'), at: at(1, 9, 20), day: C.dayKey(at(1, 9, 20)), ing: 'i-banana', kind: 'receive', delta: 5, value: 400, note: 'Mandawi' },
      { id: C.uid('sl'), at: at(1, 22, 5), day: C.dayKey(at(1, 22, 5)), ing: 'i-strawberry', kind: 'waste', delta: -0.5, value: 125, note: 'Too soft' },
    );
    s.shopping.push(
      { id: C.uid('s'), text: 'Vanilla ice cream', qty: 4, unit: 'kg', ing: 'i-icecream', done: false, at: now - 3600e3 },
      { id: C.uid('s'), text: 'Paper straws', qty: 0, unit: '', ing: null, done: false, at: now - 3500e3 },
    );
    s.prep.push(
      { id: C.uid('p'), text: 'Slice 2 kg strawberries', done: true, at: now - 7200e3 },
      { id: C.uid('p'), text: 'Make pancake batter', done: false, at: now - 7000e3 },
      { id: C.uid('p'), text: 'Squeeze lemons for lemonade', done: false, at: now - 6800e3 },
    );
    s.parked.push({ id: C.uid('h'), at: now - 15 * 60e3, cart: [{ id: 'm-mojito', qty: 2 }, { id: 'm-crepe', qty: 1 }], ord: { service: 'dine', table: 'میز ۳', note: '', dType: 'amt', dVal: '', customer: null, pointsUse: '', pay: 'cash', received: '', parkedId: null } });
    s.orders.sort((a, b) => a.at - b.at);
    return s;
  }

  root.SensoDemo = { build };
  if (typeof module !== 'undefined') module.exports = root.SensoDemo;
})(typeof window !== 'undefined' ? window : globalThis);
