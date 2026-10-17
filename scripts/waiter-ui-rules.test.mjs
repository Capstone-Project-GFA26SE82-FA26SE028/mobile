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

const collect = (s, data = {}) => applyCommand(s, {
  type:'collect', id:'collect-test', now, sessionId:'S6', tableId:'T6', amount:500000, expectedTotal:468000, ...data,
}, menu);

test('cash collection records received cash, staff and time but does not pay or close the session', () => {
  const s = fresh();
  assert.equal(collect(s), null);
  const session = s.sessions.find(x => x.id === 'S6');
  assert.equal(session.payment, 'pending_settlement');
  assert.equal(session.cashReceived, 500000);
  assert.equal(session.cashReceived - sessionTotal(s, session.id), 32000);
  assert.deepEqual(session.cashCollectedBy, {id:'W1', name:'Trần Hoàng'});
  assert.equal(session.cashCollectedAt, now);
  assert.equal(s.tables[5].sessionId, 'S6');
  assert.ok(s.logs[0].text.includes('32.000'));
  const accepted = structuredClone(s);
  assert.ok(collect(s));
  assert.deepEqual(s, accepted);
});

test('insufficient, fractional and invalid cash amounts are rejected without changing the session', () => {
  for (const amount of [0, 467999, 500000.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const s = fresh(); const before = structuredClone(s);
    assert.ok(collect(s, {amount}));
    assert.deepEqual(s, before);
  }
});

test('cash collection rejects stale totals, closed/inactive tables, empty bills and paid sessions', () => {
  for (const scenario of ['total','table','closed','inactive','empty','paid']) {
    const s = fresh(); const data = {};
    if (scenario === 'total') data.expectedTotal = 1;
    if (scenario === 'table') data.tableId = 'T2';
    if (scenario === 'closed') s.tables[5].sessionId = null;
    if (scenario === 'inactive') s.tables[5].active = false;
    if (scenario === 'empty') s.items.filter(i => i.sessionId === 'S6').forEach(i => { i.status = 'Cancelled'; });
    if (scenario === 'paid') s.sessions.find(x => x.id === 'S6').payment = 'paid';
    const before = structuredClone(s);
    assert.ok(collect(s, data));
    assert.deepEqual(s, before);
  }
});

test('pending settlement prevents adding, cancelling and moving', () => {
  const s = fresh();
  s.sessions.find(x => x.id === 'S6').prebillPrinted = false;
  s.items.find(x => x.id === 'I4').status = 'Pending';
  assert.equal(collect(s), null);
  const accepted = structuredClone(s);
  assert.ok(applyCommand(s, {type:'order', id:'after-cash', now, sessionId:'S6', lines:[{dishId:'salmon',quantity:1,note:''}]}, menu));
  assert.ok(applyCommand(s, {type:'cancel', id:'cancel-after-cash', now, itemId:'I4', reason:'Khách đổi món'}, menu));
  assert.ok(applyCommand(s, {type:'move', id:'move-after-cash', now, sessionId:'S6', tableId:'T1', reason:'Đổi bàn'}, menu));
  assert.deepEqual(s, accepted);
});

test('service requests are acknowledged FIFO and must be acknowledged before completion', () => {
  const s = fresh();
  const request = (requestId, status) => applyCommand(s, {type:'request',id:`${requestId}-${status}`,now,requestId,status}, menu);
  const before = structuredClone(s);
  assert.ok(request('R2', 'processing'));
  assert.ok(request('R1', 'done'));
  assert.deepEqual(s, before);
  assert.equal(request('R1', 'processing'), null);
  assert.equal(request('R2', 'processing'), null);
  assert.equal(request('R1', 'done'), null);
  assert.equal(s.requests.find(r => r.id === 'R1').status, 'done');
  assert.ok(!s.requests.filter(r => r.status !== 'done').some(r => r.id === 'R1'));
  const completed = structuredClone(s);
  assert.ok(request('R1', 'done'));
  assert.deepEqual(s, completed);
});

test('request table follows its session after a move and completion does not collect cash', () => {
  const s = fresh();
  assert.equal(move(s), null);
  const request = s.requests.find(r => r.id === 'R1');
  assert.equal(s.tables.find(t => t.sessionId === request.sessionId).id, 'T1');
  assert.equal(applyCommand(s, {type:'request',id:'ack-r1',now,requestId:'R1',status:'processing'}, menu), null);
  assert.equal(applyCommand(s, {type:'request',id:'ack-r2',now,requestId:'R2',status:'processing'}, menu), null);
  assert.equal(applyCommand(s, {type:'request',id:'done-r2',now,requestId:'R2',status:'done'}, menu), null);
  assert.equal(s.sessions.find(x => x.id === 'S6').payment, 'unpaid');
  assert.equal(s.sessions.find(x => x.id === 'S6').cashReceived, undefined);
});

const { reservationTableError, inHoldWindow } = require('../src/features/waiter/reservations/rules.ts');
const approve = (s, data = {}) => applyCommand(s, {
  type:'reservation', id:'reservation-test', now, reservationId:'B1', decision:'confirmed', tableId:'T1', ...data,
}, menu);

test('reservations require an actually empty table even for distant future slots', () => {
  const s = fresh();
  s.reservations[0].time = now + 4 * 3600000;
  s.reservations[0].endTime = now + 5 * 3600000;
  const before = structuredClone(s);
  assert.ok(approve(s, {tableId:'T2'}));
  assert.deepEqual(s, before);
});

test('approval uses explicit slots and checks overlap including the 30 minute hold', () => {
  const s = fresh();
  const existing = s.reservations.find(r => r.id === 'B3');
  s.reservations[0].time = existing.endTime + 20 * 60000;
  s.reservations[0].endTime = s.reservations[0].time + 40 * 60000;
  assert.ok(approve(s, {tableId:'T10'}));
  s.reservations[0].time = existing.endTime + 30 * 60000;
  s.reservations[0].endTime = s.reservations[0].time + 40 * 60000;
  assert.equal(reservationTableError(s, s.reservations[0], 'T10', now), null);
  assert.equal(approve(s, {tableId:'T10'}), null);
});

test('hold starts 30 minutes early and lasts through the booked slot, without a 15 minute cutoff', () => {
  const s = fresh();
  const r = s.reservations.find(r => r.id === 'B3');
  assert.equal(inHoldWindow(r, r.time - 30 * 60000 - 1), false);
  assert.equal(inHoldWindow(r, r.time - 30 * 60000), true);
  assert.equal(inHoldWindow(r, r.time + 20 * 60000), true);
  assert.equal(inHoldWindow(r, r.endTime), false);
  assert.equal(applyCommand(s, {type:'open',id:'late-arrival',now:r.time + 20 * 60000,tableId:'T10',guests:r.guests,reservationId:r.id}, menu), null);
  assert.equal(r.status, 'arrived');
});

test('invalid slots, insufficient seats and dirty or inactive tables reject approvals atomically', () => {
  for (const scenario of ['slot','capacity','cleaning','inactive','area','past']) {
    const s = fresh();
    if (scenario === 'slot') s.reservations[0].endTime = s.reservations[0].time;
    if (scenario === 'capacity') s.tables[0].capacity = 1;
    if (scenario === 'cleaning') s.tables[0].needsCleaning = true;
    if (scenario === 'inactive') s.tables[0].active = false;
    if (scenario === 'area') s.tables[0].area = '';
    if (scenario === 'past') s.reservations[0].time = now - 1;
    const before = structuredClone(s);
    assert.ok(approve(s));
    assert.deepEqual(s, before);
  }
});

test('approval reserves the table, blocks walk-ins and opens the matching reservation only', () => {
  const s = fresh();
  assert.equal(approve(s), null);
  assert.equal(tableStatus(s, s.tables[0], now), 'Giữ chỗ');
  assert.ok(s.reservations[0].customerMessage.includes('Bàn 01'));
  const before = structuredClone(s);
  assert.ok(applyCommand(s, {type:'open',id:'walk-in',now,tableId:'T1',guests:2}, menu));
  assert.ok(applyCommand(s, {type:'open',id:'wrong-count',now,tableId:'T1',guests:2,reservationId:'B1'}, menu));
  assert.deepEqual(s, before);
  assert.equal(applyCommand(s, {type:'open',id:'booked',now,tableId:'T1',guests:4,reservationId:'B1'}, menu), null);
  assert.equal(s.reservations[0].status, 'arrived');
  assert.equal(s.tables[0].sessionId, 'booked');
});

test('rejecting needs a reason, produces a sample message and cannot be decided again', () => {
  const s = fresh();
  const before = structuredClone(s);
  assert.ok(approve(s, {decision:'rejected',reason:' '}));
  assert.deepEqual(s, before);
  assert.equal(approve(s, {decision:'rejected',reason:'Hết bàn phù hợp'}), null);
  assert.equal(s.reservations[0].status, 'rejected');
  assert.ok(s.reservations[0].customerMessage.includes('Hết bàn phù hợp'));
  const rejected = structuredClone(s);
  assert.ok(approve(s));
  assert.deepEqual(s, rejected);
});
