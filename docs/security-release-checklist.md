# Security release checklist

- [ ] Dependency audit has no unresolved high/critical production vulnerability.
- [ ] Secret scan finds no credentials, `.env`, exports, database URLs, or personal CSV data in Git.
- [ ] Authentication cookies remain secure, HTTP-only, and Supabase-managed.
- [ ] Private pages, API routes, server actions, exports, and admin operations match the authorization matrix.
- [ ] Every user-record read/update/delete includes the authenticated `profileId`.
- [ ] File uploads enforce type, size, row, and content validation.
- [ ] Inputs are schema validated; React escaping is retained; no unsafe HTML is introduced.
- [ ] Security headers, private caching, rate limits, and generic auth responses are verified in production.
- [ ] Error/performance monitoring contains no form values, stack traces, tokens, or health-record payloads.
- [ ] Two-user isolation is tested against an isolated database before registration opens.
