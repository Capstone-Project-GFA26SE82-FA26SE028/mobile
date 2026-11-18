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
  createNotificationService,
} = require('../src/features/waiter/notifications/api/notificationService.ts');
const {
  default: reducer,
  notificationsReceived,
  setNotificationSound,
} = require('../src/features/waiter/notifications/store/notificationSlice.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });
const notification = (id, readAt = null) => ({
  id,
  readAt,
  createdAt: '2026-11-19T08:00:00Z',
});

test('list forwards filters/signal, paginates and deduplicates overlapping pages', async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const api = createNotificationService({
    get: async (url, config) => {
      calls.push([url, config]);
      return reply({
        items:
          config.params.page === 1
            ? [notification('a'), notification('b')]
            : [notification('b'), notification('c')],
        totalCount: 4,
      });
    },
  });
  assert.deepEqual(
    (await api.list({ isRead: false, type: 'DineInItemReady' }, signal)).map(
      (r) => r.id,
    ),
    ['a', 'b', 'c'],
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[1][0], '/api/notifications');
  assert.equal(calls[1][1].signal, signal);
  assert.equal(calls[1][1].params.page, 2);
  assert.equal(calls[1][1].params.isRead, false);
});
test('count and detail use exact backend result shapes', async () => {
  const api = createNotificationService({
    get: async (url) =>
      reply(
        url.endsWith('unread-count')
          ? { count: 3 }
          : { notification: notification('a'), recipients: [] },
      ),
  });
  assert.equal(await api.unreadCount(), 3);
  assert.equal((await api.detail('a')).notification.id, 'a');
});
test('read mutations use PATCH with no body and accept null result', async () => {
  const calls = [];
  const api = createNotificationService({
    patch: async (...args) => {
      calls.push(args);
      return reply(null);
    },
  });
  await api.markRead('a');
  await api.markAllRead();
  assert.deepEqual(calls, [
    ['/api/notifications/a/read'],
    ['/api/notifications/read-all'],
  ]);
});
test('backend rejection propagates', async () => {
  const api = createNotificationService({
    get: async () => ({ data: { isSuccess: false, message: 'Denied' } }),
  });
  await assert.rejects(api.list(), /Denied/);
});
test('baseline is silent, new unread batch rings once and repeated polling stays silent', () => {
  let state = reducer(undefined, notificationsReceived([notification('old')]));
  assert.equal(state.soundCue, 0);
  state = reducer(
    state,
    notificationsReceived([
      notification('new'),
      notification('second'),
      notification('old'),
    ]),
  );
  assert.equal(state.soundCue, 1);
  state = reducer(
    state,
    notificationsReceived([notification('new'), notification('old', 'now')]),
  );
  assert.equal(state.soundCue, 1);
  state = reducer(
    state,
    notificationsReceived([notification('already-read', 'now')]),
  );
  assert.equal(state.soundCue, 1);
});
test('mute consumes IDs without replay on enabling, logout clears tracking', () => {
  let state = reducer(undefined, notificationsReceived([]));
  state = reducer(state, setNotificationSound(false));
  state = reducer(state, notificationsReceived([notification('muted')]));
  assert.equal(state.soundCue, 0);
  state = reducer(state, setNotificationSound(true));
  state = reducer(state, notificationsReceived([notification('muted')]));
  assert.equal(state.soundCue, 0);
  state = reducer(state, { type: 'waiter/signOut' });
  assert.equal(state.initialized, false);
  assert.deepEqual(state.knownIds, {});
});
test('bundled bell is PCM WAV with valid non-silent sample data', () => {
  const wav = readFileSync(
    new URL(
      '../src/features/waiter/notifications/assets/notification-bell.wav',
      import.meta.url,
    ),
  );
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(24), 44100);
  assert.equal(wav.readUInt32LE(40), wav.length - 44);
  let peak = 0;
  for (let i = 44; i < wav.length; i += 2)
    peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
  assert.ok(peak > 1000 && peak < 32767);
});

test('web bell uses bundled URI, shares unlocked player and propagates autoplay rejection', async () => {
  const created = [],
    cleanup = [];
  class FakeAudio {
    currentTime = 9;
    plays = 0;
    denied = false;
    constructor(uri) {
      this.uri = uri;
      created.push(this);
    }
    async play() {
      this.plays++;
      if (this.denied) throw new Error('NotAllowedError');
    }
    pause() {
      this.paused = true;
    }
  }
  const source = readFileSync(
    new URL(
      '../src/features/waiter/notifications/hooks/useBell.web.ts',
      import.meta.url,
    ),
    'utf8',
  );
  const module = { exports: {} };
  const stubRequire = (name) => {
    if (name === 'react')
      return { useCallback: (fn) => fn, useEffect: (fn) => cleanup.push(fn()) };
    if (name === 'expo-asset')
      return { Asset: { fromModule: () => ({ uri: '/assets/bell.wav' }) } };
    if (name.endsWith('.wav')) return 123;
    throw new Error(name);
  };
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function('require', 'module', 'exports', 'Audio', js)(
    stubRequire,
    module,
    module.exports,
    FakeAudio,
  );
  const listenerPlay = module.exports.useBell();
  const buttonPlay = module.exports.useBell();
  await buttonPlay();
  await listenerPlay();
  assert.equal(created.length, 1);
  assert.equal(created[0].uri, '/assets/bell.wav');
  assert.equal(created[0].plays, 2);
  assert.equal(created[0].currentTime, 0);
  created[0].denied = true;
  await assert.rejects(listenerPlay(), /NotAllowedError/);
  cleanup[0]();
  assert.equal(created[0].paused, undefined);
  cleanup[1]();
  assert.equal(created[0].paused, true);
});
