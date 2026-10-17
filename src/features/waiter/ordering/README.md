# UC_WAI_03 — Xác nhận đơn trước khi chuyển bếp

New UI in the existing `ordering/screens` structure, built from the old-mobile shared components and theme. This use case has no existing screen in old-mobile; its OrderScreen belongs to UC_WAI_06 and is not copied here.

Open **Đơn khách chờ xác nhận** on the table map, or `/waiter/orders`. The original five-tab layout and authentication guard remain in use.

- Pending/confirmed lists, search by table/order ID, per-round quantities, prices and kitchen/customer notes.
- Review sheet with an explicit checklist and confirmation button, disabled for inactive/closed/settling sessions and unavailable dishes.
- Separate sample customer orders are excluded from kitchen items and billable totals until confirmed.
- Confirmation checks the reviewed version, records demo waiter/time, creates Pending kitchen items and includes that round in the total. Other rounds remain pending; repeated confirmations are rejected.
- Confirmed history is read-only. Empty, search-empty and validation feedback use existing shared UI.

Demo only: QR submission, actual kitchen/cashier delivery and server-side concurrency/authentication are not integrated. Confirmation runs synchronously in local Redux and resets on reload. The waiter identity is the existing demo account, not an authenticated server identity.

Checks: `npm run typecheck`, `npm run test:auth`, `npm run test:ordering`, `npx expo export --platform web`.

Manual review: enter demo → table map → Đơn khách chờ xác nhận; search Bàn 03 or QR-001; open the review sheet; inspect quantities and notes; tick the checklist and confirm. QR-001 should move to Đã xác nhận while QR-003 for the same table stays pending. Open confirmed history to inspect the staff/time. Cancel a review without confirming to leave its order unchanged. Browser/device interaction has not been automated in this branch.
