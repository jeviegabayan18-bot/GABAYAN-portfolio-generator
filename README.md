# Portfolio Generator

A small website for a first-year BSCS assignment. You enter your information, save it, choose one of three portfolio templates, and preview the page. You can edit or delete a portfolio later.

## Features

- Home, portfolio form (create and edit), template selection, preview, and manage pages
- Exactly three templates: Simple, Modern, and Creative
- Add, save, view, edit, change template, and delete
- Profile picture upload with a preview and size/type checks
- Print or save the preview as a PDF
- Works in the browser before a database is connected

## Tech stack

- Vite, React, and TypeScript
- React Router
- Plain CSS
- Supabase (PostgreSQL and Storage) when environment variables are set
- Vercel for hosting

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

Other commands:

```bash
npm run build
npm run lint
npm run preview
npm run db:check
```

## Demo mode

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the site runs in demo mode. A banner at the top says:

> Demo mode: data saved in this browser only (online database not connected yet)

In demo mode, portfolios are stored in `localStorage`. Profile pictures are compressed and saved as data URLs in that same browser. Refreshing the page keeps the data. Another browser, or another computer, will not see it.

The banner hides itself when the real database is configured. No code change is required to switch. Set the environment variables and redeploy (or restart `npm run dev`).

## How the data layer works

`src/data/types.ts` defines one interface:

- `createPortfolio`
- `listPortfolios`
- `getPortfolio`
- `updatePortfolio`
- `deletePortfolio`
- `uploadProfilePicture`
- `deleteProfilePicture`

`src/data/local.ts` is the temporary browser fallback. `src/data/supabase.ts` talks to Supabase. `src/data/index.ts` picks Supabase when both env vars are real values, and localStorage otherwise.

Column names in the Supabase code match `supabase/migrations/0001_init.sql`. The client is `@supabase/supabase-js` 2.117 or newer, which accepts the current publishable key (`sb_publishable_...`) and the older anon JWT. Nothing in this app requires the key to look like a JWT. A secret key (`sb_secret_...`) is rejected.

## Connect the online database

The database is not connected in this repository. There are no keys in the code. Connect it with these steps.

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project. A good name is **Portfolio Generator**.
3. Wait until the project finishes starting.
4. Open **SQL Editor**. Paste the entire file `supabase/setup_all.sql` and run it. That one file creates the tables, the three template rows, row level security, and the public `profile-pictures` bucket (2 MB, image types only). It is safe to run again. The same SQL is also split into `supabase/migrations/0001_init.sql` and `supabase/storage.sql` if you want two smaller pastes.
5. Optional: run `supabase/seed.sql` to insert one sample portfolio.
6. Open **Storage** and confirm the `profile-pictures` bucket exists and is public.
7. Open **Project Settings → API Keys**. Copy the **Project URL** and the **publishable** key. It looks like `sb_publishable_...`. An older project may show a long anon JWT instead; that also works. Do not copy the secret key (`sb_secret_...`) or the service-role key.
8. Deploy the site on Vercel (steps below) if you have not yet.
9. In the Vercel project, open **Settings → Environment Variables**. Add these for **Production** and **Preview**:
    - `VITE_SUPABASE_URL` = the Project URL
    - `VITE_SUPABASE_ANON_KEY` = the publishable key (or the legacy anon JWT)
    - `VITE_SUPABASE_BUCKET` = `profile-pictures` (optional, this is the default)
10. Redeploy the site. Vite reads these variables at build time, so a new deployment is required.
11. Open the published site. The yellow demo banner should be gone.
12. Create a portfolio, then in Supabase open **Table Editor**. You should see a row in `portfolios` and matching rows in the child tables. The photo should appear in the `profile-pictures` bucket.

To try Supabase on your own computer first, copy `.env.example` to `.env.local`, fill in the same two values, and restart `npm run dev`. `.env.local` is git-ignored. Then run `npm run db:check`. Every line should say PASS. If the SQL has not been run yet, the check stops and tells you to paste `supabase/setup_all.sql`. It deletes its own test row when the schema is present.

### Security note

This assignment has no login. The SQL policies allow the publishable (anon) key to read and write portfolio rows so the instructor can test the site without an account. That is fine for this class project. It is not how a public product should protect user data. Do not put the secret key or the service-role key in Vercel or in any `VITE_` variable. `VITE_` values are visible in the browser.

## Deploy on Vercel

1. Push this project to a Git repository.
2. In Vercel, choose **Add New Project** and import that repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add the environment variables from the section above if the database is ready. You can deploy once without them (demo mode) and add them later, then redeploy.
7. Deploy. `vercel.json` sends all routes to `index.html` so refreshing a page like `/portfolio/some-id` still opens the app.
8. Visit the URL Vercel gives you, for example `https://your-project.vercel.app`.

## Project files

| Path | What it is |
| --- | --- |
| `supabase/setup_all.sql` | One paste for tables, policies, and the storage bucket |
| `supabase/migrations/0001_init.sql` | Tables, constraints, template seed, RLS |
| `supabase/storage.sql` | `profile-pictures` bucket and storage policies |
| `scripts/db-check.mjs` | Live PASS/FAIL check (`npm run db:check`) |
| `supabase/seed.sql` | Optional sample portfolio |
| `src/data/` | The shared data interface and both implementations |
| `src/pages/` | Home, form, templates, preview, manage, 404 |
| `src/templates/` | Simple, Modern, and Creative layouts |
| `docs/PROJECT_DOCUMENTATION.md` | Assignment write-up |
| `.env.example` | Placeholder variable names only |

## Scripts

- `npm run dev` — local site on port 4321
- `npm run build` — typecheck and production build
- `npm run lint` — oxlint
- `npm run preview` — serve the production build
- `npm run db:check` — test the live Supabase project (needs env vars; no secrets are printed)
