# Authentication (UC_WAI_01)

Copied from `old-mobile` using its original waiter folder structure and shared Redux state.

- `/login`: account/password input validation and explicit demo entry; entering credentials does not authenticate a real account.
- `/waiter/account`: demo staff information and logout confirmation.
- All `/waiter/*` routes require an active demo session. Signing out removes access; reloading starts signed out.
- Redux `waiter` owns session state, exactly as in the original. Logout clears signedIn, alerts and feedback while preserving demo business data.

Backend integration remains pending: API endpoints, JWT handling, active-account and role checks, server logout/revocation, and enforcing one device per account. The demo does not implement these security requirements.

LoginScreen, AccountScreen, WaiterLayout, App, route entry files, store and waiter/shared are unchanged copies of the originals. Shared types, rules, seed data, menu and its images are included because the original screens/layout/slice import them. No table, ordering, serving, requests, reservations or payment feature screens are included.

Login redirects to `/waiter/tables`, as in the original. The original five-tab layout is preserved. Tables is migrated in UC_WAI_02. Ready, Requests and Reservations have temporary route placeholders until their respective feature branches replace them; use the Cá nhân tab to inspect the original account screen and sign out.

Validation: `npm run typecheck`, `npm run test:auth`, and `npx expo export --platform web`.
Manual flow: open `/waiter/account` while signed out → login; check empty-input validation; enter demo → tables; open Cá nhân → original account screen; cancel logout → remain on account; confirm logout → login; reload or revisit a protected route → login.
