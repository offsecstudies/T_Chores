# Teddy Chores

A mobile-first, installable weekly chore tracker built with React, TypeScript and Vite. Works locally without an account; optional private syncing uses Supabase authentication and its free tier.

## Run locally

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. On another device on the same network, use your computer's LAN address. Development mode supports the UI; PWA installation and offline caching require the production build and HTTPS (or localhost).

```sh
npm test
npm run build
npm run preview
```

The tests cover scheduling, Monday rollover, points, completion calculations and preservation of past weeks. The production build includes TypeScript checking and a generated service worker.

## Using the app

- My week shows Monday–Sunday. Tap a day and check a chore to complete it; uncheck to undo.
- Parent settings lets you add, edit or delete chores, choose individual days or every day, and set points. Use zero points for an unscored chore.
- Choose a weekly reward based on points or completion percentage (1–100%). Rewards are an encouragement, not an automatic purchase.
- Past weeks shows retained, read-only weekly snapshots. Only weeks opened in the app are created; unused weeks aren't fabricated.
- Weeks follow the device's local calendar, beginning Monday. A new week starts with no completed chores; previous weeks remain stored. An open app checks rollover every 30 seconds.
- Routine and reward edits affect the current week and future weeks. They may change current-week totals; past-week snapshots stay unchanged.

## Install on Android

Deploy over HTTPS, open in Chrome and use **Install app** when available, or Chrome's **Add to home screen / Install app** menu. The app includes 192px and 512px icons, a standalone manifest and offline app-shell caching. Visit once online after deployment before using offline. Installation availability depends on the browser; normal web use always works. Updates are applied automatically when a newer service worker is available.

## Deploy to Vercel Hobby

1. Push this repository to your GitHub account.
2. Import it in Vercel, select the **Vite** preset and use the repository root.
3. Build command: `npm run build`. Output directory: `dist`. Install command: `npm ci`.
4. Deploy. Vercel supplies HTTPS, required for PWA installation. Local-only mode needs no environment variables. For syncing, follow the Supabase section below before redeploying. No Vercel server functions or paid add-ons are needed. Personal, non-commercial use can use Hobby subject to Vercel's current terms.

The app uses a single page with internal view state, so no SPA rewrite rules are needed. Test the deployed app online, install it, then reopen offline to verify caching on your device.

## Architecture and data

- `src/model.ts`: typed chores, rewards and weekly snapshots; pure scheduling and progress calculations.
- `src/storage.ts`: `ChoreRepository` storage boundary, versioned data validation and local storage adapter.
- `src/main.tsx`: dashboard, settings and history UI.
- `src/style.css`: responsive layout and touch-friendly controls.
- `vite.config.ts`: PWA manifest and Workbox precache configuration.

Data is stored under `teddy-chores:v1` in this browser's local storage. It does not sync between devices or browsers. Clearing site data, using private browsing or changing origins may remove or hide progress. Read failures preserve the stored value and disable writes for that session; write failures display an alert and keep changes in memory. Without Supabase configuration there is no authentication. Cloud mode requires a parent login, but does not yet separate parent and child permissions.

`src/workspace.tsx` manages account lifecycle, local migration, device caches and sync status. `src/sync.ts` provides an asynchronous cloud repository and revision-based change merging. `supabase/schema.sql` defines account ownership and database access policies. Future separate child accounts should add household membership and role-based policies rather than sharing a parent password.

## Enable private syncing with Supabase (free tier)

The app now supports a shared parent account across devices. Separate child identities and permission roles are not included yet. Until configured, the existing local-only app continues working.

1. Create a free project at https://supabase.com/dashboard. Keep the database password private; it is not used by the app.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once. This creates private account documents with row-level security. Anonymous users have no access; authenticated users can read/write only their own account row.
3. In **Authentication → Providers**, enable Email/password with email confirmation. Under **URL Configuration**, set Site URL to your Vercel production origin, such as `https://your-app.vercel.app`. Add your localhost URL (`http://localhost:5173`) to Redirect URLs for development.
4. Find your **Project URL** and **publishable key** in the project's Connect/API settings. A legacy `anon` public key also works. **Never use a secret key or service-role key in Vite or Vercel client variables.**
5. In Vercel → project → Settings → Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production (and Preview if desired). Redeploy: these public settings are bundled at build time. For local work copy `.env.example` to `.env.local`, fill in the two public values, and restart Vite. `.env.local` is ignored by Git.
6. Create a parent account in Teddy Chores, confirm its email and sign in. On the first device choose **Import this device’s progress** to upload existing local chores/history, or **Start fresh**. Existing local data remains untouched. Sign into the same account on your other devices; those devices load the account's cloud data without overwriting it with their own local progress.

### Sync behavior and limits

Cloud changes refresh every four seconds and on window focus/reconnection. Pending edits are cached under an account-specific local-storage key and retried automatically after network failures. Keep the same account signed in for offline use; the app requires a successful first online load before it can work offline. A paused sync shows an alert; sign-out is blocked while edits are pending. Device backups are retained on sign-out to protect unsynced work and are not displayed to other accounts; avoid shared browser profiles for private family data.

Writes use revision checks and merge only changed fields, so independent checkoffs on two devices are preserved. If two devices edit the same checkbox, the last successfully applied edit wins. Chore arrays are replaced as a unit: avoid editing the routine from multiple devices simultaneously. This MVP stores the complete account document (including history) in one row, suitable for a small family; it is not designed for large multi-child households. Supabase Free projects may pause due to inactivity and have email rate limits; use the dashboard to resume a paused project.

### Verify before relying on sync

Use two browser profiles or devices signed into the same account: check a chore on one, wait a few seconds, and verify the other updates; uncheck it in the other direction. Disconnect one device, make a change, reconnect, and confirm both converge. Create a different account and confirm it sees a fresh routine rather than your data. Verify anonymous reads are blocked by RLS. The automated tests exercise merges and conflict retries using an in-memory backend; real authentication, email delivery and deployed RLS must be verified against your own Supabase project.
