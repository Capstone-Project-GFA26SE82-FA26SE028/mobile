# Waiter reservations

Backend login opens `LiveReservationsScreen`; demo state keeps the existing screen.
The UI uses the existing NativeWind components and preserves the customer cards,
status tabs, name/phone search and review sheet.

- `api/`: authenticated gateway binding and injectable HTTP service.
- `hooks/`: account-scoped TanStack Query lists, details, availability and mutations.
- `types/`: gateway reservation and availability contracts.
- `utils/`: status labels, strict local date/time parsing and check-in window checks.
- `components/`: detail and action review sheet.

Supported endpoints:

- GET `/api/reservations`: all pages for the selected backend status.
- GET `/api/reservations/{id}`: fresh detail before actions.
- GET `/api/reservations/availability`: restaurant, requested area, party size and ISO start time.
- POST `/api/reservations/{id}/confirm`: distinct selected `tableIds`; supports multiple tables.
- POST `/api/reservations/{id}/reject`, `/check-in`, `/cancel`: no body fields.
- PUT `/api/reservations/{id}`: `startAt` and `tableIds`.

Lists, open details and availability refresh every 5 seconds. The backend scopes
access to the employee's assigned restaurants. Every mutation invalidates the
waiter query scope on success or error because conflicts may persist Expired or
NoShow. Writes are never automatically retried. A submission guard blocks repeated
taps and prevents closing the sheet during submission. Errors remain visible.

Check-in uses Confirmed and the server's `holdUntil`, and opens 30 minutes before
`startAt`, matching current backend configuration. Check-in records arrival only;
it does not open a table session. The CheckedIn tab links to assigned tables so
staff can open/reuse a session through the existing table screen.

Schedule edits use device-local DD/MM/YYYY and HH:mm converted to ISO UTC. Invalid
dates cannot silently roll over. Availability is a preview, not a hold. Its query
does not accept a reservation ID, so an existing assigned table can conflict with
itself in the preview. Existing allocations remain selectable when editing; the
server excludes the current reservation and validates final conflicts atomically.
Server deadlines, opening hours, capacity, restaurant/area and authorization remain
authoritative. No unsupported rejection reason or customer notification is sent.

Checks: `npm run typecheck`, `npm run test:reservations`, `npm run test:waiter-styles`.
Contract tests use an injected transport. They do not create or modify live bookings.
