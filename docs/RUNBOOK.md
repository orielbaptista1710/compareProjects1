# Runbook

What to do when something goes wrong in production. Keep it short and keep it true:
if a step here turns out to be wrong, fix this file in the same PR.

Only the project owner has access to Render, MongoDB Atlas, Neon and Firebase
consoles. Developers work through pull requests and a staging environment only.

Items marked **(verify)** depend on dashboard settings that are not in this repo.
Check them once and then remove the marker.

## 1. Is the site up?

| Check | Meaning |
|---|---|
| `GET /api/health` | Render's health check. 200 = the API process is up and MongoDB is connected. Does not touch Postgres on purpose. |
| `GET /api/health/deep` | For uptime monitors. 200 = MongoDB **and** Postgres (CRM) are both up. 503 = one is down; the body says which (`mongo`, `postgres`). |

Point Render's health check at `/api/health`. Point the uptime monitor at `/api/health/deep`.

## 2. Roll back a bad deploy

1. Render dashboard, open the service (backend or frontend), then **Events / Deploys**.
2. Find the last deploy that was good and use **Rollback** on it. **(verify)** Render may switch
   off auto-deploy for the service after a rollback. Re-enable it once the fix is merged.
3. Open a pull request that reverts the bad change (GitHub's **Revert** button on the merged PR).
   Let CI pass, merge, and let it deploy.
4. Run the smoke test (section 5).

A rollback restores code only. It does **not** undo a database migration (section 3).

## 3. Postgres migrations (Prisma, the CRM database)

- Migrations live in `backend/prisma/migrations/`. They are applied with `npx prisma migrate deploy`,
  which uses `DIRECT_URL` (the direct, non-pooled connection).
- **Never edit or delete a migration that is already merged.** Fix forward with a new migration.
- Make schema changes in two steps so a code rollback stays safe: first add (new nullable column or
  table), deploy; later, once nothing uses the old shape, remove it.
- If a deploy fails during migration, the previous version keeps serving. Do not re-run blindly:
  1. From the owner's machine, with the production `DIRECT_URL`, run `npx prisma migrate status`.
  2. If a migration shows as failed, inspect what it half-applied in the database first.
  3. Then either fix the data by hand and mark it with `npx prisma migrate resolve --applied <name>`,
     or undo it by hand and use `--rolled-back <name>`. Merge a corrected migration afterwards.
- Before any risky migration: note the time, and confirm Neon's restore window for your plan
  **(verify)**. Neon can restore to a point in time within that window.

## 4. MongoDB

- There is no migration tool. One-off changes live in `backend/scripts/` and need the owner's go-ahead.
- Confirm Atlas backups are on for the production cluster, and that a restore has been tried once
  **(verify)**.
- Never run a script against the production database from a developer machine.

## 5. Smoke test after every deploy (about 5 minutes)

On **staging first**, then on production for steps 1 to 5:

1. `/api/health` and `/api/health/deep` both return 200.
2. Home page loads and listings are visible.
3. Search and a filter return results.
4. A property page opens.
5. Customer login works (Firebase), then developer login works.
6. (Staging only) Submit an enquiry through the contact form and confirm it arrives. Never submit
   test enquiries on production.

## 6. A secret leaked (a key, password or connection string was committed, pasted or exposed)

Rotating makes the leaked value useless. Rewriting git history does not, so do not rely on it.

1. Tell the owner straight away.
2. Rotate the leaked credential first, in its own console:
   - MongoDB: Atlas, Database Access, delete the user or change the password.
   - Postgres: Neon, reset the role password.
   - Firebase service account: create a new key, then delete the old one.
   - `JWT_SECRET`: change it (this signs every developer and admin out).
   - Cloudflare R2, Cloudinary, GNews, Turnstile: roll the key in that service.
3. Update the value in Render's environment settings and redeploy.
4. Check the service's logs and the provider's access logs for use of the old credential.
5. Add a note here if the cause was a gap worth closing.

## 7. Who does what

| Task | Who |
|---|---|
| Merge to `master`, approve PRs | Owner (code owner review is required on sensitive paths, see `.github/CODEOWNERS`) |
| Render, Atlas, Neon, Firebase consoles, production env vars | Owner only |
| Staging environment and its credentials | Developers and testers, with their own credentials |
| Production data | Nobody works on it directly |
