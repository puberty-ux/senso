// Run with: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../app/js/core.js');
const Seed = require('../app/js/seed.js');

function fresh() {
  const s = C.emptyState();
  s.menu = Seed.menu();
  s.ings = Seed.ings();
  return s;
}
const ing = (s, id) => s.ings.find(i => i.id === id);
const T = new Date(2026, 10, 26, 12, 46).getTime(); // 26 Nov 2026, 12:46 local

test('Persian digits are read as numbers', () => {
  assert.equal(C.num('۱۲۰'), 120);
  assert.equal(C.num('٤٥٫٥'), 45.5);
  assert.equal(C.num('1,250'), 1250);
  assert.equal(C.num('abc'), 0);
});

test('Solar Hijri dates and months', () => {
  assert.deepEqual(C.hijri('2026-11-26'), { y: 1405, m: 9, d: 5 });   // 5 Qaws 1405
  assert.deepEqual(C.hijri('2026-03-21'), { y: 1405, m: 1, d: 1 });   // Nawruz
  const qaws = C.monthDays(1405, 9, 'hijri');
  assert.equal(qaws.length, 30);
  assert.equal(qaws[0], '2026-11-22');
  assert.equal(C.monthDays(1405, 1, 'hijri').length, 31);
  const year = C.period('year', '2026-11-26', 'hijri').days;
  assert.ok(year.length === 365 || year.length === 366);
  assert.equal(C.hijri(year[0]).m, 1);
  assert.equal(C.shift('month', '2026-11-26', 'hijri', 1), '2026-12-22');   // 1 Jadi
  assert.equal(C.shift('month', '2026-11-26', 'greg', -1), '2026-10-01');
  assert.equal(C.period('month', '2028-02-10', 'greg').days.length, 29);
});

test('checkout prices, numbers, and takes stock', () => {
  const s = fresh();
  const milk = ing(s, 'i-milk').qty;
  const { order, changes } = C.checkout(s, { cart: [{ id: 'm-shake-vanilla', qty: 2 }, { id: 'm-mojito', qty: 1 }], discountType: 'amt', discountValue: '۲۰', pay: 'cash', received: 300 }, T);
  C.apply(s, changes);
  assert.equal(order.no, 1);
  assert.equal(order.sub, 240);
  assert.equal(order.total, 220);
  assert.equal(order.change, 80);
  assert.equal(order.day, '2026-11-26');
  assert.ok(Math.abs(ing(s, 'i-milk').qty - (milk - 0.3)) < 1e-9);
  const two = C.checkout(s, { cart: [{ id: 'm-crepe', qty: 1 }], discountType: 'pct', discountValue: 10 }, T + 1000);
  assert.equal(two.order.no, 2);
  assert.equal(two.order.discount, 13);
});

test('credit sale needs a customer and lands on their balance; void reverses it', () => {
  const s = fresh();
  assert.throws(() => C.checkout(s, { cart: [{ id: 'm-crepe', qty: 1 }], pay: 'credit' }, T), e => e.code === 'credit_needs_customer');
  s.customers.push({ id: 'c-1', name: 'Ahmad', balance: 0, points: 0 });
  const { order, changes } = C.checkout(s, { cart: [{ id: 'm-crepe', qty: 2 }], pay: 'credit', customer: 'c-1' }, T);
  C.apply(s, changes);
  assert.equal(s.customers[0].balance, 260);
  assert.equal(s.customers[0].points, 2);
  C.apply(s, C.receivePayment(s, 'c-1', 100, 'cash', '', T));
  assert.equal(s.customers[0].balance, 160);
  const eggs = ing(s, 'i-eggs').qty;
  C.apply(s, C.voidOrder(s, order.id, 'wrong order', T));
  assert.equal(s.customers[0].balance, -100);   // they paid 100 for an order that was voided
  assert.equal(s.customers[0].points, 0);
  assert.equal(ing(s, 'i-eggs').qty, eggs + 2);
  assert.deepEqual(C.voidOrder(s, order.id, 'again', T), []);
});

test('loyalty points pay part of an order', () => {
  const s = fresh();
  s.customers.push({ id: 'c-1', name: 'Sara', balance: 0, points: 50 });
  const { order } = C.checkout(s, { cart: [{ id: 'm-shake-lotus', qty: 1 }], customer: 'c-1', pointsUse: 30 }, T);
  assert.equal(order.pointsValue, 30);
  assert.equal(order.total, 60);
});

test('cash summary and report', () => {
  const s = fresh();
  C.apply(s, C.checkout(s, { cart: [{ id: 'm-shake-oreo', qty: 1 }], pay: 'cash' }, T).changes);
  C.apply(s, C.checkout(s, { cart: [{ id: 'm-lemonade', qty: 2 }], pay: 'card', service: 'take' }, T + 3600e3).changes);
  s.expenses.push({ id: 'e1', day: '2026-11-26', cat: 'gas', amount: 50, method: 'cash' });
  s.withdrawals.push({ id: 'w1', day: '2026-11-26', person: 'Owner', amount: 30 });
  const cash = C.cashSummary(s, '2026-11-26', 500);
  assert.equal(cash.expected, 500 + 120 - 50 - 30);
  const r = C.report(s, ['2026-11-26']);
  assert.equal(r.orders, 2);
  assert.equal(r.net, 300);
  assert.equal(r.byPay.card, 180);
  assert.equal(r.byService.take, 180);
  assert.equal(r.top[0].en, 'Lemonade');
  assert.equal(r.expenses, 50);
  assert.equal(r.withdrawals, 30);
  assert.equal(r.profit, 300 - 0 - 50);
});

test('receiving stock can be recorded as an expense; waste is logged', () => {
  const s = fresh();
  const ch = C.adjustStock(s, 'i-milk', 10, 'receive', { unitCost: 60, asExpense: true, method: 'cash' }, T);
  C.apply(s, ch);
  assert.equal(ing(s, 'i-milk').qty, 22);
  assert.equal(ing(s, 'i-milk').cost, 60);
  assert.equal(s.expenses[0].amount, 600);
  C.apply(s, C.adjustStock(s, 'i-milk', -2, 'waste', {}, T));
  assert.equal(s.stockLog[1].value, 120);
  assert.equal(C.report(s, ['2026-11-26']).waste, 120);
  C.apply(s, C.adjustStock(s, 'i-milk', 5, 'count', {}, T));
  assert.equal(ing(s, 'i-milk').qty, 5);
});

test('backup round trip', () => {
  const s = fresh();
  s.customers.push({ id: 'c-1', name: 'نجیب', balance: 50, points: 3 });
  const back = C.importJSON(C.exportJSON(s));
  assert.equal(back.menu.length, s.menu.length);
  assert.equal(back.customers[0].name, 'نجیب');
  assert.throws(() => C.importJSON('{"hello":1}'));
});
