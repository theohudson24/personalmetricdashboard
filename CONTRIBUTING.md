# Contributing

Personal Metric Dashboard is currently a private beta. Contributions should be small, reviewable, and safe for existing user data.

## Workflow

1. Update local `main`.
2. Create a focused branch using `feature/`, `fix/`, `chore/`, or `docs/`.
3. Keep credentials, exported user data, and private health information out of commits.
4. Run:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. Open a pull request and verify its Vercel Preview.
6. Squash-merge only after required checks pass.

## Development Standards

- Use strict TypeScript and validate untrusted input.
- Scope every private data query to the authenticated profile.
- Require administrator authorization for administrative actions.
- Preserve backward compatibility or document migrations explicitly.
- Add or update tests for security boundaries and domain logic.
- Avoid destructive production-data operations in ordinary feature code.

## Reporting Problems

Use the in-application bug reporter for tester feedback. Follow [SECURITY.md](SECURITY.md) for vulnerabilities or suspected data exposure.
