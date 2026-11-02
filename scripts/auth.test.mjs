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
const { default: reducer, enterDemo, signOut, setAlerts } = require('../src/features/waiter/shared/store/waiterSlice.ts');
const storageModule = require.resolve('../src/features/auth/storage.ts');
require.cache[storageModule] = { id: storageModule, filename: storageModule, loaded: true, exports: { authStorage: { read: async () => null, write: async () => {} } } };
const { createAuthService: createService } = require('../src/features/auth/api/authApi.ts');
function memoryStorage(value = null) {
  return { read: async () => value, write: async next => { value = next; } };
}
function createAuthService(client, storage = memoryStorage()) { return createService(client, storage); }
const { default: authReducer, sessionChanged } = require('../src/features/auth/authSlice.ts');
const { authenticated } = require('../src/features/waiter/shared/store/waiterSlice.ts');

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

test('unsupported roles and inactive accounts cannot enter and their sessions are revoked', async () => {
  for (const user of [
    { ...credentials().user, roleId: 'manager' },
    { ...credentials().user, isActive: false },
  ]) {
    const calls = [];
    const auth = createAuthService({ post: async (...args) => {
      calls.push(args);
      return reply(credentials({ user }));
    } });
    await assert.rejects(auth.login('x', '123'), /tài khoản phục vụ hoặc nhân viên kho/);
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
  auth.onChange(user => { if (!user) expired = true; });
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
  await assert.rejects(auth.logout(), /chưa xác nhận được việc đăng xuất trên máy chủ/);
  assert.equal(calls[1][0], '/api/auth/logout');
  assert.equal(calls[1][2].headers.Authorization, 'Bearer access');
  assert.equal(await auth.token(), null);
});

test('late refresh cannot restore credentials after logout', async () => {
  let resolveRefresh;
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials());
    if (path.endsWith('/logout')) return reply(null);
    return new Promise(resolve => { resolveRefresh = resolve; });
  } });
  await auth.login('x', '123');
  const pending = auth.unauthorized('access');
  auth.clear();
  resolveRefresh(reply(credentials({ accessToken: 'late-token' })));
  await assert.rejects(pending, /Phiên đăng nhập đã thay đổi/);
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

test('inventory signs in through the same API and updates the common auth state', async () => {
  const user = { ...credentials().user, userId: 'inventory-id', roleId: 'inventory' };
  const auth = createAuthService({ post: async () => reply(credentials({ user })) });
  let state = authReducer(undefined, { type: '@@init' });
  auth.onChange(user => { state = authReducer(state, sessionChanged({ user })); });
  const profile = await auth.login('inventory@gmail.com', 'secret');
  assert.equal(profile.role, 'inventory');
  assert.equal(state.status, 'signedIn');
  assert.equal(JSON.stringify(state).includes('refreshToken'), false);
});

test('native session restoration verifies with refresh and persists only rotated refresh credentials', async () => {
  const storage = memoryStorage({ refreshToken: 'saved-refresh', sessionExpiresAt: credentials().sessionExpiresAt });
  const calls = [];
  const auth = createAuthService({ post: async (...args) => { calls.push(args); return reply(credentials({ accessToken: 'restored-access', refreshToken: 'rotated-refresh' })); } }, storage);
  let profile;
  auth.onChange(user => { profile = user; });
  await Promise.all([auth.restore(), auth.restore()]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['/api/auth/refresh', { refreshToken: 'saved-refresh' }]);
  assert.equal(await auth.token(), 'restored-access');
  assert.equal(profile.role, 'waiter');
  assert.deepEqual(Object.keys(await storage.read()).sort(), ['refreshToken', 'sessionExpiresAt']);
  assert.equal((await storage.read()).refreshToken, 'rotated-refresh');
});

test('failed restore clears saved credentials instead of opening a workspace', async () => {
  const storage = memoryStorage({ refreshToken: 'revoked', sessionExpiresAt: credentials().sessionExpiresAt });
  const auth = createAuthService({ post: async () => { throw new Error('Session revoked'); } }, storage);
  let user = 'not-checked';
  auth.onChange(value => { user = value; });
  await auth.restore();
  assert.equal(user, null);
  assert.equal(await storage.read(), null);
  assert.equal(await auth.token(), null);
});

test('late login cannot restore a session after sign out and revokes its returned token', async () => {
  let resolveLogin;
  const calls = [];
  const auth = createAuthService({ post: async (...args) => {
    calls.push(args);
    if (args[0].endsWith('/login')) return new Promise(resolve => { resolveLogin = resolve; });
    return reply(null);
  } });
  const pending = auth.login('staff@example.com', 'secret');
  await new Promise(resolve => setTimeout(resolve, 0));
  await auth.clear();
  resolveLogin(reply(credentials()));
  await assert.rejects(pending, /Phiên đăng nhập đã thay đổi/);
  assert.equal(await auth.token(), null);
  assert.equal(calls.at(-1)[0], '/api/auth/logout');
});

test('overlapping logins cannot let an older response overwrite a newer account', async () => {
  const resolvers = [];
  const auth = createAuthService({ post: async path => path.endsWith('/login') ? new Promise(resolve => resolvers.push(resolve)) : reply(null) });
  const first = auth.login('first@example.com', 'secret');
  await new Promise(resolve => setTimeout(resolve, 0));
  const second = auth.login('second@example.com', 'secret');
  await new Promise(resolve => setTimeout(resolve, 0));
  resolvers[1](reply(credentials({ accessToken: 'second', user: { ...credentials().user, roleId: 'inventory', userId: 'second' } })));
  await second;
  resolvers[0](reply(credentials()));
  await assert.rejects(first, /Phiên đăng nhập đã thay đổi/);
  assert.equal(await auth.token(), 'second');
});

test('sign out removes device credentials even if the server is offline', async () => {
  const storage = memoryStorage();
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials());
    throw new Error('offline');
  } }, storage);
  await auth.login('waiter@example.com', 'secret');
  assert(await storage.read());
  await assert.rejects(auth.logout(), /chưa xác nhận được việc đăng xuất trên máy chủ/);
  assert.equal(await storage.read(), null);
  assert.equal(await auth.token(), null);
});

test('a session is not accepted if secure persistence fails', async () => {
  const calls = [];
  const storage = { read: async () => null, write: async value => { if (value) throw new Error('Storage unavailable'); } };
  const auth = createAuthService({ post: async (...args) => { calls.push(args); return reply(credentials()); } }, storage);
  await assert.rejects(auth.login('waiter@example.com', 'secret'), /Storage unavailable/);
  assert.equal(await auth.token(), null);
  assert.equal(calls.at(-1)[0], '/api/auth/logout');
});

test('a late failed logout cannot replace a newly signed-in profile', async () => {
  let failLogout;
  const auth = createAuthService({ post: async path => {
    if (path.endsWith('/login')) return reply(credentials());
    return new Promise((_, reject) => { failLogout = reject; });
  } });
  let current;
  auth.onChange(user => { current = user; });
  await auth.login('first@example.com', 'secret');
  const pending = auth.logout();
  await auth.login('second@example.com', 'secret');
  failLogout(new Error('offline'));
  await assert.rejects(pending, /chưa xác nhận được việc đăng xuất trên máy chủ/);
  assert.equal(current.id, 'waiter-id');
  assert.equal(await auth.token(), 'access');
});

test('username login uses the backend email field without requiring email syntax', async () => {
  const calls = [];
  const auth = createAuthService({ post: async (...args) => { calls.push(args); return reply(credentials()); } });
  await auth.login(' waiter01 ', 'secret');
  assert.deepEqual(calls[0], ['/api/auth/login', { email: 'waiter01', password: 'secret' }]);
  assert.equal(await auth.token(), 'access');
});
