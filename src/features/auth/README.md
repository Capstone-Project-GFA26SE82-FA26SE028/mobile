# Authentication (UC_WAI_01)

Migrated from `old-mobile`, with authentication state separated from waiter business data.

- `/login`: account/password input validation and explicit demo entry; entering credentials does not authenticate a real account.
- `/waiter/account`: demo staff information and logout confirmation.
- All `/waiter/*` routes require an active demo session. Signing out removes access; reloading starts signed out.
- Redux `auth` owns session state. Other waiter features can reuse this guard without importing tables, orders, or seed data.

Backend integration remains pending: API endpoints, JWT handling, active-account and role checks, server logout/revocation, and enforcing one device per account. The demo does not implement these security requirements.

The account screen temporarily serves as the landing page until the table feature is migrated. Shared UI/theme were taken from the old waiter login; additional business features are outside this branch.

Validation: `npm run typecheck`, `npm run test:auth`, and `npx expo export --platform web`.
Manual flow: open `/waiter/account` while signed out → login; check empty-input validation; enter demo → account; cancel logout → remain on account; confirm logout → login; reload or revisit a protected route → login.
