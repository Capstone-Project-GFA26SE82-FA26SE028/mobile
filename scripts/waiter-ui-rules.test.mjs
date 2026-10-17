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

test('tableside ordering creates kitchen Pending items immediately, preserving quantity and notes', () => {
  const s = fresh();
  const before = sessionTotal(s, 'S3');
  const input = { type:'order', id:'tableside', now, sessionId:'S3', lines:[
    { dishId:'salmon', quantity:2, note:'  Ít sốt  ' },
    { dishId:'orange', quantity:1, note:'Không đá' },
  ] };
  assert.equal(applyCommand(s, input, menu), null);
  const created = s.items.filter(i => i.id.startsWith('tableside-'));
  assert.equal(created.length, 2);
  assert.ok(created.every(i => i.status === 'Pending' && i.sessionId === 'S3'));
  assert.equal(created[0].quantity, 2);
  assert.equal(created[0].note, 'Ít sốt');
  assert.equal(sessionTotal(s, 'S3'), before + 2 * 189000 + 45000);
  const accepted = structuredClone(s);
  assert.ok(applyCommand(s, input, menu));
  assert.deepEqual(s, accepted);
});

test('invalid, sold-out and inactive-table orders fail before adding any lines', () => {
  const dishes = [...menu, { id:'rice', name:'Cơm', price:99000, available:false }];
  for (const scenario of ['sold-out', 'quantity', 'note', 'inactive', 'settling']) {
    const s = fresh();
    const lines = [{ dishId:'salmon', quantity:1, note:'' }, { dishId:'orange', quantity:1, note:'' }];
    if (scenario === 'sold-out') lines[1].dishId = 'rice';
    if (scenario === 'quantity') lines[1].quantity = 100;
    if (scenario === 'note') lines[1].note = null;
    if (scenario === 'inactive') s.tables[2].active = false;
    if (scenario === 'settling') s.sessions.find(x => x.id === 'S3').payment = 'pending_settlement';
    const before = structuredClone(s);
    assert.ok(applyCommand(s, {type:'order', id:'bad-order', now, sessionId:'S3', lines}, dishes));
    assert.deepEqual(s, before);
  }
});

test('cancelling Pending or Sent needs a reason, removes charges and logs the reason', () => {
  for (const status of ['Pending', 'Sent']) {
    const s = fresh();
    s.items.find(i => i.id === 'I3').status = status;
    const before = structuredClone(s);
    assert.ok(applyCommand(s, {type:'cancel',id:'cancel-empty',now,itemId:'I3',reason:' '}, menu));
    assert.deepEqual(s, before);
    assert.equal(applyCommand(s, {type:'cancel',id:'cancel',now,itemId:'I3',reason:'Khách đổi món'}, menu), null);
    assert.equal(s.items.find(i => i.id === 'I3').status, 'Cancelled');
    assert.equal(sessionTotal(s, 'S3'), 0);
    assert.ok(s.logs[0].text.includes('Khách đổi món'));
  }
});

test('Cooking, Ready and Served dishes cannot be cancelled or changed by cancellation', () => {
  for (const itemId of ['I1', 'I2', 'I4']) {
    const s = fresh(); const before = structuredClone(s);
    assert.ok(applyCommand(s, {type:'cancel',id:'blocked',now,itemId,reason:'Khách yêu cầu'}, menu));
    assert.deepEqual(s, before);
  }
});

const move = (s, data = {}) => applyCommand(s, {
  type:'move', id:'move-test', now, sessionId:'S3', sourceTableId:'T3', tableId:'T1', reason:'Gần cửa sổ', ...data,
}, menu);

test('moving preserves session, items, customer orders and requests; old table needs cleaning', () => {
  const s = fresh();
  const items = structuredClone(s.items);
  const orders = structuredClone(s.customerOrders);
  const requests = structuredClone(s.requests);
  const total = sessionTotal(s, 'S3');
  assert.equal(move(s), null);
  assert.equal(s.tables[2].sessionId, null);
  assert.equal(s.tables[2].needsCleaning, true);
  assert.equal(s.tables[0].sessionId, 'S3');
  assert.equal(s.sessions.find(x => x.id === 'S3').tableId, 'T1');
  assert.equal(tableStatus(s, s.tables[0], now), 'Có khách');
  assert.deepEqual(s.items, items);
  assert.deepEqual(s.customerOrders, orders);
  assert.deepEqual(s.requests, requests);
  assert.equal(sessionTotal(s, 'S3'), total);
  assert.ok(s.logs[0].text.includes('Gần cửa sổ'));
});

test('occupied, dirty, held, inactive, unassigned and undersized destinations cannot receive a session', () => {
  for (const scenario of ['occupied','dirty','held','inactive','area','capacity','same-table']) {
    const s = fresh();
    const data = {};
    if (scenario === 'occupied') data.tableId = 'T2';
    if (scenario === 'dirty') data.tableId = 'T5';
    if (scenario === 'held') data.tableId = 'T10';
    if (scenario === 'inactive') s.tables[0].active = false;
    if (scenario === 'area') s.tables[0].area = '';
    if (scenario === 'capacity') s.tables[0].capacity = 1;
    if (scenario === 'same-table') data.tableId = 'T3';
    const before = structuredClone(s);
    assert.ok(move(s, data));
    assert.deepEqual(s, before);
  }
});

test('prebill, payment, missing reason and stale source checks reject moves atomically', () => {
  for (const scenario of ['prebill','settling','reason','stale','source']) {
    const s = fresh();
    const data = {};
    if (scenario === 'prebill') s.sessions.find(x => x.id === 'S3').prebillPrinted = true;
    if (scenario === 'settling') s.sessions.find(x => x.id === 'S3').payment = 'pending_settlement';
    if (scenario === 'reason') data.reason = ' ';
    if (scenario === 'stale') data.sourceTableId = 'T9';
    if (scenario === 'source') s.tables[2].sessionId = null;
    const before = structuredClone(s);
    assert.ok(move(s, data));
    assert.deepEqual(s, before);
  }
});
