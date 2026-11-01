# Restaurant frontend (Expo)

The current project directory is the frontend root. This app keeps Expo / React
Native for Android, iOS, and web, while following the restaurant feature structure.

## Run

Staff sign-in is shared by Waiter and Inventory under `src/features/auth`.
The app uses real backend login, token refresh and logout. Active Waiter accounts
open `/waiter/tables`; Inventory accounts open `/inventory`. Native sessions use
SecureStore; web preview keeps credentials in memory and requires sign-in after reload.
There is no demo button on the shared sign-in screen.
See [Authentication setup](src/features/auth/README.md) for configuration.
See [Waiter API integration](src/features/waiter/shared/api/README.md) for supported flows and checks.

UC_WAI_03 is available through **Đơn khách chờ xác nhận** on the table map.
Review each QR order round and confirm it before it enters kitchen items and
billable totals in local demo state. See [Order confirmation](src/features/waiter/ordering/README.md).

```sh
npm install
npm run start
npm run web
```

Set EXPO_PUBLIC_API_URL in .env.local before calling a backend. Public environment
variables are bundled into the client; do not put secrets in them.

## Structure

```text
public/
src/
  app/
    store.ts
    hooks.ts
    queryClient.ts
    providers/
    navigation/
  api/
    axiosClient.ts
    config.ts
  assets/
    images/
    icons/
    logos/
    fonts/
  components/
    Button/
    Modal/
    Table/
    Loading/
    EmptyState/
    ConfirmDialog/
    ...existing shared components
  features/
    auth/
    customer/
      menu/            # pages, components, api, hooks, types.ts
      cart/            # pages, components, cartSlice.ts
      checkout/
      payment/
      order-tracking/
      rating/
    admin/
      dashboard/
      branches/
      dining-areas/
      tables/
      users/
      roles/
      permissions/
      settings/
      audit-log/
    manager/
      dashboard/
      menu-management/
      categories/
      dishes/
      recipes/
      promotions/
      suppliers/
      purchase-requests/
      reports/
      analytics/
    inventory/
      ingredients/
      stock/
      stock-in/
      stock-out/
      expiration/
      suppliers/
      purchase-orders/
      reports/
    kitchen/
      order-queue/
      cooking/
      ready-orders/
      unavailable-dishes/
      notifications/
    ai/
      assistant/
      demand-forecast/
      purchase-recommendation/
      menu-recommendation/
      analytics/
    home/              # Existing starter feature
    explore/           # Existing starter feature
  layouts/
    CustomerLayout.tsx
    AdminLayout.tsx
    ManagerLayout.tsx
    InventoryLayout.tsx
    KitchenLayout.tsx
  routes/
    router.tsx
    ProtectedRoute.tsx
    RoleRoute.tsx
    expo/              # Only files here become Expo routes
  hooks/
  types/
  utils/
  constants/
  styles/
  App.tsx
  main.tsx
.env
app.json
package.json
tsconfig.json
```

## Conventions

The @/ alias resolves to src/. Reusable UI belongs in components; domain-specific
UI, API calls, hooks, types, and state belong inside their feature module.
The previous shared directory has been replaced by these top-level folders.

Redux Toolkit provides the app store and typed hooks. Register feature reducers
in app/store.ts as they are implemented. TanStack Query is provided by
AppProviders, with a QueryClient per provider instance. Axios configuration lives
in api; endpoint paths are intentionally empty until the backend contract exists.

Business folders use .gitkeep; the named customer menu/cart modules are explicit
code placeholders. Role layouts are composition shells. ProtectedRoute and
RoleRoute accept authentication/role state from their caller and render a fallback
when access is denied; they are not connected to an authentication backend yet.
Server APIs must enforce authorization independently.

The root layout uses a Stack navigator. `/` redirects to `/waiter/tables`, whose
parent layout redirects signed-out users to `/login`. Explore and the starter tab
components remain available in the source. Add feature routes under routes/expo;
waiter routes reuse the authentication guard in waiter/_layout.tsx.

This is an Expo adaptation of the Vite example: main.tsx loads Expo Router,
App.tsx composes providers and navigation, and app.json configures the route root.
There is no vite.config.ts because Vite is not used. The repository is not moved
into another restaurant/frontend directory.

## Validation

```sh
npx tsc --noEmit
npx expo export --platform web
```

npm run reset-project archives or deletes app code and creates blank routes in
src/routes/expo. Assets, styles, and the Expo entry file are preserved.
