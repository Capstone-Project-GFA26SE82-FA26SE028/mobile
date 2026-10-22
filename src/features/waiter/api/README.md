# Waiter API integration

## File organization

- `api/`: transport binding (`waiterApi.ts`), HTTP service and API response/request types.
- `tables/screens/`: table list/detail UI; `tables/hooks/`: table queries and session opening.
- `ordering/screens/`: ordering and confirmation UI; `ordering/hooks/`: menu/order queries and mutations.
- `ordering/components/OrderCard.tsx`: order display shared by ordering and table detail.
- `serving/screens/LiveReadyScreen.tsx`: ready items, also used by the notification route.
- `shared/components/`: reusable loading/error and unavailable UI.
- `shared/hooks/useWaiterScope.ts`: account query scope and cross-feature invalidation.

Screens consume feature hooks; hooks call the HTTP service. The API layer does
not import screens, React components or TanStack Query hooks.

Backend sign-in selects these live screens through the existing route screens.
Demo entry selects the original screens. API data stays in TanStack Query, scoped
by account; Redux holds the existing authentication/profile and demo state.

Supported operations:

- GET /api/tables/service: all pages, area/status/search filters, refresh every 5 seconds.
- POST /api/table-sessions/tables/{tableId}/open: open or reuse a table session.
- GET /api/menu and /api/menu/{id}: live names, prices, availability, images and option groups.
- GET /api/table-sessions/{sessionId}/orders: paginate orders for open sessions.
- POST /api/table-sessions/{sessionId}/orders: staff order with notes, quantities,
  options and Idempotency-Key. Staff orders go directly to Confirmed.
- POST /api/table-sessions/{sessionId}/orders/{id}/confirm: reviewed server rowversion.
  Detail is fetched again on review; server conflicts refresh the order lists.
- Ready/notification screens read Ready order lines, without simulating serving or push delivery.

The menu supports selecting each option once per dish; quantities of the dish can
be changed separately. Required group limits are checked before adding to the cart.
Backend remains authoritative for prices, availability, session access and kitchen routing.

Waiter ordering has a dedicated cart route `/waiter/cart/{tableId}?sessionId=...`
and a fixed cart button on the menu. Redux keeps separate carts per table/session
while navigating in the app. The cart supports quantities, kitchen notes, removal,
clearing, subtotal and continuing to select dishes. It is cleared on successful
submission, logout, account changes and switching to demo. Reloading the app resets
these in-memory drafts. This uses the staff order endpoint, not the guest cart API.

After submission starts, the cart is frozen and retries reuse the same payload
and key, including after leaving/reopening the cart. Definitive validation rejections
unlock editing; ambiguous network failures retain the key. Check existing table
orders when the result is uncertain. Backend Idempotency-Key prevents duplicating
that same submission.

No API is currently exposed for serving, cancellation/editing of submitted items,
moving guests, cash handover, service requests or reservations. Those controls are
unavailable after backend login. Displayed order totals are not final payment totals.
Table service responses do not include capacity, guest count, session start time,
coordinates or all four Excel table states; these values are not fabricated.

Use EXPO_PUBLIC_API_URL for the gateway origin (without a trailing /api).
Android emulator: http://10.0.2.2:5000; web: http://localhost:5000.
Restart Expo after changing the environment. See the authentication README for LAN access.

Checks: npm run typecheck; npm run test:waiter-api; npm run test:auth;
npm run test:ordering; npm run test:notifications; npm run test:waiter-ui;
npx expo export --platform web.

Live Docker smoke check verified login, GET service tables (3 rows), GET menu
(2 rows), and logout. No live order/session creation or confirmation was performed;
their request contracts and retry headers are covered by service tests.
