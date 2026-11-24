// backend/routes/healthRoutes.js
//
// Two health endpoints with different jobs:
//
//   GET /api/health       Render's health check. Mongo only, no I/O, no rate limiter.
//                         Keep it cheap and independent of Postgres: Render restarts
//                         an unhealthy service, and restarting cannot fix an external
//                         database. A limiter here would also let a flood make Render
//                         see "unhealthy". It only reads an in-memory connection flag.
//
//   GET /api/health/deep  For an uptime monitor / alerts. Checks Mongo AND Postgres
//                         (the CRM database) and returns 503 if either is down.
//                         Do NOT point Render's health check at this one.
import express from 'express';
import mongoose from 'mongoose';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { safeErrorMeta } from '../utils/safeError.js';
import { publicLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// A suspended or unreachable Postgres must report "down" quickly, not hang the request.
// 5s matches the pg pool's connectionTimeoutMillis (config/prisma.js) and leaves room
// for a suspended Neon database to wake up, so an idle-but-healthy DB is not reported down.
export const POSTGRES_TIMEOUT_MS = 5000;

// A probe that has not settled after this long is treated as stuck, and the next
// caller starts a fresh one. Bounds the pile-up to one new query per 15s while still
// recovering quickly once Postgres is back.
export const PING_STALE_MS = 15_000;

// At most ONE `SELECT 1` is ever outstanding. The timeout below stops a caller
// waiting, but it cannot cancel the query, so without this a flood of /deep
// requests during a slow database would pile up queries in Prisma's pool of 10.
// Concurrent callers share the same in-flight query and each keeps its own timeout.
let pingInFlight = null;
let pingStartedAt = 0;
function pingPostgres() {
  const now = Date.now();
  if (!pingInFlight || now - pingStartedAt > PING_STALE_MS) {
    const probe = Promise.resolve(prisma.$queryRaw`SELECT 1`).finally(() => {
      if (pingInFlight === probe) pingInFlight = null; // never clear a newer probe
    });
    pingInFlight = probe;
    pingStartedAt = now;
  }
  return pingInFlight;
}

// Test helper only: forget a query that never settled so tests stay independent.
export function resetPostgresPingForTests() {
  pingInFlight = null;
}

export async function checkPostgres() {
  let timer;
  try {
    await Promise.race([
      pingPostgres(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Postgres health check timed out')), POSTGRES_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch (err) {
    logger.error('Health check: Postgres is down', safeErrorMeta(err));
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const mongoIsUp = () => mongoose.connection.readyState === 1;

router.get('/', (req, res) => {
  const mongoUp = mongoIsUp();
  res.status(mongoUp ? 200 : 503).json({ status: mongoUp ? 'ok' : 'degraded', mongo: mongoUp });
});

router.get('/deep', publicLimiter, async (req, res) => {
  const mongo = mongoIsUp();
  const postgres = await checkPostgres();
  const ok = mongo && postgres;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', mongo, postgres });
});

export default router;
