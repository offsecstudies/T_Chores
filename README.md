# Teddy Chores · The Everyday Quest

A mobile-first React + TypeScript PWA. Teddy completes missions, earns gold (points), advances through knight ranks and unlocks family rewards. Local-only mode needs no account; Supabase adds private syncing and read-only guests. No paid services are required for a small personal deployment.

## Develop

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The production build includes TypeScript checking, a standalone manifest, shield icons and an offline app-shell cache. Install on Android Chrome using **Install app** or **Add to home screen** after visiting the HTTPS deployment once. Localhost is also supported; a plain HTTP LAN address doesn't support PWA installation.

## Missions, gold and rewards

- **Quest board:** Monday–Sunday missions, daily/weekly completion, weekly gold and a weekly bounty. Parent settings manages missions, points, days and the weekly goal. Set zero points for an unscored mission.
- **Treasury:** all-time, this-week or custom inclusive date-range points plus a daily ledger. Totals use the mission's scheduled local calendar date, not the time a checkbox was clicked. This allows old progress to appear correctly without invented timestamps.
- **Reward milestones:** parents can add, edit or remove multiple rewards with different lifetime point thresholds. The board and Treasury show locked/unlocked rewards. Milestones are independent of the weekly bounty, don't spend points, and aren't automatic purchases. Undoing completions may lock a milestone again; there is no redemption/payment system.
- **Character:** lifetime points advance Teddy from Squire (0) to Apprentice knight (100), Knight (300), Guardian (750) and Champion (1,500). Gold and XP represent the same points; they are not separate currencies or real money.
- **Quest journal:** retained weekly snapshots, read-only for previous weeks. Only opened weeks are saved; missed weeks aren't fabricated. Rollover uses the device's local Monday, checked every 30 seconds while open.

New completions capture their awarded points. Editing points or deleting a mission preserves those awards; unchecking a visible mission removes its points, and rechecking awards its current value. Editing days can hide a completed mission, but its earned points remain. Legacy progress is read without changing its format: old checkmarks use the saved weekly chore values and are captured before routine edits. Points lost from missions deleted before this upgrade cannot be reconstructed.

## Vercel Hobby deployment

Import the repository using the **Vite** preset. Use `npm ci`, build `npm run build`, output `dist`. No server functions or SPA rewrite rules are needed. Vercel provides HTTPS. Hobby is intended for personal, non-commercial use subject to its current terms.

Before deploying this upgrade to an existing Supabase-backed app, apply **`supabase/guest-access.sql`** in Supabase SQL Editor. For a brand-new project, run **`supabase/schema.sql` first, then `supabase/guest-access.sql`**. Both are repeatable and preserve progress. If you rerun the base schema later, rerun guest-access.sql afterward to restore the guest-aware policies.

Set these public build variables in Vercel (Production, and Preview if needed), then redeploy:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

For local cloud mode copy `.env.example` to `.env.local`, fill in those values and restart Vite. `.env.local` is ignored by Git. A legacy public anon key also works. Never use a database password, secret API key or service-role key in frontend variables.

In Supabase enable Email/password sign-in, retain email confirmation for self-service accounts, and set **Authentication → URL Configuration → Site URL** to your production origin. Add `http://localhost:5173` to redirect URLs for local development. Create your parent account in the app, confirm its email and sign in. Choose **Import this device's progress** on the first device, or start fresh. Other devices signed into the same parent account load its cloud data rather than overwriting it with their local progress.

## Read-only guest access

Guests authenticate with their own Supabase Auth identity; they never use the parent password.

1. Apply `supabase/guest-access.sql` before deploying this version.
2. A guest can choose **Create guest account** on the sign-in screen, register an email/password and confirm the email. They see a waiting screen until invited.
3. In the parent's **Parent settings → Guest access**, enter their email and choose **Grant access**.
4. The guest signs in or taps Retry. They can view the Quest board, Treasury, reward milestones and journal. Checkboxes are disabled, parent forms are absent, and database RLS rejects writes regardless of client UI.
5. **Revoke access** removes the membership. Active guest pages recheck every four seconds and stop displaying the family data when access is revoked. Revocation cannot erase information someone has already seen or captured.

Each guest can observe one family at a time. A parent with active guests cannot also become a guest of another family. Only accounts created as guests (or the dedicated Family identity) can be enrolled. Parent accounts cannot be forcibly switched into guest mode. Any existing personal document on a guest identity is retained rather than deleted. Child/editor roles are not included.

### Shared Family username

The login form accepts **Family** (case insensitive) as an alias for **`family@teddy-chores.example`**. This is a reserved, non-delivering email address used only for the shared guest identity.

To set it up, use **Supabase Dashboard → Authentication → Users → Add user → Create new user**. Enter `family@teddy-chores.example`, set your chosen guest password, and mark the email **Auto Confirm User / confirmed**. Use Create, not an email invitation: the reserved address cannot receive email. Then sign in as the parent and grant access to **Family** in Parent settings. Only distribute the guest credentials after granting access.

The password is held by Supabase Auth; it is never embedded in the repository, local setup scripts or browser bundle. Set or reset it through Supabase's admin user controls. App code alone cannot create a confirmed account without privileged admin access, and the app never requests a service-role key. Sharing Family credentials intentionally gives the recipients the same read-only guest identity; separate guest accounts allow individual revocation.

## Data and synchronization

- `src/model.ts`: schedules, weekly snapshots, captured point awards, date-range totals and ranks.
- `src/treasury.tsx`: ledger and reward milestone views.
- `src/main.tsx`: quest dashboard, journal and parent forms.
- `src/workspace.tsx`: auth, access resolution, local migration, owner offline queue and read-only guest workspace.
- `src/guests.tsx`, `src/auth.ts`: access management and the public Family username alias.
- `src/storage.ts`: validated, versioned local-only repository.
- `src/sync.ts`: asynchronous Supabase adapter, field-level merges and revision checks.
- `supabase/schema.sql`, `supabase/guest-access.sql`: ownership, guest membership, RLS and scoped grant/revoke functions.

Local-only data uses `teddy-chores:v1`. Cloud owner data/queued changes are cached under the account ID; only previously verified owners can reopen their own cache offline. Clearing site data/private browsing may remove local data. Guests require an online connection and shared documents are kept only in memory, never in the guest's persistent app cache. Sign-out doesn't erase owner device backups. Keep private data in a dedicated browser profile.

Sync refreshes every four seconds and on owner window focus/reconnection. Failed writes retain pending edits and retry automatically. Sign-out is blocked while edits are pending. Initial cloud access and expired-session sign-in require a connection. Independent completion changes merge; the last successfully applied edit wins on the same field. Chore and reward arrays are atomic—avoid simultaneous parent edits from multiple devices. One document holds the family history, appropriate for a small personal tracker rather than a large service. Supabase Free has quotas and may pause inactive projects.

Guest membership is separate from that document. Only the parent can grant/revoke through security-definer functions scoped to their own account; clients cannot directly modify memberships or choose their own role. The functions serialize membership changes to prevent cycles. Public signups and user metadata never grant access to another family's data.

## Validation

`npm test` covers schedules/rollover, backward compatibility, captured points, date boundaries, all-time totals, milestone validation, rank thresholds, merge conflicts and error guidance. PostgreSQL permission tests use PGlite with a minimal Supabase auth fixture, execute the actual SQL scripts, and verify owner/guest/stranger behavior and revocation. This does not replace testing deployed policies or Supabase Auth email delivery.

After applying the SQL and deploying, verify parent sync with two devices, then sign in as Family in a separate browser profile. Confirm shared missions are visible, checkboxes disabled and only a guest account panel is available. Check Treasury date filtering and reward thresholds. Revoke access as the parent and confirm the guest loses the shared view. A different parent account must see only its own data. Existing open/cached older app versions should be refreshed before testing captured awards and the new permission model.
