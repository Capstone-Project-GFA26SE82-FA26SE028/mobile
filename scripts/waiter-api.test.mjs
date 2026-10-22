import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions['.jpg'] = (module, filename) => { module.exports = filename; };
const { createWaiterService } = require('../src/features/waiter/api/waiterService.ts');
const { default: reducer, authenticated, enterDemo } = require('../src/features/waiter/shared/waiterSlice.ts');
const reply = result => ({ data: { isSuccess: true, result } });

test('tables and menu load every page and forward cancellation signals', async () => {
  for (const [method, path] of [['tables', '/api/tables/service'], ['menu', '/api/menu']]) {
    const calls = [];
    const signal = new AbortController().signal;
    const service = createWaiterService({ get: async (url, config) => {
      calls.push([url, config]);
      return reply({ items: [config.params.page], totalCount: 2 });
    } });
    assert.deepEqual(await service[method](signal), [1, 2]);
    assert.equal(calls[0][0], path);
    assert.equal(calls[1][1].params.page, 2);
    assert.equal(calls[0][1].signal, signal);
  }
});

test('session orders handle array pagination instead of a paged envelope', async () => {
  const service = createWaiterService({ get: async (url, config) => {
    assert.equal(url, '/api/table-sessions/session/orders');
    return reply(config.params.page === 1 ? Array.from({ length: 100 }, (_, i) => i) : [100]);
  } });
  assert.equal((await service.orders('session')).length, 101);
});

test('staff order uses items, options and the same idempotency key for retries', async () => {
  const calls = [];
  const service = createWaiterService({ post: async (...args) => { calls.push(args); return reply({ orderId: 'order' }); } });
  const items = [{ itemId: 'dish', quantity: 2, note: 'Less salt', options: [{ optionId: 'size', quantity: 1 }] }];
  await service.createOrder('session', 'table', items, 'stable-key');
  await service.createOrder('session', 'table', items, 'stable-key');
  assert.deepEqual(calls[0], ['/api/table-sessions/session/orders', { tableId: 'table', items }, { headers: { 'Idempotency-Key': 'stable-key' } }]);
  assert.deepEqual(calls[0], calls[1]);
});

test('confirmation sends the reviewed server version; failed envelopes propagate', async () => {
  const service = createWaiterService({ post: async (url, body) => {
    assert.equal(url, '/api/table-sessions/session/orders/order/confirm');
    assert.deepEqual(body, { version: 'base64-rowversion' });
    return { data: { isSuccess: false, message: 'Version changed' } };
  } });
  await assert.rejects(service.confirmOrder({ tableSessionId: 'session', orderId: 'order', version: 'base64-rowversion' }), /Version changed/);
});

test('API sign-in removes all demo business data; demo mode restores its own data', () => {
  const demo = reducer(undefined, enterDemo());
  assert.ok(demo.tables.length);
  const api = reducer(demo, authenticated({ id: 'real-user', name: 'Waiter', role: 'waiter', active: true }));
  for (const field of ['tables', 'sessions', 'items', 'customerOrders', 'requests', 'reservations', 'logs']) {
    assert.deepEqual(api[field], []);
  }
  assert.equal(api.authMode, 'api');
  const restored = reducer(api, enterDemo());
  assert.ok(restored.tables.length);
  assert.equal(restored.authMode, 'demo');
});
