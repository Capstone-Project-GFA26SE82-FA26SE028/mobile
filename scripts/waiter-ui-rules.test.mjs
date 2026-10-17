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
const { createWaiterState } = require('../src/features/waiter/shared/data/seed.ts');
const { applyCommand, sessionTotal } = require('../src/features/waiter/shared/rules.ts');
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

const { hasWaiterSession } = require('../src/features/waiter/auth/session.ts');
const { tableStatus, matches } = require('../src/features/waiter/shared/rules.ts');
const serve = (s, data = {}) => applyCommand(s, { type:'serve', id:'serve-test', now, itemId:'I1', quantity:1, expectedServed:0, ...data }, menu);

test('inactive, wrong-role and missing-identity demo sessions cannot mutate data', () => {
  for (const change of [
    s => { s.waiter.active = false; },
    s => { s.waiter.role = 'customer'; },
    s => { s.waiter.id = ''; },
    s => { s.waiter = null; },
  ]) {
    const s = fresh(); change(s);
    assert.equal(hasWaiterSession(s), false);
    const before = structuredClone(s);
    assert.ok(serve(s));
    assert.deepEqual(s, before);
  }
});

test('partial serving saves staff, quantity and time; completion updates table status', () => {
  const s = fresh();
  assert.equal(serve(s), null);
  const item = s.items[0];
  assert.equal(item.status, 'Ready');
  assert.equal(item.served, 1);
  assert.deepEqual(item.servings, [{ id:'serve-test', waiterId:'W1', waiterName:'Trần Hoàng', quantity:1, time:now }]);
  assert.equal(tableStatus(s, s.tables[1], now), 'Chờ trả món');
  assert.equal(serve(s, { id:'remaining', quantity:2, expectedServed:1 }), null);
  assert.equal(item.status, 'Served');
  assert.equal(item.servings.length, 2);
  assert.equal(tableStatus(s, s.tables[1], now), 'Có khách');
});

test('duplicate command, outdated review and closed table reject without changing served portions', () => {
  const s = fresh();
  assert.equal(serve(s), null);
  const accepted = structuredClone(s);
  assert.ok(serve(s, { expectedServed:1 }));
  assert.deepEqual(s, accepted);
  assert.ok(serve(s, { id:'stale' }));
  assert.deepEqual(s, accepted);
  s.tables[1].sessionId = null;
  const closed = structuredClone(s);
  assert.ok(serve(s, { id:'closed', expectedServed:1 }));
  assert.deepEqual(s, closed);
});

test('invalid quantities and non-Ready dishes cannot be served', () => {
  for (const data of [{ quantity:0 }, { quantity:4 }, { quantity:1.5 }, { itemId:'I2' }, { itemId:'I3' }, { itemId:'I4' }]) {
    const s = fresh(); const before = structuredClone(s);
    assert.ok(serve(s, data));
    assert.deepEqual(s, before);
  }
});

test('table statuses cover all four Excel states and reservation holds', () => {
  const s = fresh();
  assert.equal(tableStatus(s, s.tables[0], now), 'Trống');
  assert.equal(tableStatus(s, s.tables[1], now), 'Chờ trả món');
  assert.equal(tableStatus(s, s.tables[2], now), 'Có khách');
  assert.equal(tableStatus(s, s.tables[4], now), 'Cần dọn');
  assert.equal(tableStatus(s, s.tables[9], now), 'Giữ chỗ');
  assert.equal(matches('Bàn 03', 'ban 03'), true);
});
