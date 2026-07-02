# Personal Metric Dashboard

A clean, local-first health and gym progress tracker built with Next.js, React, TypeScript, Tailwind CSS, Prisma, and SQLite.

The app is designed as a minimal personal command center for daily health habits, lifting progress, meals, macros, micronutrients, and future device integrations. It uses a restrained black, white, and gray interface intended to look calm on a desktop while remaining usable on mobile.

## Features

- Responsive desktop and mobile layout
- Home dashboard with daily summary, to-dos, health markers, and progress preview
- Daily habit checklist with add, delete, complete, and reset actions
- Health marker logging by date
- Workout logger with exercises, sets, reps, weight, and notes
- Workout history with detail expansion and total volume
- Exercise progress cards with best weight, best reps, estimated one-rep max, and volume
- Strong CSV workout import into the local database
- Profile-linked workout storage for imported and manually logged sessions
- Exercise catalog for faster workout selection
- Personal workout templates created from your own logged workouts
- Body measurement tracking with a placeholder for future progress photos
- Meal logger with food items, calories, macros, and micronutrients
- USDA FoodData Central food search for auto-filling nutrition by weighed grams
- Macro summary with neutral progress bars
- Nutrition goal editing from Meals and Settings
- Height/weight-based nutrition goal estimates with optional custom overrides
- Rule-based training and nutrition insights
- Local SQLite persistence through Prisma
- API route scaffolding for future integrations

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Initialize the local SQLite database:

```bash
npm run db:init
```

Seed default settings and today's checklist:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev
```

Runs the local development server.

```bash
npm run build
```

Generates Prisma Client and creates a production Next.js build.

```bash
npm run start
```

Starts the production server after a build.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run db:init
```

Creates the local SQLite tables used by the app.

```bash
npm run db:seed
```

Creates default nutrition settings and today's default checklist.

```bash
npm run import:strong
```

Imports `imports/strong_workouts.csv` into the local database, attaches workouts to the default profile, preserves Strong workout variables, and adds imported exercises to the exercise catalog.

```bash
npm run profile:normalize
```

Ensures local data is attached to one default profile and removes duplicate local profile/settings rows if setup scripts are run more than once.

```bash
npm run db:push
```

Runs Prisma `db push`. If Prisma's schema engine fails on your machine, use `npm run db:init`, which initializes the same MVP schema through Prisma's runtime connection.

```bash
npm run prisma:studio
```

Opens Prisma Studio for local database inspection.

## Routes

- `/` - Home dashboard
- `/gym` - Workout logging, history, progress, and body measurements
- `/meals` - Meal logging, macro summary, micronutrients, goals, and insights
- `/settings` - Daily nutrition and water goal settings

## API Routes

- `/api/daily-log`
- `/api/todos`
- `/api/workouts`
- `/api/meals`
- `/api/settings`

The app currently uses server actions for the UI, while these API routes provide expansion points for external clients, future Bluetooth/device sync, or health platform integrations.

## Project Structure

```txt
app/
  api/
  gym/
  meals/
  settings/
  actions.ts
  globals.css
  layout.tsx
  page.tsx
components/
  dashboard/
  gym/
  layout/
  meals/
  shared/
  ui/
lib/
  dates.ts
  forms.ts
  insights.ts
  nutrition.ts
  prisma.ts
  workouts.ts
prisma/
  init.ts
  schema.prisma
  seed.ts
types/
```

## Local Data and Secrets

The app stores local data in SQLite. Environment files and database files are intentionally ignored by Git:

- `.env`
- `.env.local`
- `prisma/dev.db`
- `*.db`
- `imports/*`

Use `.env.example` as the safe template for local setup.

## Food Lookup

The meal logger can search USDA FoodData Central. Type a food, enter the weighed amount in grams, choose the matching food result, and the app scales macros and micronutrients into the editable fields.

Set a FoodData Central API key in `.env`:

```txt
FDC_API_KEY="your_api_key_here"
```

If no key is set, the app falls back to USDA's `DEMO_KEY`, which has low request limits.

## Strong Workout Import

Place your Strong export at:

```txt
imports/strong_workouts.csv
```

Then run:

```bash
npm run db:init
npm run db:seed
npm run import:strong
npm run profile:normalize
```

The importer maps Strong data into:

- `Profile`
- `Workout`
- `Exercise`
- `ExerciseSet`
- `ExerciseCatalog`

Imported fields include workout date, workout name, duration, exercise name, set order, weight, reps, distance, seconds, notes, workout notes, and RPE.

## Workout Templates

The gym logger starts closed by default. From the Gym page, you can start a blank workout or choose one of your saved templates.

No templates are seeded automatically. Templates are created only when you log a workout and choose to save it as a template.

## Nutrition Estimates

Settings can store profile height and weight, then estimate default nutrition targets from common fitness heuristics. The user can save the recommended estimate or override it with custom calorie, macro, fiber, and water goals.

## Future Expansion

The codebase is structured so later versions can add:

- Bluetooth smart ring or scale sync
- Heart rate and sleep tracker integrations
- Apple Health or Google Fit import
- Food database search
- Barcode scanning
- Progress photo uploads
- Workout and meal templates
- Advanced charts and weekly reports
- AI-assisted recommendations

## Design Notes

The visual system intentionally avoids neon colors, glowing cards, heavy gradients, glassmorphism, and overdesigned dashboard effects. The interface uses neutral color, thin borders, simple spacing, and readable forms to feel like a focused personal operating system for health and fitness.
