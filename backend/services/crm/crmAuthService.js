// services/crm/crmAuthService.js
//
// CRM staff login and sessions (CrmUser / CrmSession in Postgres). Isolated
// from the website's auth: nothing here touches protect, Firebase or Mongo.
// The raw session token only ever lives in the crm_session cookie; Postgres
// stores its SHA-256 hash, so a leaked table can't be replayed as a login.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";

export const SESSION_TTL_MS = 8 * 60 * 60_000;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60_000;
// Every CrmUser password must be hashed at this cost (seed and staff admin),
// or DUMMY_HASH timing no longer matches a real account.
export const BCRYPT_COST = 12;

// Compared against when the email is unknown, so a wrong email takes as long
// as a wrong password and response timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("crm-timing-equaliser", BCRYPT_COST);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const publicUser = ({ id, email, name, role }) => ({ id, email, name, role });

// Returns { status: "ok", token, expiresAt, user } | { status: "invalid" } | { status: "locked" }
export async function login({ email, password, ip, userAgent }) {
  const user = await prisma.crmUser.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { status: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return { status: "locked" };

  if (!(await bcrypt.compare(password, user.password))) {
    // Atomic increment so parallel guesses can't undercount.
    const { failedLogins } = await prisma.crmUser.update({
      where: { id: user.id },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    if (failedLogins >= MAX_FAILED_LOGINS) {
      await prisma.crmUser.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) },
      });
    }
    return { status: "invalid" };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.crmUser.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  // Housekeeping: drop this user's dead sessions so the table doesn't grow forever.
  await prisma.crmSession.deleteMany({
    where: { userId: user.id, OR: [{ expiresAt: { lte: new Date() } }, { revokedAt: { not: null } }] },
  });
  await prisma.crmSession.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt, ip, userAgent },
  });

  return { status: "ok", token, expiresAt, user: publicUser(user) };
}

// Checked on every CRM request: unknown, revoked or expired sessions and
// deactivated staff all fail, so deactivating someone logs them out at once.
export async function validateSession(token) {
  if (typeof token !== "string" || !token) return null;

  const session = await prisma.crmSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }
  return { sessionId: session.id, user: publicUser(session.user) };
}

export async function logout(sessionId) {
  await prisma.crmSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
