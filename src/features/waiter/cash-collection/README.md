# Waiter cash collection

`api`, `components`, `hooks`, `store`, `types`, `utils`, and `screens` own this flow.
API login uses the existing Requests tab and payment route; demo screens remain available.

1. Read all pages of payment requests for restaurants visible in service tables.
2. Acknowledge the request and submit to the receiving cashier.
3. Poll for the bill prepared by cashier. Waiter never calls cashier-only prepare.
4. Display server totals including VAT/service fees, then confirm presentation to guest.
5. Review full cash received and change; create cash handover using a UUID key.
6. Poll the saved handover until cashier confirms. Hand over all cash received;
   cashier supplies change for the waiter to return to guest.

Reads refresh every five seconds. Writes never automatically retry. Cash payload/key
are saved before the request (SecureStore on native; localStorage on web), scoped by
account and payment request, so reopening restores the same submission. Never edit
an uncertain submission or collect twice; retry the stored payload. Redux clears on
account changes; recovery records remain scoped to the original account on device.
Storage failure prevents sending a new collection. Backend remains authoritative.

`GET /payment-requests/{id}` is guest-cookie-only, so staff locate requests through
the restaurant list. Completed requests leave that list; saved handover IDs still
allow polling. A different device cannot recover a handover ID through the current
waiter APIs; check with cashier before collecting again.

Checks: `node --test scripts/cash-collection.test.mjs`, `npm run typecheck`,
`npx expo export --platform web`.
