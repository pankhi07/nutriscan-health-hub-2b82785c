# Production Upgrade Plan

Existing design, scan flow, and analysis stay intact. All additions layer on top of the current app.

## 1. Database (Supabase migration)

Extend existing tables and add favorites. Current `profiles` has `health_concerns`; current `scans` covers most history needs.

- **profiles** — add: `full_name` (exists), `avatar_url`, `age`, `gender`, `height_cm`, `weight_kg`, `dietary_preference` (enum), `allergies` (text[]). Keep `health_concerns`.
- **scans** — add: `brand`, `barcode`, `nutrition` (jsonb). Existing columns cover the rest.
- **favorites** — new: `user_id`, `scan_id` (FK, cascade), unique(user_id, scan_id).
- **avatars** storage bucket (public, user-scoped write policies).
- RLS on all tables, `auth.uid()`-scoped policies, GRANTs to authenticated + service_role.

## 2. Authentication

Supabase email/password + Google (default per Cloud rules). Pages:
- `/auth` — combined sign-in / sign-up with email verification notice.
- `/auth/forgot-password` and `/reset-password`.
- Persistent session via existing client; root `onAuthStateChange` invalidates router.
- Protected routes moved under `src/routes/_authenticated/`. Public: `/`, `/auth`, `/reset-password`.

## 3. Routes

```
/                         landing → redirects signed-in users to /dashboard
/auth                     sign in / sign up
/auth/forgot-password
/reset-password
/_authenticated/dashboard welcome, quick scan, recent scans, favorites, daily tip
/_authenticated/scan      existing scan UI (moved from index)
/_authenticated/history   list, search, sort, delete
/_authenticated/favorites bookmarked scans
/_authenticated/profile   edit all profile fields
/_authenticated/scan/$id  detailed result page (product img, score, nutrition, harmful highlights, AI explanation, favorite toggle)
```

## 4. Components

- `AuthForm`, `GoogleButton`, `ProtectedLayout` header w/ avatar menu (sign out).
- `ScanCard`, `FavoriteToggle`, `HealthBadge` (reuses `HealthScore`), `NutritionTable`, `IngredientList` (harmful highlighted with reason tooltip).
- `ProfileForm` (name, avatar upload, age, gender, height, weight, diet, allergies, health conditions).
- `SearchBar`, `EmptyState`, `ConfirmDialog`.

## 5. Server functions (createServerFn)

- `saveScan` — insert into `scans` after analysis (auth required, RLS-scoped).
- `listScans` / `getScan` / `deleteScan` / `searchScans`.
- `toggleFavorite` / `listFavorites`.
- `getProfile` / `updateProfile` / `uploadAvatar` (signed upload to bucket).
- Existing `analyzeFoodImage` and `analyzeBarcode` unchanged; add optional `saveScan` chained call from client after success (so anonymous scan still works on `/` if we keep a demo).

## 6. Integration with existing scan

Existing scan UI moves to `/scan` (auth-required). Current concerns come from profile `health_concerns` automatically. After analysis returns, client calls `saveScan` and shows a "Save to favorites" toggle. All existing analysis code paths untouched.

## 7. Manual setup required

- Enable Google OAuth in Lovable Cloud (tool call will handle).
- No secrets needed beyond existing `LOVABLE_API_KEY`.

## Technical notes

- Managed `_authenticated/route.tsx` handles the gate (ssr:false, redirect `/auth`).
- Root `onAuthStateChange` filters SIGNED_IN/OUT/USER_UPDATED only.
- Avatar bucket public; scans image bucket stays private (fixed prior finding).
- All new tables get GRANTs in same migration.

Approve to proceed — I'll ship the migration first, then code.
