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
const { default: reducer, cartId, addCartLine, updateCartLine, removeCartLine,
  clearCart, startCartSubmission, failCartSubmission, completeCartSubmission } = require('../src/features/waiter/ordering/cartSlice.ts');
const line = (id = 'line') => ({ id, itemId: 'dish', name: 'Dish', price: 15000, quantity: 2, note: 'Less salt',
  options: [{ optionId: 'size', quantity: 1 }], optionNames: ['Large'] });
const add = (tableId = 'table', sessionId = 'session', id = 'line') => addCartLine({ tableId, sessionId, line: line(id) });
const key = cartId('table', 'session');

test('cart survives navigation independently of screens and isolates tables and sessions', () => {
  let state = reducer(undefined, add());
  state = reducer(state, add('other-table'));
  state = reducer(state, add('table', 'new-session'));
  assert.equal(Object.keys(state.carts).length, 3);
  assert.deepEqual(state.carts[key].lines[0], line());
  assert.equal(state.carts[key].sessionId, 'session');
});

test('quantities, notes, individual removal and clearing affect only the selected cart', () => {
  let state = reducer(undefined, add());
  state = reducer(state, add('table', 'session', 'second'));
  state = reducer(state, add('other-table'));
  state = reducer(state, updateCartLine({ cartId: key, lineId: 'line', quantity: 3, note: 'No onions' }));
  assert.equal(state.carts[key].lines.reduce((sum, l) => sum + l.price * l.quantity, 0), 75000);
  assert.equal(state.carts[key].lines[0].note, 'No onions');
  for (const quantity of [0, -1, 1.5, 100, NaN]) {
    state = reducer(state, updateCartLine({ cartId: key, lineId: 'line', quantity }));
    assert.equal(state.carts[key].lines[0].quantity, 3);
  }
  state = reducer(state, removeCartLine({ cartId: key, lineId: 'line' }));
  assert.equal(state.carts[key].lines.length, 1);
  state = reducer(state, clearCart(key));
  assert.equal(state.carts[key], undefined);
  assert.equal(state.carts[cartId('other-table', 'session')].lines.length, 1);
});

test('submission freezes exact payload and retains its key after ambiguous failures and remounts', () => {
  let state = reducer(undefined, add());
  state = reducer(state, startCartSubmission({ cartId: key, key: 'request' }));
  const snapshot = structuredClone(state.carts[key].lines);
  for (const action of [add(), updateCartLine({ cartId: key, lineId: 'line', quantity: 5 }),
    removeCartLine({ cartId: key, lineId: 'line' }), clearCart(key),
    startCartSubmission({ cartId: key, key: 'different' })]) state = reducer(state, action);
  assert.deepEqual(state.carts[key].lines, snapshot);
  state = reducer(state, failCartSubmission({ cartId: key, key: 'request', error: 'Network lost', definitive: false }));
  assert.equal(state.carts[key].status, 'uncertain');
  assert.equal(state.carts[key].requestKey, 'request');
  state = reducer(state, startCartSubmission({ cartId: key, key: 'different' }));
  assert.equal(state.carts[key].status, 'uncertain');
  state = reducer(state, startCartSubmission({ cartId: key, key: 'request' }));
  assert.equal(state.carts[key].status, 'sending');
  state = reducer(state, completeCartSubmission({ cartId: key, key: 'request' }));
  assert.equal(state.carts[key], undefined);
});

test('definitive rejection unlocks corrections; stale completions cannot delete a newer cart', () => {
  let state = reducer(undefined, add());
  state = reducer(state, startCartSubmission({ cartId: key, key: 'old' }));
  state = reducer(state, failCartSubmission({ cartId: key, key: 'old', error: 'Sold out', definitive: true }));
  state = reducer(state, updateCartLine({ cartId: key, lineId: 'line', quantity: 1 }));
  assert.equal(state.carts[key].lines[0].quantity, 1);
  state = reducer(state, startCartSubmission({ cartId: key, key: 'new' }));
  state = reducer(state, completeCartSubmission({ cartId: key, key: 'old' }));
  assert.equal(state.carts[key].requestKey, 'new');
});

test('logout, reauthentication and demo entry clear all staff drafts and pending keys', () => {
  for (const type of ['waiter/signOut', 'waiter/authenticated', 'waiter/enterDemo']) {
    let state = reducer(undefined, add());
    state = reducer(state, startCartSubmission({ cartId: key, key: 'old' }));
    state = reducer(state, { type });
    state = reducer(state, add());
    state = reducer(state, completeCartSubmission({ cartId: key, key: 'old' }));
    assert.equal(state.carts[key].status, 'draft');
    assert.equal(state.carts[key].requestKey, undefined);
  }
});
