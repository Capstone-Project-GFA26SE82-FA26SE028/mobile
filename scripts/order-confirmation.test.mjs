import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { createWaiterState } = require('../src/features/waiter/shared/utils/seed.ts');
const { applyCommand, sessionTotal } = require('../src/features/waiter/shared/utils/rules.ts');
const now = 1792249200000;
const menu = [
  { id: 'salmon', name: 'Cá hồi', price: 189000, available: true },
  { id: 'orange', name: 'Nước cam', price: 45000, available: true },
  { id: 'salad', name: 'Salad', price: 79000, available: true },
  { id: 'toast', name: 'Bánh mì', price: 69000, available: true },
];
const fresh = () => ({ ...createWaiterState(now), signedIn: true, waiter: { id: 'W1', name: 'Trần Hoàng', role: 'waiter', active: true } });
const confirm = (s, overrides = {}, dishes = menu) => applyCommand(s, {
  type: 'confirm-order', id: 'confirm-test', now,
  orderId: 'QR-001', version: 1, ...overrides,
}, dishes);

test('awaiting orders do not create kitchen items or add to billable totals', () => {
  const s = fresh();
  assert.equal(s.items.length, 6);
  assert.equal(sessionTotal(s, 'S3'), 238000);
  assert.ok(s.customerOrders.every(o => o.status === 'awaiting_confirmation'));
});

test('confirmation accepts only one round and records staff, time, notes and version', () => {
  const s = fresh();
  assert.equal(confirm(s), null);
  const order = s.customerOrders[0];
  assert.equal(order.status, 'confirmed');
  assert.equal(order.version, 2);
  assert.deepEqual(order.confirmedBy, { id: 'W1', name: 'Trần Hoàng' });
  assert.equal(order.confirmedAt, now);
  assert.equal(s.customerOrders[2].status, 'awaiting_confirmation');
  const items = s.items.filter(i => i.id.startsWith('customer-QR-001-'));
  assert.equal(items.length, 2);
  assert.ok(items.every(i => i.status === 'Pending' && i.sessionId === 'S3'));
  assert.ok(items[0].note.includes('Không tiêu'));
  assert.ok(items[0].note.includes('Cho bé ăn trước'));
  assert.equal(sessionTotal(s, 'S3'), 238000 + 279000);
});

test('stale and repeated confirmations cannot create duplicate items or charges', () => {
  const s = fresh();
  const before = structuredClone(s);
  assert.ok(confirm(s, { version: 0 }));
  assert.deepEqual(s, before);
  assert.equal(confirm(s), null);
  const accepted = structuredClone(s);
  assert.ok(confirm(s));
  assert.deepEqual(s, accepted);
});

test('signed-out, closed, inactive and settling sessions cannot be confirmed', () => {
  for (const mutate of [
    s => { s.signedIn = false; },
    s => { s.tables[2].sessionId = null; },
    s => { s.tables[2].active = false; },
    s => { s.sessions.find(x => x.id === 'S3').payment = 'pending_settlement'; },
  ]) {
    const s = fresh(); mutate(s);
    const before = structuredClone(s);
    assert.ok(confirm(s));
    assert.deepEqual(s, before);
  }
});

test('unavailable dishes, invalid quantities and missing staff reject the whole order', () => {
  const unavailable = menu.map(d => ({ ...d, available: d.id !== 'orange' }));
  for (const scenario of ['unavailable', 'quantity', 'staff']) {
    const s = fresh();
    if (scenario === 'quantity') s.customerOrders[0].lines[1].quantity = 0;
    if (scenario === 'staff') { s.waiter = null; }
    const before = structuredClone(s);
    const override = {};
    assert.ok(confirm(s, override, scenario === 'unavailable' ? unavailable : menu));
    assert.deepEqual(s, before);
  }
});

test('confirmation preserves reviewed prices instead of silently using newer menu prices', () => {
  const s = fresh();
  const changedMenu = menu.map(d => ({ ...d, price: d.price + 50000 }));
  assert.equal(confirm(s, {}, changedMenu), null);
  assert.equal(sessionTotal(s, 'S3'), 238000 + 279000);
  assert.equal(s.items.find(i => i.id === 'customer-QR-001-0').price, 189000);
  assert.equal(s.items.find(i => i.id === 'customer-QR-001-0').name, s.customerOrders[0].lines[0].name);
});

test('invalid reviewed prices reject atomically before creating kitchen items', () => {
  for (const price of [-1, NaN, Infinity, 1.5]) {
    const s = fresh();
    s.customerOrders[0].lines[1].price = price;
    const before = structuredClone(s);
    assert.ok(confirm(s));
    assert.deepEqual(s, before);
  }
});

test('confirmation uses session identity rather than caller supplied staff', () => {
  const s = fresh();
  assert.equal(confirm(s, { waiter: { id: 'spoof', name: 'Another staff' } }), null);
  assert.deepEqual(s.customerOrders[0].confirmedBy, { id: 'W1', name: 'Trần Hoàng' });
});
