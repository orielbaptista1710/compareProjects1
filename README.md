# CompareProjects 

**A real estate comparison platform for the Indian market.**

CompareProjects is a full-stack real estate web application built with the MERN stack (MongoDB, Express, React, Node.js).
CompareProjects is a real estate comparison platform for the Indian market. It allows homebuyers to search, filter, and compare residential and commercial development projects across cities — with detailed project pages, media galleries, location maps, and a contact-to-developer flow.

It also aims to be a specialized platform exclusively for developers. Registered developers can log in to list their properties, which on after administration evalution are posted on the website for customer viewing and engagement. 
The listed properties are then analyzed using a comparison module. This module evaluates and compares properties to provide customers with tailored recommendations based on their preferences.


The platform has two user types:
•	Customers (homebuyers) — authenticate via Firebase, manage profiles, browse and save properties
•	Developers / Admins — authenticate via our own JWT system, manage project listings and media

---

## Tech Stack

| Layer | Technology | Notes |
|:---|:---:|---:|
| Frontend | React 18 + Vite | Deployed on Render (static) |
| Backend | Node.js + Express | Deployed on Render (web service) |
| Database | MongoDB Atlas | Production cluster on GCP Mumbai region |
| Auth (customers) | Firebase Auth | Email/password + profile storage |
| Auth (admin/dev) | JWT + HTTP-only cookies | Role-based, own system |
| Media / CDN | Cloudinary | Images and PDFs with transformations |
| Maps | Google Maps Embed API | Landmark data cached in MongoDB |
| City Detection | OpenStreetMap / Nominatim | Via backend proxy, multi-layer cache |
| Error Tracking | Sentry (planned) + Winston | In production |

---

## Features

### Property Listings
- Dynamic listings pulled from MongoDB with a responsive card layout
- Advanced filters: property type, BHK configuration, furnishing status, budget range, and location (State → City → Locality)
- Each card surfaces key highlights: price, images, and project summary

### Smart Search & Compare
- `MainSearchBar` with dropdowns for property type, city, locality, price, and room count
- Multi-layered search pipeline: MongoDB text search → anchored regex → Fuse.js fuzzy fallback
- Side-by-side project comparison module that evaluates properties and surfaces tailored recommendations based on buyer preferences

### Property Detail Pages
- Full media gallery with images and PDFs via Cloudinary
- Google Maps embed with nearby landmarks (populated at write-time via Overpass API, cached in MongoDB)
- Developer contact flow accessible directly from the listing

### Developer Dashboard
- Secure JWT authentication (HTTP-only cookies, role-based access)
- Post, edit, and delete property listings via `SellPropertyForm`
- Media upload with drag-and-drop, per-file progress, client-side compression, and hash-based deduplication
- Listing status management: `pending → approved → rejected`

### Customer Accounts
- Firebase Auth with email/password
- Profile management: photo, email, notification preferences
- Save and revisit favourite properties

### Admin Controls *(in progress)*
- Approve or reject developer submissions before they go public
- Feature specific properties on the platform

---

## Project Structure

```
frontend-vite/
├── public/
└── src/
    ├── components/
    ├── database/
    ├── pages/
    ├── utils/
    ├── App.js
    ├── main.css
    └── vite.config.js

backend/
└── src/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── utils/
    ├── app.js
    ├── config.js
    └── server.js
```

---

## Environment Variables

//CHECK THIS ENV BEFORE PRODUCTION
### Frontend (`frontend-vite/.env`)

| Variable | Description |
|:---|:---|
| `VITE_API_BASE_URL` | Backend API URL (`http://localhost:5000` in dev) |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Embed API key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media URLs |

### Backend (`backend/.env`)

| Variable | Description |
|:---|:---|
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing admin/developer JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `"7d"`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON string of Firebase Admin SDK credentials |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GOOGLE_MAPS_API_KEY` | Server-side Maps API key (for landmark caching) |
| `NODE_ENV` | `development` \| `test` \| `production` |

---
### Pull Request Rules(DEVELOPERS)
-  Every PR needs a description: what changed and why
-  At least one reviewer required (tag lead developer)
-  CI must be green before merging
-  PRs capped at 400 lines of diff — break large features into smaller PRs
-  Self-merge allowed when solo, but CI must still pass

---

## Development Workflow

### Starting a new task

Never work directly on `main` or `develop`. Always branch off `develop`:

```bash
# 1. Pull latest
git checkout develop && git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit regularly
git add . && git commit -m "feat(scope): what you did"

# 4. Push and open a PR to develop
git push origin feature/your-feature-name
```

### Before every commit

```bash
# Frontend
npm run lint    # Must pass with zero errors
npm test        # Must pass with zero failures

# Backend
npm test        # Must pass with zero failures
```

### Pull request rules

- Every PR needs a description explaining what changed and why
- At least one reviewer required (tag the lead developer)
- CI must be green (lint + tests) before merging
- Keep PRs under 400 lines of diff — break large features into smaller PRs
- Self-merging is allowed when working solo, but CI must still pass

> **Rule:** Never commit code with failing tests. If a test is broken and you did not break it, flag it immediately — do not work around it or skip it.

---

## Recommended VS Code Extensions

- **ESLint** — inline lint errors as you type
- **Prettier** — auto-format on save
- **ES7+ React/Redux/React-Native snippets** — component shortcuts
- **GitLens** — inline git blame and history

---

## Updates

- [ ] Sentry integration for production error tracking
- [ ] Admin analytics dashboard (user and developer metrics)
- [ ] Atlas Search migration for full-text search
- [ ] Google Analytics (GA4) / Meta Pixel integration
- [ ] RERA compliance metadata on listings