# Functional Development Checklist

This roadmap prioritizes reliable behavior, data safety, and testability. Visual redesign is intentionally deferred.

## 2. Complete workout tracking

### Strong CSV import

- [x] Accept valid Strong CSV files with quoted fields, commas, CRLF/LF line endings, optional columns, and Unicode exercise names.
- [x] Reject non-CSV, malformed headers, invalid dates, empty exports, oversized files, negative set values, and unreasonable row counts with user-safe messages.
- [x] Normalize workout names, timestamps, exercise names, set order/type, duration, repetitions, weight, distance, seconds, RPE, and notes.
- [x] Scope every imported workout to the authenticated profile.
- [x] Give each Strong workout a stable identity based on normalized source data.
- [x] Match older imports by profile, source, date, and workout name before creating a new record.
- [x] Create new workouts, update changed workouts, and skip byte-for-byte-equivalent normalized workouts.
- [x] Replace the exercises of an updated workout atomically so a failure cannot leave half a workout.
- [x] Continue safely when one workout group is invalid and report that group as failed.
- [x] Return and display counts for added, updated, skipped, failed, valid rows, and total workout groups.
- [x] Prevent double-clicked or repeated imports from creating duplicate workouts.
- [x] Add automated parser, normalization, duplicate-planning, summary, and failure tests.

### Workout progress and history

- [x] Keep one continuous, readable progress line with an area fill to the x-axis.
- [x] Color rising, flat, and falling chart segments consistently and include a visible legend.
- [x] Ensure chart axes, tooltips, empty states, keyboard access, and mobile sizing remain understandable.
- [x] Filter workout history by exercise name, workout name, source, date range, and personal records.
- [x] Detect personal records for top weight, estimated 1RM, reps, and exercise volume.
- [x] Mark records without presenting estimated 1RM as a medical or guaranteed performance result.
- [x] Test volume, estimated 1RM, progression series, comparisons, and personal-record detection.

## 3. Improve dashboard usefulness

- [x] Define the dashboard as a daily action surface rather than a duplicate reporting page.
- [x] Keep only today’s priorities, habit status, nutrition status, workout status, and a concise explanation of their relationship to goals.
- [x] Remove cards whose information is already clearer on Habits, Meals, Workout, Settings, or Self-improvement.
- [x] Make every status state explicit: complete, in progress, not started, needs attention, or unavailable.
- [x] Link each summary to its relevant detailed page.
- [x] Add useful loading skeletons that preserve layout.
- [x] Add actionable empty states for new accounts.
- [x] Add offline messaging and per-section retry behavior.
- [x] Test calculations, account scoping, empty data, partial data, and failed data requests.

## 4. Finish Self-improvement

- [x] Allow each goal to define a measurable target, unit, baseline, target date, and current value.
- [x] Connect goals to existing habits and reusable routines owned by the same profile.
- [x] Calculate progress from linked habit completion or manually entered measurements without double counting.
- [x] Show whether progress is on track, behind, completed, or missing data.
- [x] Preserve historical progress so edits do not rewrite past results.
- [x] Improve weekly reviews with the reviewed date range, wins, difficulties, evidence, next adjustment, and priorities.
- [x] Carry review adjustments into the next week without silently modifying goals.
- [x] Add clear wellness-information disclaimers near recommendations.
- [x] Label estimates and heuristics as estimates; never describe them as diagnoses, treatment, or medical conclusions.
- [x] Add crisis/urgent-care language only where the feature genuinely warrants it.
- [x] Test ownership, progress calculations, goal-habit links, weekly boundaries, and safety-language presence.

## 5. Improve settings and account management

- [x] Separate profile display data from verified authentication data.
- [x] Require confirmation through Supabase for email changes before treating the new email as verified.
- [x] Validate and normalize phone numbers; do not imply verification until an OTP flow succeeds.
- [x] Require a recent authenticated session for password changes and expose password requirements clearly.
- [x] Ensure account changes cannot bypass the private-test allowlist and cannot lock the user out unexpectedly.
- [x] Autosave body metrics and nutrition settings with debounce, visible saving/saved/error states, and conflict protection.
- [x] Prompt on navigation only while changes are genuinely pending or failed.
- [x] Provide “stay on page” and “save and continue” choices.
- [x] Clearly distinguish calculated recommended targets from user-overridden custom targets.
- [x] Allow restoring individual or all targets to current recommendations.
- [x] Test data-export ZIP contents, content types, ownership, escaping, and absence of secrets.
- [x] Test deletion request creation, duplicate prevention, cancellation, admin approval, and audit status end to end.

## 6. Expand automated testing

- [x] Test meal creation, validation, editing, deletion, duplication, templates, history reuse, quantities, and idempotency.
- [x] Test Strong parsing, import planning, repeated imports, changed files, partial failures, and ownership.
- [x] Test nutrition recommendations, custom overrides, autosave persistence, and stale-update conflicts.
- [x] Test habit creation, daily completion, streak/history boundaries, editing, deletion, and ownership.
- [x] Test expired/missing sessions, protected redirects, refresh behavior, and logout cookie removal.
- [x] Test admin allowlists and prevent normal users from reading or mutating admin resources.
- [x] Test export file names, formats, record ownership, and sensitive-field exclusions.
- [x] Test validation, database, upstream-service, rate-limit, offline, and unknown error mappings.
- [x] Run unit and static-security tests on every PR; reserve database integration tests for an isolated schema so production records are never touched.

## 7. Add offline and mobile resilience

- [x] Detect browser online/offline transitions and expose a non-blocking global status.
- [x] Preserve drafts locally for meals, workouts, settings, and bug reports without caching authenticated API responses.
- [x] Restore drafts in the signed-in browser and clear them after confirmed persistence or logout.
- [x] Disable primary submission controls while requests are processing and prevent duplicate taps.
- [x] Retry only user-requested safe reads; do not silently retry writes.
- [x] Explain camera support, HTTPS requirements, permission states, and iOS/Android browser settings.
- [x] Always retain manual barcode entry as a fallback.
- [x] Add a web manifest, suitable icon, standalone display behavior, theme colors, and install guidance.
- [x] Keep authenticated health data out of service-worker caches.
- [x] Test offline drafts, reconnect behavior, duplicate taps, unsupported cameras, denied permissions, and installed mode.

## 9. Prepare eventual wider use

- [x] Publish versioned privacy and terms pages that accurately describe collected data, processors, retention, exports, deletion, limitations, and contact routes.
- [x] Record explicit versioned acceptance, ready to become mandatory when wider-user onboarding is enabled.
- [x] Implement allowlisted password reset, email verification, expiry-safe recovery, and redirect handling; production mail delivery configuration remains an operator check before public signup.
- [x] Apply account-aware limits to authentication-sensitive and expensive endpoints using the shared PostgreSQL database.
- [x] Complete an authorization matrix for every page, server action, API method, database query, export, and admin operation.
- [x] Improve keyboard navigation, focus visibility, semantics, reduced motion, error announcements, charts, and mobile zoom safeguards.
- [x] Add privacy-conscious sampled performance and error monitoring with bounded payloads and environment separation.
- [x] Add automated ownership-contract tests; a real two-user database test remains a release gate until an isolated test schema exists.
- [x] Add a repeatable dependency, secret, headers, cookies, caching, file-upload, CSRF, XSS, injection, and abuse release review.
