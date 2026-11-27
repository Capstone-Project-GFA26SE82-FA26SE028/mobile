import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions['.jpg'] = (module, filename) => {
  module.exports = filename;
};
const {
  createTableService,
} = require('../src/features/waiter/tables/api/tablesService.ts');
const {
  createOrderingService,
} = require('../src/features/waiter/ordering/api/orderingService.ts');
const createWaiterService = (client) => ({
  ...createTableService(client),
  ...createOrderingService(client),
});
const {
  default: reducer,
  authenticated,
  enterDemo,
} = require('../src/features/waiter/shared/store/waiterSlice.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });

test('merge sends the target and reason with a stable idempotency key', async () => {
  const calls = [];
  const service = createTableService({
    post: async (...args) => {
      calls.push(args);
      return reply({ status: 'Completed', targetTableId: 'target' });
    },
  });
  const request = {
    sessionId: 'source',
    mode: 'merge',
    targetTableId: 'target',
    reason: 'Join party',
    items: [],
    key: 'same-key',
  };
  assert.equal((await service.transfer(request)).status, 'Completed');
  await service.transfer(request);
  assert.deepEqual(calls[0], [
    '/api/table-sessions/source/merge',
    { targetTableId: 'target', reason: 'Join party' },
    { headers: { 'Idempotency-Key': 'same-key' } },
  ]);
  assert.deepEqual(calls[0], calls[1]);
});

test('split preserves order item IDs and quantities and can look up a lost reply', async () => {
  const signal = new AbortController().signal;
  const service = createTableService({
    post: async (url, body, config) => {
      assert.equal(url, '/api/table-sessions/source/split');
      assert.deepEqual(body, {
        targetTableId: 'target',
        reason: 'Separate party',
        items: [{ orderItemId: 'line', quantity: 2 }],
      });
      assert.equal(config.headers['Idempotency-Key'], 'operation');
      return reply({ operationId: 'operation', status: 'Processing' });
    },
    get: async (url, config) => {
      assert.equal(url, '/api/table-transfers/operation');
      assert.equal(config.signal, signal);
      return reply({ status: 'Completed' });
    },
  });
  assert.equal(
    (
      await service.transfer({
        sessionId: 'source',
        mode: 'split',
        targetTableId: 'target',
        reason: 'Separate party',
        items: [{ orderItemId: 'line', quantity: 2 }],
        key: 'operation',
      })
    ).status,
    'Processing',
  );
  assert.equal(
    (await service.transferStatus('operation', signal)).status,
    'Completed',
  );
});

test('transfer failures are surfaced instead of being reported as completed', async () => {
  const service = createTableService({
    post: async () => ({
      data: { isSuccess: false, message: 'Session is checking out' },
    }),
  });
  await assert.rejects(
    service.transfer({
      sessionId: 'source',
      mode: 'merge',
      targetTableId: 'target',
      reason: 'Join',
      items: [],
      key: 'operation',
    }),
    /checking out/,
  );
});

test('staff cancellation targets the session and preserves the request key on retry', async () => {
  const calls = [];
  const service = createWaiterService({
    post: async (...args) => {
      calls.push(args);
      return reply({ status: 'Approved' });
    },
  });
  const key = '9ecf2a47-983b-4ca0-a36f-399a1ca32794';
  await service.cancelItem('session', 'line', 2, 'Khách gọi nhầm', key);
  await service.cancelItem('session', 'line', 2, 'Khách gọi nhầm', key);
  assert.deepEqual(calls[0], [
    '/api/table-sessions/session/cancellation-requests/staff',
    { orderItemId: 'line', quantity: 2, reason: 'Khách gọi nhầm' },
    { headers: { 'Idempotency-Key': key } },
  ]);
  assert.deepEqual(calls[0], calls[1]);
});

test('staff cancellation propagates rejection when the kitchen has started cooking', async () => {
  const service = createWaiterService({
    post: async () => ({
      data: { isSuccess: false, message: 'Chỉ được hủy số lượng chưa nấu' },
    }),
  });
  await assert.rejects(
    service.cancelItem('session', 'line', 1, 'Gọi nhầm', 'key'),
    /chưa nấu/,
  );
});

test('tables and menu load every page and forward cancellation signals', async () => {
  for (const [method, path] of [
    ['tables', '/api/tables/service'],
    ['menu', '/api/menu'],
  ]) {
    const calls = [];
    const signal = new AbortController().signal;
    const service = createWaiterService({
      get: async (url, config) => {
        calls.push([url, config]);
        return reply({ items: [config.params.page], totalCount: 2 });
      },
    });
    assert.deepEqual(await service[method](signal), [1, 2]);
    assert.equal(calls[0][0], path);
    assert.equal(calls[1][1].params.page, 2);
    assert.equal(calls[0][1].signal, signal);
  }
});

test('session orders handle array pagination instead of a paged envelope', async () => {
  const service = createWaiterService({
    get: async (url, config) => {
      assert.equal(url, '/api/table-sessions/session/orders');
      return reply(
        config.params.page === 1
          ? Array.from({ length: 100 }, (_, i) => i)
          : [100],
      );
    },
  });
  assert.equal((await service.orders('session')).length, 101);
});

test('staff order uses items, options and the same idempotency key for retries', async () => {
  const calls = [];
  const service = createWaiterService({
    post: async (...args) => {
      calls.push(args);
      return reply({ orderId: 'order' });
    },
  });
  const items = [
    {
      itemId: 'dish',
      quantity: 2,
      note: 'Less salt',
      options: [{ optionId: 'size', quantity: 1 }],
    },
  ];
  await service.createOrder('session', 'table', items, 'stable-key');
  await service.createOrder('session', 'table', items, 'stable-key');
  assert.deepEqual(calls[0], [
    '/api/table-sessions/session/orders',
    { tableId: 'table', items },
    { headers: { 'Idempotency-Key': 'stable-key' } },
  ]);
  assert.deepEqual(calls[0], calls[1]);
});

test('confirmation sends the reviewed server version; failed envelopes propagate', async () => {
  const service = createWaiterService({
    post: async (url, body) => {
      assert.equal(url, '/api/table-sessions/session/orders/order/confirm');
      assert.deepEqual(body, { version: 'base64-rowversion' });
      return { data: { isSuccess: false, message: 'Version changed' } };
    },
  });
  await assert.rejects(
    service.confirmOrder({
      tableSessionId: 'session',
      orderId: 'order',
      version: 'base64-rowversion',
    }),
    /Version changed/,
  );
});

test('API sign-in removes all demo business data; demo mode restores its own data', () => {
  const demo = reducer(undefined, enterDemo());
  assert.ok(demo.tables.length);
  const api = reducer(
    demo,
    authenticated({
      id: 'real-user',
      name: 'Waiter',
      role: 'waiter',
      active: true,
    }),
  );
  for (const field of [
    'tables',
    'sessions',
    'items',
    'customerOrders',
    'requests',
    'reservations',
    'logs',
  ]) {
    assert.deepEqual(api[field], []);
  }
  assert.equal(api.authMode, 'api');
  const restored = reducer(api, enterDemo());
  assert.ok(restored.tables.length);
  assert.equal(restored.authMode, 'demo');
});

test('serving targets the selected session, order and line with the reviewed version', async () => {
  const calls = [];
  const order = {
    tableSessionId: 'session',
    orderId: 'order',
    version: 'reviewed-version',
  };
  const service = createOrderingService({
    post: async (...args) => {
      calls.push(args);
      return reply({
        ...order,
        items: [{ orderItemId: 'line', status: 'Served' }],
      });
    },
  });
  const result = await service.serveItem(order, 'line');
  assert.equal(
    calls[0][0],
    '/api/table-sessions/session/orders/order/items/line/serve',
  );
  assert.deepEqual(calls[0][1], { version: 'reviewed-version' });
  assert.equal(result.items[0].status, 'Served');
});

test('serving propagates stale order rejection without reporting success', async () => {
  const service = createOrderingService({
    post: async () => ({
      data: {
        isSuccess: false,
        message: 'Order changed; reload before serving',
      },
    }),
  });
  await assert.rejects(
    service.serveItem(
      { tableSessionId: 's', orderId: 'o', version: 'old' },
      'line',
    ),
    /Order changed/,
  );
});
