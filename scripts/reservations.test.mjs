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
const {
  createReservationService,
} = require('../src/features/waiter/reservations/api/reservationService.ts');
const {
  reservationStartAt,
  reservationDateFields,
  reservationCanCheckIn,
  reservationTabs,
} = require('../src/features/waiter/reservations/utils/liveReservation.ts');
const reply = (result) => ({ data: { isSuccess: true, result } });

test('reservation list loads all pages with backend status and cancellation signal', async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const api = createReservationService({
    get: async (url, config) => {
      calls.push({ url, ...config });
      return reply({
        items: [{ reservationId: `r${config.params.page}` }],
        totalCount: 2,
      });
    },
  });
  assert.deepEqual(await api.list('CheckedIn', signal), [
    { reservationId: 'r1' },
    { reservationId: 'r2' },
  ]);
  assert.deepEqual(
    calls,
    [1, 2].map((page) => ({
      url: '/api/reservations',
      signal,
      params: { status: 'CheckedIn', page, pageSize: 100 },
    })),
  );
});

test('empty terminal page stops pagination even if total count changes', async () => {
  let count = 0;
  const api = createReservationService({
    get: async () => {
      count++;
      return reply({ items: [], totalCount: 10 });
    },
  });
  assert.deepEqual(await api.list('Pending'), []);
  assert.equal(count, 1);
});

test('detail and availability use the actual gateway contracts', async () => {
  const calls = [];
  const api = createReservationService({
    get: async (...args) => {
      calls.push(args);
      return reply({ ok: true });
    },
  });
  const signal = new AbortController().signal;
  const params = {
    restaurantId: 'restaurant',
    areaId: 'area',
    partySize: 6,
    startAt: '2026-11-10T12:00:00.000Z',
  };
  await api.detail('r1', signal);
  await api.availability(params, signal);
  assert.deepEqual(calls, [
    ['/api/reservations/r1', { signal }],
    ['/api/reservations/availability', { signal, params }],
  ]);
});

test('confirmation preserves all selected tables; update sends PUT with time and table IDs only', async () => {
  const calls = [];
  const api = createReservationService({
    post: async (...args) => {
      calls.push(['post', ...args]);
      return reply({ status: 'Confirmed' });
    },
    put: async (...args) => {
      calls.push(['put', ...args]);
      return reply({ status: 'Confirmed' });
    },
  });
  const tableIds = ['t1', 't2'];
  const startAt = '2026-11-10T12:00:00.000Z';
  await api.act({ action: 'confirm', id: 'r1', tableIds });
  await api.act({ action: 'update', id: 'r1', tableIds, startAt });
  assert.deepEqual(calls, [
    ['post', '/api/reservations/r1/confirm', { tableIds }],
    ['put', '/api/reservations/r1', { tableIds, startAt }],
  ]);
});

test('reject, check-in and cancel post without unsupported reason or session fields', async () => {
  const calls = [];
  const api = createReservationService({
    post: async (...args) => {
      calls.push(args);
      return reply({ ok: true });
    },
  });
  for (const action of ['reject', 'check-in', 'cancel'])
    await api.act({ action, id: 'r1' });
  assert.deepEqual(
    calls,
    ['reject', 'check-in', 'cancel'].map((action) => [
      `/api/reservations/r1/${action}`,
      undefined,
    ]),
  );
});

test('failed responses and transport errors are not reported as successful reservations', async () => {
  const fail = async () => ({
    data: { isSuccess: false, message: 'The request is Expired.' },
  });
  const api = createReservationService({ get: fail, post: fail, put: fail });
  for (const operation of [
    () => api.list('Pending'),
    () => api.detail('r1'),
    () => api.availability({}),
    () => api.act({ action: 'confirm', id: 'r1', tableIds: ['t1'] }),
    () =>
      api.act({
        action: 'update',
        id: 'r1',
        tableIds: ['t1'],
        startAt: '2026-11-10T12:00:00Z',
      }),
  ])
    await assert.rejects(operation, /Expired/);
  const offline = createReservationService({
    post: async () => {
      throw new Error('offline');
    },
  });
  await assert.rejects(
    () => offline.act({ action: 'check-in', id: 'r1' }),
    /offline/,
  );
});

test('local schedule input rejects invalid dates and times rather than rolling them forward', () => {
  for (const [date, time] of [
    ['31/02/2028', '12:00'],
    ['29/02/2027', '12:00'],
    ['01/13/2026', '12:00'],
    ['01/11/2026', '24:00'],
    ['01/11/2026', '12:60'],
    ['2026-11-01', '12:00'],
  ]) {
    assert.equal(reservationStartAt(date, time), null);
  }
  const iso = reservationStartAt('29/02/2028', '08:30');
  assert.equal(iso, new Date(2028, 1, 29, 8, 30).toISOString());
  assert.deepEqual(reservationDateFields(iso), {
    date: '29/02/2028',
    time: '08:30',
  });
});

test('check-in uses Confirmed, the 30-minute opening and server-provided hold deadline', () => {
  const startAt = '2026-11-10T12:00:00Z',
    holdUntil = '2026-11-10T12:30:00Z';
  const r = { status: 'Confirmed', startAt, holdUntil };
  assert.equal(
    reservationCanCheckIn(r, Date.parse(startAt) - 30 * 60000 - 1),
    false,
  );
  assert.equal(
    reservationCanCheckIn(r, Date.parse(startAt) - 30 * 60000),
    true,
  );
  assert.equal(reservationCanCheckIn(r, Date.parse(holdUntil) - 1), true);
  assert.equal(reservationCanCheckIn(r, Date.parse(holdUntil)), false);
  assert.equal(
    reservationCanCheckIn({ ...r, status: 'CheckedIn' }, Date.parse(startAt)),
    false,
  );
  assert.equal(
    reservationCanCheckIn({ ...r, holdUntil: null }, Date.parse(startAt)),
    false,
  );
  assert.deepEqual(
    Object.values(reservationTabs).sort(),
    [
      'Pending',
      'Confirmed',
      'CheckedIn',
      'Rejected',
      'Cancelled',
      'Expired',
      'NoShow',
    ].sort(),
  );
});
