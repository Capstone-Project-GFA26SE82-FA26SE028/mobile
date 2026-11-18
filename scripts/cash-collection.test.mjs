import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(
    ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
};
const {
  createCollectionService,
} = require('../src/features/waiter/cash-collection/api/collectionService.ts');
const {
  validCash,
} = require('../src/features/waiter/cash-collection/utils/money.ts');
const {
  default: reducer,
  startCollection,
  collectionSaved,
} = require('../src/features/waiter/cash-collection/store/collectionSlice.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });

test('cash input accepts full integer VND and rejects insufficient or invalid amounts', () => {
  assert.equal(validCash('500000', 450000), true);
  for (const value of [
    '',
    '0',
    '449999',
    '-500000',
    '500000.5',
    '1e6',
    '9007199254740992',
  ])
    assert.equal(validCash(value, 450000), false);
});
test('request list reads every page, forwards cancellation, and does not use guest detail API', async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const api = createCollectionService({
    get: async (url, config) => {
      calls.push([url, config]);
      return reply({
        items: [{ serviceRequestId: String(config.params.page) }],
        totalCount: 2,
      });
    },
  });
  assert.equal((await api.list('restaurant', signal)).length, 2);
  assert.equal(calls[1][0], '/api/restaurants/restaurant/payment-requests');
  assert.equal(calls[1][1].params.page, 2);
  assert.equal(calls[1][1].signal, signal);
});
test('waiter workflow calls acknowledge, submit, bill and present without cashier prepare', async () => {
  const calls = [];
  const api = createCollectionService({
    post: async (url) => {
      calls.push(url);
      return reply({});
    },
    get: async (url) => {
      calls.push(url);
      return reply({});
    },
  });
  await api.acknowledge('s', 'r');
  await api.submit('s', 'r');
  await api.bill('s', 'r');
  await api.present('s', 'r');
  assert.deepEqual(
    calls,
    ['acknowledge', 'submit', 'bill', 'present'].map(
      (action) => '/api/table-sessions/s/payment-requests/r/' + action,
    ),
  );
});
test('ambiguous network failure retries identical cash payload and key', async () => {
  const calls = [];
  const api = createCollectionService({
    post: async (...args) => {
      calls.push(args);
      if (calls.length === 1) throw new Error('timeout');
      return reply({
        paymentId: 'payment',
        cashReceived: 500000,
        changeAmount: 50000,
      });
    },
  });
  const draft = {
    key: 'stable-uuid',
    billId: 'bill',
    checkoutId: 'checkout',
    received: 500000,
  };
  await assert.rejects(api.collect(draft));
  const saved = await api.collect(draft);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0][2].headers['Idempotency-Key'], draft.key);
  assert.equal(calls[0][1].cashReceived, 500000);
  assert.equal(saved.changeAmount, 50000);
});
test('submission freezes cash values and clears memory when account changes', () => {
  const draft = {
    key: 'first',
    billId: 'b',
    checkoutId: 'c',
    received: 500000,
  };
  let state = reducer(undefined, startCollection({ id: 'r', draft }));
  state = reducer(
    state,
    startCollection({
      id: 'r',
      draft: { ...draft, key: 'second', received: 700000 },
    }),
  );
  assert.equal(state.drafts.r.key, 'first');
  assert.equal(state.drafts.r.received, 500000);
  state = reducer(
    state,
    collectionSaved({ id: 'r', handover: { paymentId: 'p' } }),
  );
  assert.equal(state.drafts.r.handover.paymentId, 'p');
  assert.deepEqual(reducer(state, { type: 'waiter/signOut' }).drafts, {});
});
