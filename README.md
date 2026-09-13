# Sri Mallikarjuna — Operations Web App

A web workspace for stock, contacts, expenses, staff attendance, and business reporting. The React interface connects to Supabase for account and data access, with an Express endpoint for AI-assisted reports.

[Android companion](https://github.com/Sujeeth-Sai/Sri_Mallikarjuna_App) · [Application](src/App.tsx) · [Data layer](src/firebase.ts)

## Main workflows

- Review stock and inventory movements.
- Manage supplier and customer records.
- Track expenses and staff attendance.
- Explore dashboard charts and AI-assisted CFO reports.
- Use translated interface text from `src/translations.ts`.

## Stack

React, TypeScript, Vite, Express, Supabase, Recharts, and jsPDF. The optional report endpoint uses the Google Gen AI SDK. Despite its filename, `src/firebase.ts` implements the application's **Supabase** data layer.

## Local setup

```bash
git clone https://github.com/Sujeeth-Sai/Sri_Mallikarjuna_Webiste.git
cd Sri_Mallikarjuna_Webiste
npm ci
cp .env.example .env
```

Configure your own `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. Set `GEMINI_API_KEY` only if you want to use the server-side AI report endpoint. The Vite config reads the Supabase values at build time.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Checks and production build

```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

`lint` runs TypeScript checking. The build creates the browser bundle and `dist/server.cjs`; an Express runtime is needed for the report API.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Authentication, data subscriptions, and main workspace |
| `src/components/` | Dashboard, stock, contacts, expenses, attendance, and reports |
| `src/firebase.ts` | Supabase data access and subscriptions |
| `src/types.ts` | Business record types |
| `server.ts` | Express server and AI report endpoint |

## Integration status

This checkout does not include database migrations. Reproducing the backend requires the matching Supabase schema and RLS policies. Configure a separate development project: the data layer contains a fallback project configuration.

The Android and web repositories use some different table names, including `stock_transactions` versus `movements` and `employees` versus `staff`. Review the schema mapping before assuming the two clients synchronize the same records. End-to-end cross-platform sync is not established by this README.

Use synthetic records when demonstrating the project. AI-generated reports need human review.
