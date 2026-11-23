# Archived: home-page ContactForm

Removed from the home page (and the unused ContactPage) on 2026-11-21. Kept here so the
form structure can be restored. Not imported anywhere and ignored by eslint.

- It posted to `POST /api/leads/customer` (backend still exists, unchanged).
- To restore: move both files back to `src/pages/Home/HomePageComponents/`, render
  `<ContactForm />` in Home.jsx, and swap the hex in the CSS for tokens.
