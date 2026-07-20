# Personal Metric Dashboard

A private, account-based dashboard for habits, training, nutrition, and self-improvement. The application is built for a small allowlisted beta and stores each tester's records under their authenticated Supabase profile.

- **Status:** Private beta
- **Production:** [personalmetricdashboard.vercel.app](https://personalmetricdashboard.vercel.app)
- **Owner:** [Theo Hudson](https://github.com/theohudson24)

## Capabilities

- Daily dashboard, tasks, health markers, and progress summaries
- Cross-device habit tracking and completion history
- Workout logging, templates, progress insights, and Strong CSV import
- Meal, snack, drink, and individual-item logging
- USDA FoodData Central search and UPC/EAN barcode lookup
- Saved meals, recent-food history, and editable nutrition targets
- Self-improvement goals, routines, checklists, and weekly reviews
- Light and dark themes, profile settings, and account controls
- Bug reports, privacy-filtered error monitoring, and a private admin console
- User data export as ZIP with JSON and CSV files
- Administrator-reviewed account deletion requests

## Technology

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Prisma ORM with Supabase PostgreSQL
- Supabase Auth with server-side sessions
- Vercel deployments from GitHub
- Zod validation, ZXing barcode scanning, and Node's test runner through `tsx`

## Local Development

Requirements:

- Node.js 20 or newer
- npm
- Access to the project's Supabase development configuration

Install and configure:

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

Never commit `.env`, database credentials, exported workout files, or real user data. The committed `.env.example` contains placeholders only.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Pooled PostgreSQL connection used by the application |
| `SUPABASE_DIRECT_URL` | Direct PostgreSQL connection used for schema operations |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser-safe Supabase key |
| `FDC_API_KEY` | USDA FoodData Central API key |
| `TEST_USER_EMAILS` | Comma-separated private-beta allowlist |
| `ADMIN_EMAILS` | Comma-separated administrator allowlist |

The Supabase service-role key is not used by this application and must never be exposed to the browser.

## Commands

```bash
npm run dev          # Start the development server
npm run build        # Generate Prisma Client and build for production
npm run start        # Start a completed production build
npm run lint         # Run ESLint
npm test             # Run automated tests
npm run db:push      # Apply the Prisma schema to the configured database
npm run db:verify    # Verify connectivity and count core records
npm run prisma:studio
```

`db:push` changes the configured database. Confirm the target connection before running it.

## Repository Structure

```text
app/                    Next.js pages, API routes, and server actions
components/             Feature and shared UI components
lib/                    Authentication, domain logic, integrations, and utilities
prisma/schema.prisma    PostgreSQL data model
public/                 Static application assets
tests/                  Automated security and domain tests
types/                  Shared TypeScript types
```

The Self-improvement feature is organized consistently under `/self-improvement`. Prisma maps its code-facing model names to the existing production tables so the terminology is current without rewriting stored user data.

## Security Model

- Supabase Auth establishes the current user on the server.
- Private pages and APIs require authentication.
- Queries resolve and constrain records through the authenticated profile.
- Private beta and administrator access use separate email allowlists.
- Inputs are validated before database writes.
- Environment files and personal imports are ignored by Git.
- Error monitoring intentionally excludes form values, health details, passwords, and stack traces.
- Account deletion is reviewed manually; approval alone does not destroy data.

See [SECURITY.md](SECURITY.md) for reporting and operational guidance.

Repository contributions follow [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Published changes are summarized in [CHANGELOG.md](CHANGELOG.md), and private-beta help is described in [SUPPORT.md](SUPPORT.md).

This repository is publicly viewable but proprietary. See [LICENSE](LICENSE) for usage restrictions.

## Development Workflow

1. Branch from an up-to-date `main`.
2. Make one focused change.
3. Run `npm test`, `npm run lint`, and `npm run build`.
4. Push the branch and verify its Vercel Preview.
5. Squash-merge the pull request after review.
6. Confirm the production deployment and core authenticated flows.

Production deploys automatically from `main`. Feature branches create preview deployments.

## Health Information

Nutrition and self-improvement outputs are estimates and general recommendations. They are not medical advice and should not replace guidance from a qualified healthcare professional.
