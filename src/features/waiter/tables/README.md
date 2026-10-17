# UC_WAI_02 — Xem sơ đồ bàn

`screens/TablesScreen.tsx` and `src/routes/expo/waiter/tables.tsx` are unchanged copies from `old-mobile`.

Includes the original table cards, summary counts, area/status filters, table-name search, status colors, capacity, guest count and elapsed session time. Shared Redux data, UI, rules and the 5-second `useNow` timer already exist from the Authentication migration.

This is the original demo: the timer refreshes time-derived display and reservation holds, but does not fetch live table data from a backend. Server synchronization required by Excel remains pending.

Table detail is a temporary route placeholder so selecting a table does not open a missing route. Opening sessions, moving tables, ordering, cancellation and payments are not migrated in UC_WAI_02. The original `TableDetailScreen.tsx` will be copied with the relevant business features.

Validation: `npm run typecheck` and `npx expo export --platform web`.
