## What

<!-- One or two sentences: what changes for the user or the system. -->

## Why

<!-- The problem this solves, or the ticket (e.g. B-2). -->

## How to test

<!-- Steps a reviewer can follow locally. -->

## Checklist

- [ ] `npm test` and `npm run lint` pass in every app I touched (`npm run build` too for `frontend-vite`)
- [ ] Tests added or updated for the behaviour change
- [ ] Diff is under ~400 lines (split it otherwise)
- [ ] No secrets, `.env` values or real customer data in the diff

**If this touches auth, roles or listings:**
- [ ] Listing ownership goes through `middleware/listingOwner.js` / `ownerFilter()`, not hand-written `userId` filters
- [ ] `userId`, `ownerModel`, `listedBy`, `status` are never read from the request body
- [ ] Customer endpoints live under `/api/customers/` (see `api.js`)
- [ ] Role/status strings come from `constants/roles.js`
- [ ] If an endpoint's request, response or error codes changed, the change is spelled out under **What** above

**If this touches the CRM (`/api/crm/*`, Postgres/Prisma):**
- [ ] No `protect`, `isDeveloper` or `protectCustomer` under `/api/crm/*` (CRM has its own auth)
- [ ] Every lead query is ANDed with `leadScope(user)`
- [ ] `backend/openapi/crm.yaml` updated (and its version bumped) if a CRM endpoint changed
- [ ] A schema change ships with a migration in `backend/prisma/migrations/`, and the old code still works with it (so a rollback is safe)

**If this adds or upgrades a dependency:**
- [ ] The reviewer was told why it is needed (new packages need a yes before merging)
