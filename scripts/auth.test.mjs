import test from 'node:test';
import assert from 'node:assert/strict';
import reducer, { enterDemo, signOut } from '../src/features/auth/authSlice.ts';

test('new sessions start signed out, including after a reload', () => {
  assert.equal(reducer(undefined, { type: '@@init' }).signedIn, false);
  const active = reducer(undefined, enterDemo());
  assert.equal(active.signedIn, true);
  assert.equal(reducer(undefined, { type: '@@init' }).signedIn, false);
});

test('logout clears access and allows a fresh demo session', () => {
  const active = reducer(undefined, enterDemo());
  const loggedOut = reducer(active, signOut());
  assert.equal(loggedOut.signedIn, false);
  assert.equal(active.signedIn, true);
  assert.deepEqual(reducer(loggedOut, signOut()), loggedOut);
  assert.equal(reducer(loggedOut, enterDemo()).signedIn, true);
});
