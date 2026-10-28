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
let handler;
const calls = [];
const clientModule = require.resolve('../src/api/axiosClient.ts');
require.cache[clientModule] = { id: clientModule, filename: clientModule, loaded: true, exports: {
  axiosClient: { get: async (...args) => { calls.push(args); return handler(...args); } },
} };
const api = require('../src/features/inventory/stock/api/stockApi.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });
const page = (items, totalCount = items.length) => ({ items, totalCount, page: 1, pageSize: 20 });

test('list passes search, pagination, low-stock and active filters to the backend', async () => {
  calls.length = 0;
  const signal = new AbortController().signal;
  handler = async () => reply(page([{ ingredientId: 'item', stockQuantity: 0.000001 }]));
  const data = await api.getIngredients(2, ' chicken ', 'low', signal);
  assert.equal(calls[0][0], '/api/ingredients');
  assert.deepEqual(calls[0][1], { params: { page: 2, pageSize: 20, search: 'chicken', isActive: true, lowStockOnly: true }, signal });
  assert.equal(data.items[0].stockQuantity, 0.000001);
  await api.getIngredients(1, '', 'inactive');
  assert.equal(calls[1][1].params.isActive, false);
  assert.equal(calls[1][1].params.lowStockOnly, false);
  await api.getIngredients(1, '', 'all');
  assert.equal(calls[2][1].params.isActive, undefined);
});

test('overview counts use backend totals rather than the loaded page length', async () => {
  handler = async (_path, options) => reply(page([], options.params.lowStockOnly ? 9 : 127));
  assert.deepEqual(await api.getStockCounts(), { all: 127, low: 9 });
});

test('detail uses the selected ingredient and rejects a mismatched response', async () => {
  calls.length = 0;
  handler = async () => reply({ ingredientId: 'ABC', stockQuantity: 4.75 });
  assert.equal((await api.getIngredient('abc')).stockQuantity, 4.75);
  assert.equal(calls[0][0], '/api/ingredients/abc');
  await assert.rejects(api.getIngredient('other'), /does not match/);
});

test('lots preserve server expiry and availability flags and support pagination', async () => {
  calls.length = 0;
  handler = async () => reply(page([{ ingredientId: 'abc', expiryStatus: 'Expired', canIssue: false, remainingQuantity: 1.25 }]));
  const data = await api.getStockLots('abc', 3);
  assert.equal(calls[0][0], '/api/ingredients/abc/lots');
  assert.deepEqual(calls[0][1].params, { page: 3, pageSize: 20 });
  assert.equal(data.items[0].expiryStatus, 'Expired');
  assert.equal(data.items[0].canIssue, false);
  await assert.rejects(api.getStockLots('other', 1), /do not match/);
});

test('history preserves signed quantities and rejects another ingredient', async () => {
  calls.length = 0;
  handler = async () => reply(page([{ ingredientId: 'abc', quantityChange: -0.25, movementType: 'Cooking' }]));
  const data = await api.getStockMovements('abc', 2);
  assert.equal(calls[0][0], '/api/ingredients/abc/stock-movements');
  assert.deepEqual(calls[0][1].params, { page: 2, pageSize: 20 });
  assert.equal(data.items[0].quantityChange, -0.25);
  await assert.rejects(api.getStockMovements('other', 1), /does not match/);
});

test('backend failures are not presented as an empty or zero-stock success', async () => {
  handler = async () => ({ data: { isSuccess: false, message: 'Access denied', result: null } });
  await assert.rejects(api.getIngredients(1, '', 'all'), /Access denied/);
  await assert.rejects(api.getStockCounts(), /Access denied/);
});
