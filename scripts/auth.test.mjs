import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// Load the unchanged Metro TypeScript modules and static image imports in Node.
const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions['.jpg'] = (module, filename) => { module.exports = filename; };
const { default: reducer, enterDemo, signOut, setAlerts } = require('../src/features/waiter/shared/waiterSlice.ts');

test('demo entry and reload follow the original waiter session behavior', () => {
  const initial = reducer(undefined, { type: '@@init' });
  assert.equal(initial.signedIn, false);
  assert.equal(reducer(initial, enterDemo()).signedIn, true);
  assert.equal(reducer(undefined, { type: '@@init' }).signedIn, false);
});

test('logout clears session flags and feedback while preserving waiter data', () => {
  let active = reducer(undefined, enterDemo());
  active = reducer(active, setAlerts(true));
  active = { ...active, feedback: { id: 'notice', text: 'Demo', error: false } };
  const loggedOut = reducer(active, signOut());
  assert.equal(loggedOut.signedIn, false);
  assert.equal(loggedOut.alerts, false);
  assert.equal(loggedOut.feedback, null);
  for (const key of ['tables', 'sessions', 'items', 'requests', 'reservations', 'logs']) {
    assert.deepEqual(loggedOut[key], active[key]);
  }
  const resumed = reducer(loggedOut, enterDemo());
  assert.equal(resumed.signedIn, true);
  assert.deepEqual(resumed.sessions, active.sessions);
});
