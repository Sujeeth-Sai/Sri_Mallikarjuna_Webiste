# Sri Mallikarjuna Industries

Bilingual enterprise management suite for cashew processing and agro-trading. The same React application powers the Vercel website and the Capacitor Android app.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to connect both builds to the shared Supabase project. `VITE_GEMINI_API_KEY` is optional and enables the online AI CFO response; the app includes an offline analysis fallback.

## Web build

```bash
npm run build
npm run preview
```

## Android build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The generated APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Data architecture

Supabase is the primary data provider. The app synchronizes products, contacts, stock transactions, expenses, employees, and attendance with the existing shared schema. A local browser cache keeps the interface usable when the network is unavailable.

## Authentication

The application uses Supabase email/password authentication and starts on a protected sign-in screen. Create the owner account in **Supabase Dashboard → Authentication → Users**, then run `supabase/auth-rls.sql` in the Supabase SQL Editor to restrict the business tables to signed-in users.
