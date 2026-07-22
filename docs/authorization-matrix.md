# Authorization matrix

All private pages are protected by middleware and resolve the current Supabase user on the server. Every user-owned database query must include the authenticated profile ID; an opaque record ID alone is never authorization.

| Surface | Required identity | Ownership/control |
| --- | --- | --- |
| Dashboard, Habits, Gym, Meals, Self-improvement, Settings | Approved authenticated user | `getDefaultProfile()` and `profileId` |
| Food search | Approved authenticated user | User-ID rate limit; no private upstream payload |
| Barcode lookup and saved foods | Approved authenticated user | `profileId` for personal corrections |
| Account export | Approved authenticated user | Every exported collection filters `profileId`; private/no-store ZIP |
| Bug reports and error/performance telemetry | Approved authenticated user | Created and read by `profileId`; metadata is bounded and redacted |
| Account deletion request | Approved authenticated user | Creation/cancellation filters `profileId` |
| Admin dashboard and mutations | Email in `ADMIN_EMAILS` | `requireAdmin()` before any database read/write |
| Login and recovery | Email in `TEST_USER_EMAILS` | Generic recovery response; Supabase time-limited link; rate limit |
| Privacy and terms | Public | Static, versioned content; no user data |

Review this matrix whenever a route, action, model, or data processor is added.
