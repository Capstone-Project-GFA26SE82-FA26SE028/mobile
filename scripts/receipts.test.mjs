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
const form = require('../src/features/inventory/receipts/schemas/receiptSchema.ts');
const {
  receiptDate,
} = require('../src/features/inventory/receipts/utils/receiptDate.ts');
const line = (patch = {}) => ({
  key: 'row',
  ingredient: { ingredientId: 'ingredient', isActive: true, baseUnit: 'kg' },
  quantity: '1,25',
  expiry: '29/02/2028',
  unitId: null,
  factor: 1,
  unitLabel: 'kg',
  ...patch,
});

test('validates real calendar dates and preserves date-only values', () => {
  assert.equal(form.receiptExpiry('29/02/2028'), '2028-02-29');
  for (const date of [
    '29/02/2027',
    '31/04/2028',
    '00/01/2028',
    '01/13/2028',
    '01/01/0000',
  ])
    assert.equal(form.receiptExpiry(date), null);
  assert.ok(receiptDate('2028-02-29', true).includes('29/02/2028'));
});

test('fixed date segments preserve empty parts and normalize without shifting digits', () => {
  assert.equal(form.updateReceiptExpiry('', 1, '12'), '/12/');
  assert.equal(form.updateReceiptExpiry('/12/', 2, '2028'), '/12/2028');
  assert.equal(form.updateReceiptExpiry('/12/2028', 0, '60'), '31/12/2028');
  assert.equal(form.updateReceiptExpiry('31/12/2028', 1, '60'), '31/12/2028');
  assert.equal(form.updateReceiptExpiry('31/12/2028', 1, '04'), '30/04/2028');
  assert.equal(form.updateReceiptExpiry('29/02/2028', 2, '2027'), '28/02/2027');
  assert.equal(form.updateReceiptExpiry('31/12/2028', 0, ''), '/12/2028');
  assert.equal(form.updateReceiptExpiry('31/12/2028', 1, ''), '31//2028');
});

test('quantities reject rounding, overflow and unrepresentable JSON decimals', () => {
  assert.equal(form.receiptQuantity('1,25'), 1.25);
  assert.equal(form.receiptQuantity('0.000001'), 0.000001);
  assert.equal(form.receiptQuantity('2', 0.5), 2);
  for (const value of [
    '0',
    '-1',
    '1e2',
    '1.1234567',
    '1000000000000',
    '999999999999.999999',
    'NaN',
  ])
    assert.equal(form.receiptQuantity(value), null);
  assert.equal(form.receiptQuantity('0.000001', 0.5), null);
  assert.equal(form.receiptQuantity('999999999999', 2), null);
});

test('payload keeps received input quantity and selected unit without client conversion', () => {
  const payload = form.buildReceipt(
    'stable-id',
    [line({ unitId: 'box', factor: 10 })],
    ' note ',
  );
  assert.deepEqual(payload, {
    goodsReceiptId: 'stable-id',
    note: 'note',
    items: [
      {
        ingredientId: 'ingredient',
        unitId: 'box',
        receivedQuantity: 1.25,
        expiryDate: '2028-02-29',
      },
    ],
  });
});

test('duplicate ingredient/expiry is rejected even when units differ', () => {
  assert.throws(() =>
    form.buildReceipt('id', [line(), line({ unitId: 'box' })], ''),
  );
  assert.equal(
    form.buildReceipt('id', [line(), line({ expiry: '01/03/2028' })], '').items
      .length,
    2,
  );
  assert.throws(() => form.buildReceipt('id', [], ''));
  assert.throws(() =>
    form.buildReceipt(
      'id',
      [line({ ingredient: { ingredientId: 'inactive', isActive: false } })],
      '',
    ),
  );
  assert.throws(() => form.buildReceipt('id', [line()], 'x'.repeat(1001)));
});

let identity = 'session';
let handler;
const calls = [];
const clientModule = require.resolve('../src/api/axiosClient.ts');
require.cache[clientModule] = {
  id: clientModule,
  filename: clientModule,
  loaded: true,
  exports: {
    axiosClient: {
      get: async (...args) => {
        calls.push(['get', ...args]);
        return handler(...args);
      },
      post: async (...args) => {
        calls.push(['post', ...args]);
        return handler(...args);
      },
    },
  },
};
const authModule = require.resolve('../src/features/auth/api/authApi.ts');
require.cache[authModule] = {
  id: authModule,
  filename: authModule,
  loaded: true,
  exports: { authService: { identity: () => identity } },
};
const api = require('../src/features/inventory/receipts/api/receiptApi.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });

test('receipt ingredient selection requests active ingredients with server pagination', async () => {
  calls.length = 0;
  const signal = new AbortController().signal;
  handler = async () =>
    reply({
      items: [{ ingredientId: 'active', isActive: true }],
      page: 2,
      pageSize: 20,
      totalCount: 25,
    });
  const page = await api.getReceiptIngredients(2, ' chicken ', signal);
  assert.equal(page.page, 2);
  assert.deepEqual(calls[0], [
    'get',
    '/api/ingredients',
    {
      params: { page: 2, pageSize: 20, search: 'chicken', isActive: true },
      signal,
    },
  ]);
});

test('receipt ingredient detail rejects a response for another ingredient', async () => {
  handler = async () =>
    reply({ ingredientId: 'ABC', ingredientName: 'Chicken', baseUnit: 'kg' });
  assert.equal(
    (await api.getReceiptIngredient('abc')).ingredientName,
    'Chicken',
  );
  await assert.rejects(api.getReceiptIngredient('other'), /không khớp/);
});

test('create retries use the same client receipt ID and account session', async () => {
  calls.length = 0;
  const body = form.buildReceipt('fixed-id', [line()], '');
  handler = async () => {
    throw new Error('lost response');
  };
  await assert.rejects(api.createReceipt(body, 'session'));
  handler = async () => reply({ goodsReceiptId: 'fixed-id', status: 'Draft' });
  await api.createReceipt(body, 'session');
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls[1].slice(1), [
    '/api/goods-receipts',
    body,
    { staffSession: 'session' },
  ]);
});

test('confirmation accepts only the same receipt in Confirmed status', async () => {
  handler = async () => reply({ goodsReceiptId: 'other', status: 'Confirmed' });
  await assert.rejects(api.confirmReceipt('id', 'session'));
  handler = async () => reply({ goodsReceiptId: 'id', status: 'Draft' });
  await assert.rejects(api.confirmReceipt('id', 'session'));
  handler = async () => reply({ goodsReceiptId: 'id', status: 'Confirmed' });
  assert.equal((await api.confirmReceipt('id', 'session')).status, 'Confirmed');
});

test('late write response cannot be accepted after account changes', async () => {
  handler = async () => {
    identity = 'different-session';
    return reply({ goodsReceiptId: 'id', status: 'Confirmed' });
  };
  await assert.rejects(api.confirmReceipt('id', 'session'));
  identity = 'session';
});
