# Security Policy

## Private Beta

This application is currently intended for a small group of explicitly allowlisted testers. Do not publish database credentials, environment files, session tokens, exported user data, or administrator access details.

## Reporting a Vulnerability

Do not place security vulnerabilities or personal data in a public GitHub issue. During the private beta, contact the repository owner directly with:

- The affected page or feature
- A concise description of the behavior
- Reproduction steps that do not include passwords or private health data
- The approximate time of the event

Rotate any credential immediately if it may have been exposed.

## Operational Rules

- Keep `ADMIN_EMAILS` limited to trusted administrators.
- Give every tester an individual Supabase Auth account.
- Review dependency alerts and production logs regularly.
- Validate the target database before schema operations.
- Test authorization boundaries before expanding the beta.
- Back up production data before migrations once encrypted backup infrastructure is available.
- Process deletion requests deliberately and verify the requester before removing data.

## Supported Version

Only the current production deployment from the `main` branch is supported.
