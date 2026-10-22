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
const { createAuthService } = require('../src/features/waiter/auth/authService.ts');
const { authenticated } = require('../src/features/waiter/shared/waiterSlice.ts');

function credentials(overrides = {}) {
  return {
    user: { userId: 'waiter-id', userName: 'waiter', fullName: 'Nguyễn An', email: 'waiter@gmail.com', roleId: 'waiter', isActive: true },
    accessToken: 'access', refreshToken: 'refresh', sessionId: 'session',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sessionExpiresAt: new Date(Date.now() + 3600_000).toISOString(), ...overrides,
  };
}
const reply = result => ({ data: { isSuccess: true, result } });

test('login uses email contract and the real active waiter profile', async () => {
  const calls = [];
  const auth = createAuthService({ post: async (...args) => { calls.push(args); return reply(credentials()); } });
  const profile = await auth.login(' waiter@gmail.com ', '123');
  assert.deepEqual(calls[0], ['/api/auth/login', { email: 'waiter@gmail.com', password: '123' }]);
  assert.equal(profile.id, 'waiter-id');
  assert.equal(profile.name, 'Nguyễn An');
  assert.equal(await auth.token(), 'access');
  const state = reducer(undefined, authenticated(profile));
  assert.equal(state.authMode, 'api');
  assert.equal(state.waiter.id, 'waiter-id');
});

test('non-waiter and inactive accounts cannot enter and their sessions are revoked', async () => {
  for (const user of [
    { ...credentials().user, roleId: 'manager' },
    { ...credentials().user, isActive: false },
  ]) {
    const calls = [];
    const auth = createAuthService({ post: async (...args) => {
      calls.push(args);
      return reply(credentials({ user }));
    } });
    await assert.rejects(auth.login('x', '123'), /nhân viên phục vụ/);
    assert.equal(await auth.token(), null);
    assert.equal(calls[1][0], '/api/auth/logout');
    assert.equal(calls[1][2].headers.Authorization, 'Bearer access');
  }
});

test('concurrent expiration requests rotate refresh token only once', async () => {
  let refreshCalls = 0;
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials({ expiresAt: new Date(Date.now() + 10_000).toISOString() }));
    refreshCalls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return reply(credentials({ accessToken: 'new-access', refreshToken: 'new-refresh' }));
  } });
  await auth.login('x', '123');
  assert.deepEqual(await Promise.all([auth.token(), auth.token()]), ['new-access', 'new-access']);
  assert.equal(await auth.unauthorized('access'), 'new-access');
  assert.equal(refreshCalls, 1);
});

test('refresh failure removes access and notifies the route guard', async () => {
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials());
    throw new Error('revoked');
  } });
  await auth.login('x', '123');
  let expired = false;
  auth.onExpired(() => { expired = true; });
  await assert.rejects(auth.unauthorized('access'), /revoked/);
  assert.equal(expired, true);
  assert.equal(await auth.token(), null);
});

test('logout revokes the server session and clears local credentials on network failure', async () => {
  const calls = [];
  const auth = createAuthService({ post: async (...args) => {
    calls.push(args);
    if (args[0].endsWith('/login')) return reply(credentials());
    throw new Error('offline');
  } });
  await auth.login('x', '123');
  await assert.rejects(auth.logout(), /offline/);
  assert.equal(calls[1][0], '/api/auth/logout');
  assert.equal(calls[1][2].headers.Authorization, 'Bearer access');
  assert.equal(await auth.token(), null);
});

test('late refresh cannot restore credentials after logout', async () => {
  let resolveRefresh;
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials());
    return new Promise(resolve => { resolveRefresh = resolve; });
  } });
  await auth.login('x', '123');
  const pending = auth.unauthorized('access');
  auth.clear();
  resolveRefresh(reply(credentials({ accessToken: 'late-token' })));
  await assert.rejects(pending, /thay đổi/);
  assert.equal(await auth.token(), null);
});

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
  assert.equal(loggedOut.waiter, null);
  assert.equal(loggedOut.alerts, false);
  assert.equal(loggedOut.feedback, null);
  for (const key of ['tables', 'sessions', 'items', 'customerOrders', 'requests', 'reservations', 'logs']) {
    assert.deepEqual(loggedOut[key], active[key]);
  }
  const resumed = reducer(loggedOut, enterDemo());
  assert.equal(resumed.signedIn, true);
  assert.deepEqual(resumed.sessions, active.sessions);
});
