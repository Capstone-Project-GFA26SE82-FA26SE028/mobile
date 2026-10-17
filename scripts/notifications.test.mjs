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

const { receiveKitchenReady } = require('../src/features/waiter/notifications/events.ts');
const event = { tableId: 'T2', itemId: 'I2', quantity: 1, note: 'Sốt để riêng' };
test('kitchen event makes a dish Ready and unread with timestamp and note', () => {
  const s = fresh();
  assert.equal(receiveKitchenReady(s, event, now), null);
  const item = s.items.find(i => i.id === 'I2');
  assert.equal(item.status, 'Ready');
  assert.equal(item.seen, false);
  assert.equal(item.readyAt, now);
  assert.equal(item.note, event.note);
});
test('seen acknowledgement stops unread status without serving the dish', () => {
  const s = fresh();
  receiveKitchenReady(s, event, now);
  assert.equal(applyCommand(s, {type:'seen', id:'seen', now, itemId:'I2'}, menu), null);
  const item = s.items.find(i => i.id === 'I2');
  assert.equal(item.seen, true);
  assert.equal(item.status, 'Ready');
  assert.equal(item.served, 0);
  const seen = structuredClone(s);
  assert.equal(receiveKitchenReady(s, event, now + 100), null);
  assert.deepEqual(s, seen);
});
test('repeat events do not reset partial or completed serving', () => {
  const s = fresh();
  const payload = { tableId:'T2', itemId:'I1', quantity:3, note:'Changed' };
  assert.equal(applyCommand(s, {type:'serve', id:'partial', now, itemId:'I1', quantity:1}, menu), null);
  const partial = structuredClone(s);
  assert.equal(receiveKitchenReady(s, payload, now), null);
  assert.deepEqual(s, partial);
  assert.equal(applyCommand(s, {type:'serve', id:'complete', now, itemId:'I1', quantity:2}, menu), null);
  const served = structuredClone(s);
  assert.equal(receiveKitchenReady(s, payload, now), null);
  assert.deepEqual(s, served);
});
test('invalid table, quantity, missing item, cancelled and signed-out events are rejected atomically', () => {
  for (const scenario of ['table','quantity','missing','cancelled','signed-out']) {
    const s = fresh();
    if (scenario === 'cancelled') s.items.find(i => i.id === 'I2').status = 'Cancelled';
    if (scenario === 'signed-out') s.signedIn = false;
    const before = structuredClone(s);
    const payload = { ...event };
    if (scenario === 'table') payload.tableId = 'T3';
    if (scenario === 'quantity') payload.quantity = 2;
    if (scenario === 'missing') payload.itemId = 'missing';
    assert.ok(receiveKitchenReady(s, payload, now));
    assert.deepEqual(s, before);
  }
});

test('malformed notes and mismatched session/table links cannot mutate readiness', () => {
  for (const scenario of ['note', 'session']) {
    const s = fresh();
    const payload = { ...event };
    if (scenario === 'note') payload.note = null;
    if (scenario === 'session') s.sessions.find(x => x.id === 'S2').tableId = 'T3';
    const before = structuredClone(s);
    assert.ok(receiveKitchenReady(s, payload, now));
    assert.deepEqual(s, before);
  }
});
