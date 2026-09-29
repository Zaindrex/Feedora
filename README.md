# Feedora (ReviewFlow AI)

## Project Overview
Feedora is a production-ready SaaS web application for businesses that allows customers to scan a QR code, rate their experience, generate an AI-assisted review based on their genuine feedback, and easily continue to the business's Google review page.

## Features
* **Smart QR Reviews**: Unique QR codes for each business.
* **AI-assisted review writing**: Generates natural, human-like reviews based on customer feedback chips and rating.
* **Google review integration**: Frictionless transition to Google Review submission.
* **Customer feedback**: Capture detailed analytics on customer sentiment.
* **Business analytics**: Comprehensive dashboard for tracking scans, ratings, and click-throughs.
* **Multi-business management**: Admin portal and owner portals for managing locations.
* **Real-time dashboard**: Modern, responsive analytics dashboard.
* **Downloadable QR codes**: Generate high-res PNG or SVG QR codes for table stands.

## Tech Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui inspired components, Framer Motion, Recharts.
* **Backend**: Supabase (PostgreSQL, Auth, RLS).
* **AI**: Pluggable AI generation supporting Gemini.

## Architecture
The application follows a clean, scalable feature-based architecture:
* `src/pages`: Segmented by domain (`admin/`, `owner/`, `review/`, `landing/`).
* `src/features`: Shared logic and context for domains like auth.
* `src/components`: Reusable UI elements, QR generation, charts.
* `src/services`: Abstractions for external dependencies (Storage/DB, AI).
* `supabase/migrations`: SQL scripts for database schema and Row Level Security.

## Environment Variables
Copy `.env.example` to `.env` for local development (`Copy-Item .env.example .env` in PowerShell, or `cp .env.example .env` in macOS/Linux). Set only public frontend configuration there:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL used by the browser client. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable/anon key. Never use a service-role or secret key here. |
| `VITE_PUBLIC_APP_URL` | Production | Canonical deployed app base URL used in generated QR links and password-reset redirects. Leave unset locally; development uses the current local origin. |

Vite embeds `VITE_` variables at build time. Set these in the frontend hosting platform and rebuild after changing them. `VITE_PUBLIC_APP_URL` must be the final deployed app base URL, including `/Feedora` for the GitHub Pages project site; do not set it to localhost or a temporary deployment URL.

Supabase Edge Functions receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase runtime. They must remain server-side and must never be added to frontend variables or committed files. Additional Edge Function settings:

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | Yes for `generate-review` | Provider API credential, configured as a Supabase secret. |
| `AI_PROVIDER` | Optional | Provider override; defaults to platform settings or `gemini`. |
| `AI_MODEL` | Optional | Model override; defaults to platform settings or `gemini-2.5-flash`. |
| `APP_URL` | Optional | Production origin for owner invitation redirects; request origin is the fallback. |

Configure backend values with Supabase Edge Function secrets, never in `.env`, GitHub source, or `VITE_` variables. `.env` files and local Supabase CLI state are excluded by `.gitignore`.

## Supabase Setup
1. Create a project in [Supabase](https://supabase.com/).
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project's API settings in local `.env` and the frontend deployment platform.
3. Install and authenticate the Supabase CLI, then link the workspace with `supabase link --project-ref <project-ref>`.
4. Apply migrations with `supabase db push`. Review the migration notes below before applying to a database that already has Feedora tables.
5. Add the final application origin and `/reset-password` to Supabase Auth's redirect URL allow-list.

## Database Migration
1. For a fresh database, run migration files in `supabase/migrations/` in timestamp order, or apply them with the Supabase CLI.
2. For the already initialized project, apply only `20260929000000_supabase_integration_security.sql`; the original schema migration creates policies that are not safe to rerun.
3. Create the initial administrator through Supabase Auth, then insert its matching `public.profiles` row with `user_id` set to that Auth user's UUID and role `admin`. Do not use placeholder auth UUIDs.

## Authentication Setup
* Supabase Email/Password authentication is used.
* Ensure Email Auth is enabled in your Supabase Authentication settings.
* Roles (`admin`, `owner`) are strictly managed through the `profiles` table. Only existing admins can provision new owner accounts.

## Edge Functions
The project includes five Supabase Edge Functions:

| Function | Purpose |
| --- | --- |
| `admin-delete` | Admin-only owner and business deletion with audit logging. |
| `create-owner` | Admin-only owner account creation and invitations. |
| `generate-review` | Customer review draft generation through the configured AI provider. |
| `manage-business` | Admin-only business status changes. |
| `manage-owner` | Admin-only owner status changes. |

Deploy functions separately through the Supabase CLI; frontend/GitHub deployment does not deploy them:

```bash
supabase functions deploy admin-delete
supabase functions deploy create-owner
supabase functions deploy generate-review
supabase functions deploy manage-business
supabase functions deploy manage-owner
```

Configure `AI_API_KEY` and, when needed, `AI_PROVIDER`, `AI_MODEL`, and `APP_URL` as Supabase secrets. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime. Never expose the service-role key or AI credentials to the browser.

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.

## Frontend Deployment
GitHub Pages deployment is automated by `.github/workflows/deploy-pages.yml` on pushes to `main` and can also be started manually from Actions.

1. In repository **Settings → Secrets and variables → Actions → Variables**, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_PUBLIC_APP_URL`. The GitHub Pages base URL is `https://Zaindrex.github.io/Feedora`; use the final custom-domain base URL instead if one is configured. The Supabase anon key is designed for browser use; never put a service-role or secret key in these variables.
2. In **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
3. Push to `main` or run the **Deploy Feedora to GitHub Pages** workflow. The workflow validates the frontend variables, runs `npm run build`, and deploys `dist/`.
4. The Pages `404.html` fallback and router base support direct visits and reloads at `/Feedora/review/:businessSlug`.

The repository is public, so GitHub Pages can serve the site at `https://Zaindrex.github.io/Feedora`. If a custom domain is configured later, update `VITE_PUBLIC_APP_URL` to that final app base URL and redeploy.

The local production build is `npm run build`; Vite writes deployable static files to `dist/`. Deploying the frontend does not run migrations or deploy Supabase Edge Functions.

## QR Setup
Owners manage QR codes from `/owner/qr`. In development, QR URLs use the current local origin. Production builds use `VITE_PUBLIC_APP_URL` when configured, falling back to the deployed origin and Vite base path; the QR route is `/review/{businessSlug}`. Set the production variable to the final Feedora app base URL before creating production QR assets.

## Google Review URL Setup
* The Google Review URL is critical for the final conversion step.
* Find the URL: Go to the Google Business Profile, click "Ask for reviews", and copy the link.
* Paste this link in the Business Settings page in the Feedora owner dashboard.

## Security Notes
* Apply every migration before connecting the application. Row Level Security enforces admin and owner data access.
* Frontend route guards improve navigation only; they are not the authorization boundary.
* Do NOT expose AI API keys or the Supabase service-role key to the browser.
* QR parameters do not contain sensitive identifiers (only the public slug is used).

## Testing Instructions
* Run standard TypeScript checks using `npm run build`.
* To test the demo flow, navigate to `/review/underground-bar` (assuming demo data is seeded) to see the customer experience without needing an account.
