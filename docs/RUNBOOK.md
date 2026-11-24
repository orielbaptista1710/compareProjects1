# Runbook

What to do when something goes wrong in production. Keep it short and keep it true:
if a step here turns out to be wrong, fix this file in the same PR.

> **Status: being rolled out.** This describes the target setup. Until each item below
> is in place, do not assume it: automatic migrations on deploy (section 3), deploys that wait
> for CI, and a separate staging environment. Check with the owner which are live.

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

Cost note: every `/deep` call runs a small query. A Neon database that would otherwise sleep
when idle stays awake if the monitor calls it more often than Neon's idle timeout, which
raises compute-hour usage. Use an interval of 10 minutes or more unless you want it always
awake, and check Neon's billing after setting the monitor up.

## 2. Roll back a bad deploy

Steps 1 and 2 are **owner only** (they need Render access). Developers: tell the owner
what broke, then prepare the revert PR (step 3).

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
   - Cloudflare R2 (photo and brochure uploads), GNews, Turnstile: roll the key in that service.
     Cloudinary only if that account is still live (it is listed in `backend/.env.example`
     for old scraper listings; the code does not read it).
3. Update the value in Render's environment settings and redeploy.
4. Check the service's logs and the provider's access logs for use of the old credential.
5. Add a note here if the cause was a gap worth closing.

## 7. Who does what

| Task | Who |
|---|---|
| Approve and merge PRs to `master` | Owner. PRs touching paths in `.github/CODEOWNERS` always request the owner's review |
| Waiting on a review | See section 8: start the next card, don't wait |
| Render, Atlas, Neon, Firebase consoles, production env vars | Owner only |
| Staging environment and its credentials | Developers and testers, with their own credentials |
| Production data | Nobody works on it directly |

## 8. Working as a team (pull requests and reviews)

**Developers, before asking for review:**
1. CI is green on your PR (Frontend checks, Backend checks, Secret scan).
2. Run `/code-review` in Claude Code on your branch and fix the real findings. Say in the PR
   which findings you chose not to fix and why.
3. Keep the PR under about 400 lines of diff. Split it otherwise.

**Developers, while waiting for review: don't wait, start the next card.**
- Create a new branch from the latest `master` for the next card.
- Only if the next card truly depends on the unmerged one, branch from that one instead and
  say so at the top of the new PR ("depends on #12"). Rebase it on `master` once #12 merges.
- If a review is blocking something urgent, say so in the PR.

**Reviewer (owner), for each PR:**
1. Run `/code-review` on the PR first as a quick first pass.
2. Then read its findings plus the risky lines yourself: auth, roles, ownership, CRM lead
   scoping, database changes, new packages. Tools help, but the human approval is the gate.
3. PRs that only touch paths outside `.github/CODEOWNERS` can be approved by any teammate.
