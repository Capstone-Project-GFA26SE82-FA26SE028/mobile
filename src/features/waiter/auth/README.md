# Waiter authentication (UC_WAI_01)

Login calls POST /api/auth/login with { email, password }. Only an active account
with roleId exactly waiter can enter. Account displays the server profile.
Sessions created for rejected roles are revoked on a best-effort basis.

Access and refresh tokens stay in memory, never Redux or localStorage. Restarting
or reloading requires login again. The shared Axios client attaches the token,
refreshes before expiry, and retries authenticated requests once after a 401.
Concurrent requests share one refresh because backend rotates refresh tokens.
Refresh failure clears authentication and protected routes return to login.

Logout calls POST /api/auth/logout and always clears local credentials. Network
failure means server revocation cannot be confirmed; server expiry still applies.
Requests time out after 15 seconds. Single-device policy is enforced by Identity.

Demo entry remains available as a separate mode. Real login clears demo business
data and uses live table/menu/order screens. Query caches are cleared on account
changes or session expiry. Unsupported backend operations have no local success fallback.
See [Waiter API integration](../api/README.md) for available operations.

## Connection

Create mobile/.env.local (ignored by Git), choosing the correct address:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Web on the backend computer: localhost. Android emulator: http://10.0.2.2:5000.
Physical phone on the same LAN: http://<computer-LAN-IP>:5000. Find the computer's
IPv4 address using ipconfig. The phone's localhost refers to the phone.

Gateway binds to loopback by default. For a physical phone, from backend in
PowerShell, expose only Gateway for local development:

```powershell
$env:GATEWAY_BIND_ADDRESS = '0.0.0.0'
docker compose up -d gateway
```

Allow inbound TCP 5000 on the private network if Windows Firewall blocks it.
SQL Server stays internal. To restore the loopback binding:

```powershell
Remove-Item Env:GATEWAY_BIND_ADDRESS
docker compose up -d gateway
```

Restart Expo after URL changes: npx expo start --clear.
Docker demo account: waiter@gmail.com / 123.

## Verification

npm run typecheck; npm run test:auth; npx expo export --platform web.
Tests cover login contract/profile, role/activity rejection, concurrent refresh,
refresh failure, logout failure and stale refresh after clearing a session.
Manual smoke test with running backend: login, inspect Account, logout, try wrong
credentials and a Manager account. No live backend smoke test is implied by unit tests.
