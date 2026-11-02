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
  });
  module._compile(outputText, filename);
};
const {
  validateProfile,
  validatePassword,
} = require('../src/features/profile/schemas/profileSchema.ts');
const profile = {
  userId: 'user-1',
  userName: 'staff',
  fullName: 'Nguyễn An',
  email: 'staff@example.com',
  phoneNumber: null,
  avatarUrl: null,
  roleId: 'inventory',
  isActive: true,
};
let identity = 'user-1:session-1';
let calls = [];
let respond = async () => ({ data: { isSuccess: true, result: profile } });
let updates = [];
let cleared = [];
const authService = {
  identity: () => identity,
  updateName: (...args) => updates.push(args),
  clear: async (message) => {
    cleared.push(message);
    identity = null;
  },
};
const axiosClient = Object.fromEntries(
  ['get', 'put', 'post'].map((method) => [
    method,
    (...args) => {
      calls.push([method, ...args]);
      return respond();
    },
  ]),
);
for (const [name, exports] of [
  ['../src/api/axiosClient.ts', { axiosClient }],
  ['../src/features/auth/api/authApi.ts', { authService }],
]) {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
const api = require('../src/features/profile/api/profileApi.ts');
function reset() {
  identity = 'user-1:session-1';
  calls = [];
  updates = [];
  cleared = [];
  respond = async () => ({ data: { isSuccess: true, result: profile } });
}

test('profile validates editable fields, optional phone and HTTP/HTTPS avatar', () => {
  assert.deepEqual(
    validateProfile({ fullName: ' An ', phoneNumber: '', avatarUrl: '' }),
    {},
  );
  const errors = validateProfile({
    fullName: ' ',
    phoneNumber: '123abc',
    avatarUrl: 'file:///secret',
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    'avatarUrl',
    'fullName',
    'phoneNumber',
  ]);
  assert.deepEqual(
    validateProfile({
      fullName: 'An',
      phoneNumber: '0901234567',
      avatarUrl: 'https://example.com/avatar.png',
    }),
    {},
  );
});

test('password validates backend byte limits, matching confirmation and different password', () => {
  const valid = {
    currentPassword: 'old-password',
    newPassword: 'a'.repeat(72),
    confirmPassword: 'a'.repeat(72),
  };
  assert.deepEqual(validatePassword(valid), {});
  assert.ok(
    validatePassword({ ...valid, newPassword: 'a'.repeat(73) }).newPassword,
  );
  assert.deepEqual(
    validatePassword({
      ...valid,
      newPassword: 'á'.repeat(36),
      confirmPassword: 'á'.repeat(36),
    }),
    {},
  );
  assert.ok(
    validatePassword({ ...valid, newPassword: 'á'.repeat(37) }).newPassword,
  );
  assert.ok(
    validatePassword({ ...valid, newPassword: 'old-password' }).newPassword,
  );
  assert.ok(
    validatePassword({ ...valid, confirmPassword: 'different' })
      .confirmPassword,
  );
  assert.ok(
    validatePassword({ ...valid, newPassword: '        ' }).newPassword,
  );
});

test('get/update use self-profile endpoint; update sends only editable fields and synchronizes name', async () => {
  reset();
  assert.equal((await api.getProfile()).userId, profile.userId);
  assert.equal(calls[0][1], '/api/users/me');
  await api.updateProfile({
    fullName: ' Nguyễn An ',
    phoneNumber: ' 0901234567 ',
    avatarUrl: '',
  });
  assert.deepEqual(calls[1], [
    'put',
    '/api/users/me',
    { fullName: 'Nguyễn An', phoneNumber: '0901234567', avatarUrl: '' },
    { staffSession: 'user-1:session-1' },
  ]);
  assert.deepEqual(updates, [['Nguyễn An', 'user-1:session-1']]);
});

test('another user response and a late save after account change are rejected without syncing profile', async () => {
  reset();
  respond = async () => ({
    data: { isSuccess: true, result: { ...profile, userId: 'user-2' } },
  });
  await assert.rejects(api.getProfile(), /không khớp/);
  respond = async () => {
    identity = 'user-2:session-2';
    return { data: { isSuccess: true, result: profile } };
  };
  await assert.rejects(
    api.updateProfile({ fullName: 'An', phoneNumber: '', avatarUrl: '' }),
    /Tài khoản đã thay đổi/,
  );
  assert.deepEqual(updates, []);
});

test('password success clears current session; failure or stale response does not clear a different account', async () => {
  reset();
  const values = {
    currentPassword: 'old-password',
    newPassword: 'new-password',
    confirmPassword: 'new-password',
  };
  await api.changePassword(values);
  assert.deepEqual(calls[0], [
    'post',
    '/api/auth/change-password',
    values,
    { staffSession: 'user-1:session-1' },
  ]);
  assert.equal(cleared.length, 1);
  reset();
  respond = async () => ({
    data: { isSuccess: false, message: 'Wrong password' },
  });
  await assert.rejects(api.changePassword(values), /Wrong password/);
  assert.deepEqual(cleared, []);
  respond = async () => {
    identity = 'user-2:session-2';
    return { data: { isSuccess: true, result: null } };
  };
  await assert.rejects(api.changePassword(values), /Tài khoản đã thay đổi/);
  assert.deepEqual(cleared, []);
});
