# Waiter notifications

Recipient-scoped backend APIs use Bearer authentication:

| Method | API | Result |
| --- | --- | --- |
| GET | `/api/notifications` | Paged list; filters type, isRead, entityId, from, to |
| GET | `/api/notifications/unread-count` | `{ count }` |
| GET | `/api/notifications/{id}` | `{ notification, recipients }` |
| PATCH | `/api/notifications/{id}/read` | Mark one read; null result |
| PATCH | `/api/notifications/read-all` | Mark all read; null result |

Waiter catalog includes DineInOrderSubmitted, DineInItemReady,
ItemCancellationRequested, CheckoutRequested, TakeawayAwaitingAcceptance,
TakeawayReady and staff announcements targeted to waiter. Backend determines recipients.

`api` owns HTTP/envelopes, `hooks` owns queries/mutations and bell players,
`components` owns cards, sound controls, banner and one layout listener,
`screens` owns the live inbox, `store` tracks sound settings/known IDs,
`types` contains backend contracts, `assets` contains an original synthesized bell.

Reads refresh every five seconds while the app is active. All pages are loaded,
deduplicated and sorted newest first. The first successful fetch sets a silent baseline.
New unread IDs ring once per received batch. Polling, marking read and screen
navigation do not replay the bell. Account changes/sign-out reset tracking.
Writes never automatically retry.

Sound is foreground-only, enabled by default, with mute and test controls in the
inbox and account screen. The web test button directly plays the shared audio element
inside a user gesture for browser autoplay restrictions. Playback errors are visible.
Native uses Expo Audio without microphone/background playback permissions.
Custom development clients may need rebuilding to include the new native module.
No operating-system push delivery is implemented by these endpoints.

The bell is a 1.25-second locally generated PCM WAV with no remote media dependency.
Demo notifications retain their existing behavior. Real phone audibility and backend
event delivery require a live smoke test.
