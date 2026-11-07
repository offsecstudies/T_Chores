# Teddy Chores

A mobile-first, installable weekly chore tracker built with React, TypeScript and Vite. No accounts or paid services required.

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
4. Deploy. Vercel supplies HTTPS, required for PWA installation. No environment variables, server functions, database or paid add-ons are needed. Personal, non-commercial use can use Hobby subject to Vercel's current terms.

The app uses a single page with internal view state, so no SPA rewrite rules are needed. Test the deployed app online, install it, then reopen offline to verify caching on your device.

## Architecture and data

- `src/model.ts`: typed chores, rewards and weekly snapshots; pure scheduling and progress calculations.
- `src/storage.ts`: `ChoreRepository` storage boundary, versioned data validation and local storage adapter.
- `src/main.tsx`: dashboard, settings and history UI.
- `src/style.css`: responsive layout and touch-friendly controls.
- `vite.config.ts`: PWA manifest and Workbox precache configuration.

Data is stored under `teddy-chores:v1` in this browser's local storage. It does not sync between devices or browsers. Clearing site data, using private browsing or changing origins may remove or hide progress. Read failures preserve the stored value and disable writes for that session; write failures display an alert and keep changes in memory. There is no authentication or parental security boundary yet.

For Supabase, introduce an asynchronous repository implementation and loading/error states, then map stable chore IDs and Monday date keys to households, profiles, chore schedules, weekly snapshots and completion records. Add household/child ownership and row-level security together with future authentication; never ship a service-role key in the client. Local data migration and conflict resolution should be explicit when sync is introduced. The current repository interface is synchronous intentionally for the local-only MVP; the UI has one storage boundary to replace.
