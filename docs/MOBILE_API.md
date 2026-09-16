# Mobile API Contract — Property Browsing, Search, Compare, Heart & Leads

This document describes the subset of the backend API a mobile app needs to replicate the website's core property browsing and interaction features: search/filter/browse listings, view property detail, manage a compare list, save ("heart") properties, and submit contact/lead forms.

> **This platform is still under active development.** Several of the endpoints below are new, recently changed, or explicitly marked by the backend team as not yet verified for production. See **Section 6 — Stability Warnings** before you build against anything here, and re-check this doc periodically rather than treating it as frozen.

---

## Authentication

Two unrelated auth systems exist on the backend. **The mobile app only needs the customer one.**

- **Customer auth** uses **Firebase Authentication**. After signing the user in with Firebase on-device, send the Firebase ID token on every authenticated request as:
  ```
  Authorization: Bearer <firebaseIdToken>
  ```
- There is a **separate, unrelated** JWT-cookie auth system used by developer/admin web accounts. It is not relevant to a customer-facing mobile app and is not documented here.

### Auth error behavior

Every customer-authenticated endpoint below returns **HTTP 401** for all authentication failures — there is no 403 case for auth in this system. The three sub-cases, all 401:

| Condition | Body |
|---|---|
| No `Authorization` header / no token | `{ "message": "No token" }` |
| Token present but invalid, malformed, wrong project, or **expired** | `{ "message": "Invalid token" }` |
| Token is valid, but no customer account exists for that Firebase user | `{ "message": "Customer not found" }` |

> **Note:** these auth error bodies do **not** use the `{success:false, ...}` envelope used elsewhere in this API — just `{message}`. See the envelope note at the end of Section 5.

### ⚠️ Known gap: lead submission is currently NOT enforcing auth

`POST /leads/customer` (Section 4) is documented in places as a "customer" action, but as currently implemented **it does not require or check a Firebase token at all** — it is publicly callable by anyone who knows the URL. This looks like an oversight/inconsistency on the backend rather than an intentional design (a sibling public-inquiry use case may have been intended, but it isn't enforced either way). **Do not build long-term assumptions around this staying open** — treat it as likely to change, and flag it back to the backend team if your integration depends on knowing who submitted a lead.

---

## Section 1 — Property Browsing & Search (public, no auth required)

### `GET /properties/filters`
Returns the full set of filter option values for building a filter UI.

- **Auth:** none. **Rate limit:** none.
- **Params:** none.
- **200 response:**
  ```json
  {
    "cities": ["Mumbai", "Pune", "..."],
    "propertyTypeOptions": ["Flats/Apartments", "Villa", "..."],
    "furnishingOptions": ["Fully Furnished", "Semi Furnished", "Furnished", "Unfurnished"],
    "facingOptions": ["..."],
    "parkingOptions": ["..."],
    "possessionStatusOptions": ["..."],
    "floorLabelOptions": ["..."],
    "amenitiesOptions": ["..."],
    "areaBounds": {
      "sqft": { "min": 0, "max": 10000 },
      "sqmts": { "min": 0, "max": 1000 },
      "guntas": { "min": 0, "max": 100 },
      "hectares": { "min": 0, "max": 50 },
      "acres": { "min": 0, "max": 50 }
    }
  }
  ```
- **Errors:** none — always 200.

### `GET /properties/localities-by-type`
Returns distinct localities grouped by residential vs. commercial property type.

- **Auth:** none. **Rate limit:** none.
- **200 response:** `{ "residential": ["..."], "commercial": ["..."] }`

### `GET /properties/localities/:city`
Returns distinct localities within a given city.

- **Auth:** none. **Rate limit:** none.
- **Path param:** `city` (string) — must be at least 2 characters.
- **200 response:** `{ "localities": ["..."] }`
- **400** — city missing, not a string, or under 2 characters: `{ "success": false, "message": "A valid city name is required." }`

### `GET /properties/location-options`
Autocomplete for location search boxes (city / locality / pincode).

- **Auth:** none. **Rate limit:** 30 requests / 60s per IP.
- **Query params:**
  | Param | Type | Required | Notes |
  |---|---|---|---|
  | `q` | string | yes | Free text, 2–100 chars after sanitization; shorter/invalid input returns an empty array (not an error) |
  | `city` | string | no | Exact, case-insensitive filter |
- **200 response:** array, capped at **8** items:
  ```json
  [
    { "label": "Koramangala, Bengaluru", "city": "Bengaluru", "locality": "Koramangala", "pincode": null, "type": "locality" }
  ]
  ```
- **429** on rate limit: `{ "error": "Too many search requests — please slow down." }`

### `GET /properties/featured`
- **Auth:** none. **Rate limit:** 120 requests / 60s per IP.
- **Query params:** `limit` (int, default 3, clamped 1–20), `city` (string, optional, exact match).
- **200 response:** bare JSON array (no wrapper object) of property cards:
  ```json
  [{
    "_id": "...", "title": "...", "city": "...", "locality": "...", "price": 0,
    "bhk": 0, "furnishing": "...", "area": { "value": 0, "unit": "sqft" },
    "reraDate": "...", "coverImage": {...}, "pricePerSqft": 0,
    "developerName": "...", "propertyType": "...", "galleryImages": [...],
    "reraNumber": "...", "possessionStatus": "...", "description": "..."
  }]
  ```
- **Errors:** none — always 200, possibly `[]`.

### `GET /properties/recent`
- **Auth:** none. **Rate limit:** 120 requests / 60s per IP.
- **Query params:** `limit` (int, default 6, clamped 1–20), `city` (string, optional).
- **200 response:** bare array of property cards: `_id, title, city, locality, price, bhk, furnishing, area, coverImage, developerName, propertyType, slug, createdAt`.
- **Errors:** none.

### `GET /properties` — main listing / filter search
The primary endpoint for a browsable, filterable, paginated property list.

- **Auth:** none. **Rate limit:** 120 requests / 60s per IP.
- **Query params** (all optional; unrecognized/invalid values are silently ignored and fall back to defaults rather than erroring):

  | Param | Type | Notes |
  |---|---|---|
  | `page` | int | default 1, clamped 1–1000 |
  | `limit` | int | default **12**, clamped 1–**100** |
  | `sortBy` | enum | `relevance` (default), `price-low-high`, `price-high-low`, `newest`, `oldest` |
  | `city` | string | exact, case-insensitive |
  | `locality`, `propertyType`, `furnishing`, `facing`, `parkings`, `possessionStatus` | string or repeated (`?locality=A&locality=B`) | matches any of the given values |
  | `floorLabel` | string, repeated OR comma-separated | matches any of the given values |
  | `amenities` | string or repeated | matches amenities or security features |
  | `bhk` | string or repeated, supports `"5+"` | e.g. `bhk=2&bhk=3` or `bhk=5+` for "5 or more" |
  | `areaMin`, `areaMax` | float | filters on area value |
  | `areaUnit` | string | e.g. `sqft` |
  | `priceMin`, `priceMax` | float | |
  | `search` | string | free-text match against title/description/locality, 2–100 chars |

- **200 response:**
  ```json
  {
    "properties": [ /* full property objects, every field */ ],
    "totalMatched": 42,
    "page": 1,
    "totalPages": 4
  }
  ```
- **Errors:** none — invalid filter combinations just return zero/fewer results.

### `GET /properties/search?query=&limit=` — lightweight instant search
A separate, smaller/faster search endpoint distinct from the main listing endpoint above — better suited to a search-as-you-type box than to a full filtered browse.

> ⚠️ **Unstable** — see Section 6. Backend team has explicitly marked this as not yet verified for production, and it has no automated test coverage.

- **Auth:** none. **Rate limit:** 30 requests / 60s per IP.
- **Query params:**
  | Param | Type | Notes |
  |---|---|---|
  | `query` | string | **the param name is `query`, not `q` or `search`** |
  | `limit` | int | default 5, clamped 1–10 |
- Supports free-text natural-language-ish queries such as `"3bhk under 50 lakh in Whitefield"`, `"villa above 1 crore"`, `"between 40 lakh and 80 lakh"` — recognizes BHK count, price with lakh/crore units, RERA mentions, furnishing status, and an `in <place>` location phrase.
- Query text is sanitized to 2–100 characters; anything shorter returns an empty result (not an error).
- **200 response:**
  ```json
  { "properties": [ /* see field list below */ ], "fuzzy": false }
  ```
  Each property object normally includes: `_id, title, locality, city, state, price, coverImage, galleryImages, propertyType, bhk, furnishing, reraApproved, possessionStatus, area, ageOfProperty, developerName`.
  **When `fuzzy: true`** (the search fell back to typo-tolerant fuzzy matching because exact/regex matching found nothing), some fields may be **absent**: `state`, `galleryImages`, and `reraApproved` are not guaranteed on fuzzy-matched results. Treat those three fields as optional whenever `fuzzy` is `true`.
- **Errors:** none observed — always resolves 200 with `properties: []` on no match.

### `GET /properties/related/:id`
Related listings for a property detail page (same developer, or same locality+city).

- **Auth:** none. **Rate limit:** none.
- **Path param:** `id` — must be a valid property ID.
- **200 response:** bare array, max 10 items: `_id, title, price, bhk, area, coverImage, createdAt, developerName, slug, propertyType, locality`.
- **400** — invalid id format: `{ "success": false, "message": "Invalid property ID." }`
- **404** — the *source* property (the one you're finding related listings for) doesn't exist or isn't approved: `{ "success": false, "message": "Property not found." }`

### `GET /properties/:id` — Property Detail
- **Auth:** none. **Rate limit:** none.
- **Path param:** `id` — a property ID (not a slug — slug-based lookup is not currently available on any route).
- **200 response:** the full property object — every field on the property record, including (non-exhaustive): `title, description, long_description, state, city, locality, address, pincode, coordinates, area, reraApproved, reraNumber, possessionStatus, price, propertyType, furnishing, bhk, bathrooms, facing, balconies, parkings, ageOfProperty, totalFloors, floor, amenities, facilities, security, coverImage, galleryImages, floorPlans, mediaFiles, virtualTours, brochure, slug, featured, developerName, createdAt`.
  - **Caveat:** a computed `pricePerSqft` field exists on some other endpoints' responses but is **not reliably present** on this endpoint's response. Don't hard-depend on it here — compute `price / area.value` client-side if you need it, or verify against a live response first.
- **400** — invalid id format: `{ "success": false, "message": "Invalid property ID." }`
- **404** — no property with that id, **or** the property exists but is pending/rejected (not yet publicly approved) — both cases return the same 404, indistinguishable from the client's perspective: `{ "success": false, "message": "Property not found." }`

---

## Section 2 — Compare List

### `GET /customerActivity/my-activity`
Returns the signed-in customer's saved/hearted properties and their current compare list in one call.

> ⚠️ **Unstable** — see Section 6. This response shape changed very recently (pagination was added) and may change again.

- **Auth:** required (Firebase). **Rate limit:** 60 requests / 60s per IP (shared across all `/customerActivity/*` endpoints).
- **Query params:** `heartPage` (int, default 1), `heartLimit` (int, default 20, clamped max **50**) — paginates the `heartProperties` list only.
- **200 response:**
  ```json
  {
    "success": true,
    "heartedIds": ["...", "..."],
    "heartProperties": [ { "_id", "title", "price", "coverImage", "locality", "city", "propertyType", "bhk" } ],
    "heartPagination": { "page": 1, "limit": 20, "total": 25, "hasMore": true },
    "compareProperties": [ { "_id", "title", "price", "coverImage", "locality", "city", "propertyType", "bhk" } ]
  }
  ```
  - `heartedIds` is the **full, unpaginated** list of all hearted property IDs (strings) — use this if you just need to know "is property X hearted" without fetching card data.
  - `heartProperties` is only **one page** of populated property cards (see `heartPagination` for paging).
  - `compareProperties` is always the **full** compare list, populated with card data (never paginated — it's capped at 4 anyway, see below).
- **401:** see Auth section.

### `PUT /customerActivity/compare` — Save the Compare List

> ### ⚠️ This is a full replace, NOT a merge or append.
> Sending `{"propertyIds": ["X"]}` when the customer already has properties A, B, C in their compare list will **wipe out A, B, and C**, leaving only X. There is no "add one item" or "remove one item" endpoint — the client is responsible for sending the complete desired list every time.
>
> **Correct integration pattern:**
> 1. Read the current list from `compareProperties` in the `GET /customerActivity/my-activity` response (or keep a local copy in sync with it).
> 2. Modify that array locally (add/remove the item the user tapped).
> 3. `PUT` the entire resulting array back.
>
> **Anti-pattern to avoid:** calling `PUT /customerActivity/compare` with just the single newly-tapped property ID, expecting it to be appended to the existing list. It will not be — everything else will be silently discarded.

- **Auth:** required (Firebase). **Rate limit:** 60 requests / 60s (shared, see above).
- **Request body:**
  ```json
  { "propertyIds": ["<property id>", "..."] }
  ```
- **Server-side caps and quirks:**
  - Only the **first 4** valid property IDs in the array are kept — the server hard-caps the compare list to 4 items regardless of how many you send.
  - Any string that isn't a syntactically valid property ID is **silently dropped**, not rejected — you won't get a 400 for including one bad ID among good ones.
- **200 response:**
  ```json
  { "success": true, "compareProperties": [ { "_id", "title", "price", "coverImage", "locality", "city", "propertyType", "bhk" } ] }
  ```
  (up to 4 items, reflecting the final saved state)
- **400** — `propertyIds` is missing or not an array: `{ "message": "propertyIds must be an array" }`
- **401:** see Auth section.

---

## Section 3 — Heart / Save a Property

### `POST /customerActivity/toggle-heart/:propertyId`
Toggles a property's saved/hearted status for the signed-in customer — hearts it if not already hearted, un-hearts it if it is.

> ⚠️ **Unstable** — see Section 6. Response shape changed very recently.

- **Auth:** required (Firebase). **Rate limit:** 60 requests / 60s (shared).
- **Path param:** `propertyId` — a valid property ID.
- **Request body:** none.
- **200 response:**
  ```json
  { "success": true, "isHearted": true, "heartedIds": ["...", "..."] }
  ```
  `isHearted` tells you whether the property is now hearted (`true`) or was just removed (`false`). `heartedIds` is the customer's full updated list of hearted property IDs (plain strings, not populated cards).
- **400** — invalid `propertyId` format: `{ "message": "Invalid property ID" }`
- **400** — hearted-list cap reached (already at 200 hearted properties and trying to add another): `{ "message": "You can only save up to 200 properties." }`
- **404** — rare edge case where the customer record can't be found mid-operation: `{ "message": "Customer not found" }`
- **401:** see Auth section.

---

## Section 4 — Lead Submission (Contact / Enquiry Forms)

### `POST /leads/customer`

> ⚠️ **Currently public / no auth enforced** — see the callout at the top of this document. **Also flagged unstable** — see Section 6 (zero test coverage; an open backend developer note questions whether client-IP detection is fully correct behind the proxy, which could affect the duplicate-submission logic below in edge cases).

- **Auth:** none currently enforced (see warning above — do not assume this is stable).
- **Rate limit:** 50 requests / 15 minutes per IP — **this quota is shared with the developer-side lead endpoint**, i.e. it's 50 total lead submissions combined, not 50 for customer leads alone.

- **Request body fields:**

  | Field | Type | Required | Validation |
  |---|---|---|---|
  | `customerName` | string | yes | min 2 characters |
  | `customerEmail` | string | yes | valid email format |
  | `customerPhone` | string | yes | Indian mobile format: exactly 10 digits, first digit 6–9 (regex `^[6-9]\d{9}$`) |
  | `source` | string (enum) | yes | one of: `home_page_contact`, `property_page_contact`, `smart_properties_page_form`, `quick_links_property_page_form` |
  | `propertyId` | string | no | — |
  | `propertyTitle` | string | no | — |
  | `userType` | string (enum) | no | `buyer` or `investor` |
  | `budget` | string | no | — |
  | `propertyType` | string | no | — |
  | `locality` | string | no | — |
  | `city` | string | no | — |
  | `message` | string | no | max 1000 characters |
  | `loanInterest` | boolean | no | — |
  | `customerContactConsent` | boolean | no | defaults to `true` if omitted |

  Any fields beyond this list are ignored (not stored, not rejected).

- **201 response** — new lead created:
  ```json
  { "success": true, "data": { "_id": "...", "customerName": "...", "customerEmail": "...", "leadStatus": "new", "createdAt": "...", "...": "..." } }
  ```
- **200 response** — duplicate suppressed: if a lead with the **same email + same propertyId** was already submitted in the **last 24 hours**, no new record is created and you instead get:
  ```json
  { "success": true, "message": "Lead already submitted recently" }
  ```
  (Leads without a `propertyId`, e.g. a general homepage enquiry, are deduped the same way using a null `propertyId`.) This is not an error — treat it as a successful submission from the UX's perspective, just don't expect a `data` object.
- **400** — validation failure, one entry per invalid field:
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "formErrors": [],
      "fieldErrors": {
        "customerPhone": ["Invalid 10-digit Indian mobile number"],
        "customerName": ["Name must be at least 2 characters"]
      }
    }
  }
  ```
- **429** — rate limit exceeded:
  ```json
  { "success": false, "message": "Too many requests. Please try again later." }
  ```

---

## Section 5 — Known Caps & Limits (Quick Reference)

| Limit | Value |
|---|---|
| Compare list — max items | **4** (hard server cap; extra IDs beyond the first 4 are dropped, and every `PUT` fully replaces the list) |
| Heart list — max items | **200** |
| Heart list — page size | default 20, max 50 |
| Property listing — page size | default 12, max **100** |
| Instant search (`/properties/search`) — results | default 5, max 10 |
| Location autocomplete — results | max 8 |
| Featured / Recent properties — results | max 20 each |
| Search query length | 2–100 characters after sanitization |
| Lead message length | max 1000 characters |
| Lead phone format | Indian mobile: 10 digits, must start with 6, 7, 8, or 9 |
| Rate limit — search & autocomplete | 30 requests / 60s per IP |
| Rate limit — property listing / featured / recent | 120 requests / 60s per IP |
| Rate limit — customer activity (heart, compare, my-activity) | 60 requests / 60s per IP, shared across all three |
| Rate limit — lead submission | 50 requests / 15 minutes per IP, shared across customer + developer lead forms |
| Lead duplicate-submission window | same email + same property within 24h → treated as duplicate, no new record created |

### A note on error response shapes

You will encounter **three different JSON shapes** for error/non-2xx responses depending on which part of the API you hit — don't assume one shape everywhere:

1. Most validation/not-found errors: `{ "success": false, "message": "..." }` (property routes, lead validation)
2. Customer-activity and auth-middleware errors: `{ "message": "..." }` (no `success` key)
3. Rate-limit rejections (HTTP 429, any endpoint): `{ "error": "..." }` (different key name again)

Design your client's error parsing to check for `message` **or** `error` rather than assuming a single consistent envelope.

---

## Section 6 — Stability Warnings

The website this API backs is still under active development and known to have open bugs. Treat this document as a snapshot of current behavior, not a stable, versioned contract. In particular, as of this writing:

- **Heart & "my-activity" endpoints** (`GET /customerActivity/my-activity`, `POST /customerActivity/toggle-heart/:id`) — the response shapes changed very recently (pagination was added to the heart list; the toggle-heart response was simplified to a bare ID list) and were not yet finalized/committed on the backend at the time this doc was written. Expect the possibility of further shape changes here before this stabilizes.
- **Instant search** (`GET /properties/search`) — explicitly flagged by the backend team as not yet verified for production use, and has no automated test coverage. The underlying ranking strategy (exact text match → regex → fuzzy fallback) is described internally as an interim approach likely to be replaced by a dedicated search engine migration in the future, which could change result ordering or the `fuzzy` field's meaning.
- **Lead submission** (`POST /leads/customer`) — has no automated test coverage, currently enforces no authentication (see the callout near the top of this doc), and has an open, unresolved internal note questioning whether client-IP detection behind the server's proxy is fully correct — this could affect the 24-hour duplicate-submission logic in edge cases (e.g., proxied requests from different real users appearing to share an IP).
- **Compare list** (`PUT /customerActivity/compare`) — comparatively the most stable and well-tested endpoint in this document. Its only real sharp edge is the full-replace behavior already called out above, which is a documented design decision rather than a bug.
- **Property browsing, search-with-filters, and property detail** (`GET /properties`, `GET /properties/:id`, `GET /properties/filters`, etc.) — no recent changes were found, but these also have no automated test coverage in the backend's test suite. Treat as "expected to be stable" rather than "verified stable."

If you hit unexpected behavior on any endpoint marked unstable above, check back with the backend team before assuming it's a mobile-side bug.
