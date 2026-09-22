// backend/prisma.config.js
// Used only by the Prisma CLI (migrate/generate/db push) — not by the running app.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Migrations need a direct (non-pooled) connection — poolers like
    // PgBouncer transaction mode / Supabase / Neon poolers don't support
    // the session-level operations the migration engine relies on.
    url: env("DIRECT_URL"),
  },
});
