import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');

function harness(waiter, tableRows = []) {
  const modules = new Map();
  const state = { waiter };
  const mock = {
    '@/app/hooks': { useAppSelector: (selector) => selector(state) },
    react: { useState: (value) => [value, () => {}], useEffect: () => {} },
    'react-native': { AppState: { currentState: 'active' } },
    '@tanstack/react-query': {
      useQuery: (options) => ({
        ...options,
        data: options.queryKey.at(-1) === 'tables' ? tableRows : undefined,
      }),
      useMutation: (options) => options,
      useQueryClient: () => ({ invalidateQueries: () => {} }),
    },
  };
  function load(file) {
    file = resolve(file);
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    const js = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const importModule = (name) => {
      if (name in mock) return mock[name];
      if (name.endsWith('/tablesApi')) return { tablesApi: {} };
      if (name.endsWith('/orderingApi')) return { orderingApi: {} };
      if (name.endsWith('/reservationApi')) return { reservationApi: {} };
      if (name.endsWith('/notificationApi')) return { notificationApi: {} };
      if (name.endsWith('/collectionApi'))
        return {
          collectionApi: {
            list: async (restaurant) => [
              {
                serviceRequestId: restaurant,
                requestedAt:
                  restaurant === 'early'
                    ? '2026-11-19T07:00:00Z'
                    : '2026-11-19T08:00:00Z',
              },
            ],
          },
        };
      const target = resolve(dirname(file), name + '.ts');
      if (!existsSync(target)) throw new Error(name);
      return load(target);
    };
    new Function('require', 'module', 'exports', js)(
      importModule,
      module,
      module.exports,
    );
    return module.exports;
  }
  const base = resolve('src/features/waiter');
  return {
    state,
    tables: load(resolve(base, 'tables/hooks/useTables.ts')),
    orders: load(resolve(base, 'ordering/hooks/useOrders.ts')),
    menu: load(resolve(base, 'ordering/hooks/useMenu.ts')),
    reservations: load(resolve(base, 'reservations/hooks/useReservations.ts')),
    collection: load(resolve(base, 'cash-collection/hooks/useCollection.ts')),
    notifications: load(
      resolve(base, 'notifications/hooks/useNotifications.ts'),
    ),
  };
}
const account = {
  authMode: 'api',
  signedIn: true,
  waiter: { id: 'w1', name: 'Waiter', role: 'waiter', active: true },
};
function queries(h) {
  return [
    h.tables.useServiceTables(),
    h.menu.useWaiterMenu(),
    h.menu.useMenuItem('dish'),
    h.orders.useSessionOrders(['session']),
    h.orders.useOrderDetail({ orderId: 'order', tableSessionId: 'session' }),
    h.reservations.useReservations('Pending'),
    h.reservations.useReservation('booking'),
    h.reservations.useReservationAvailability({ restaurantId: 'r' }),
    h.collection.useCollectionQuery('test', async () => []),
    h.notifications.useNotifications(),
    h.notifications.useUnreadNotifications(),
    h.notifications.useNotificationDetails('notification'),
  ];
}
test('all waiter API queries are disabled in demo, signed-out and inactive sessions', () => {
  for (const state of [
    { ...account, authMode: 'demo' },
    { ...account, signedIn: false },
    { ...account, waiter: null },
    { ...account, waiter: { ...account.waiter, active: false } },
  ]) {
    const options = queries(harness(state));
    assert.ok(options.every((query) => query.enabled === false));
  }
});
test('valid API waiter can query and explicit screen constraints still apply', () => {
  const h = harness(account);
  assert.ok(queries(h).every((query) => query.enabled === true));
  for (const query of [
    h.tables.useServiceTables(false),
    h.orders.useSessionOrders([]),
    h.menu.useMenuItem(null),
    h.collection.useCollectionQuery('x', async () => [], false),
  ])
    assert.equal(query.enabled, false);
});
test('payment requests have one FIFO ordering across restaurants and duplicate table rows', async () => {
  const h = harness(account, [
    { restaurantId: 'late' },
    { restaurantId: 'early' },
    { restaurantId: 'early' },
  ]);
  const query = h.collection.usePaymentRequests();
  const rows = await query.queryFn({ signal: new AbortController().signal });
  assert.deepEqual(
    rows.map((row) => row.serviceRequestId),
    ['early', 'late'],
  );
});
