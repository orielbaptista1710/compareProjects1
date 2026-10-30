// utils/validateEnv.js
//
// Checks the backend's configuration and returns a list of problems (empty =
// OK). Problems name the variable only, never its value. config/env.js runs
// this at startup and refuses to boot on any problem, so a bad Render setting
// fails the deploy instead of shipping a site with broken login or no rate limits.
const REQUIRED = ['MONGO_URI', 'DATABASE_URL', 'JWT_SECRET'];
const NODE_ENVS = ['development', 'production', 'test'];
const MIN_JWT_SECRET_LENGTH = 32;

const isJson = (value) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export function validateEnv(env) {
  const problems = [];

  for (const name of REQUIRED) {
    if (!env[name]?.trim()) problems.push(`${name}: required`);
  }

  // A short secret can be brute-forced, which lets anyone forge admin logins.
  if (env.JWT_SECRET && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(`JWT_SECRET: must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
  }

  if (env.NODE_ENV && !NODE_ENVS.includes(env.NODE_ENV)) {
    problems.push(`NODE_ENV: must be one of ${NODE_ENVS.join(', ')}`);
  }

  // Render sets RENDER=true on its services. Without NODE_ENV=production the
  // auth cookie isn't Secure/SameSite=None (cross-site login breaks) and 500s
  // show internal error messages.
  if (env.RENDER && env.NODE_ENV !== 'production') {
    problems.push('NODE_ENV: must be "production" on Render');
  }

  // Test mode switches every rate limiter off; only the test runner may use it.
  if (env.NODE_ENV === 'test' && !env.VITEST) {
    problems.push('NODE_ENV: "test" is only allowed under the test runner (it disables rate limits)');
  }

  if (env.FIREBASE_SERVICE_ACCOUNT && !isJson(env.FIREBASE_SERVICE_ACCOUNT)) {
    problems.push('FIREBASE_SERVICE_ACCOUNT: not valid JSON');
  }

  if (env.NODE_ENV === 'production') {
    // config/firebaseAdmin.js falls back to a local key file that isn't deployed.
    if (!env.FIREBASE_SERVICE_ACCOUNT) {
      problems.push('FIREBASE_SERVICE_ACCOUNT: required in production');
    }

    // server.js falls back to localhost origins, which would make CORS and the
    // Origin check block the real site.
    const origins = (env.REACT_APP_FRONTEND_URL ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (!origins.length) {
      problems.push('REACT_APP_FRONTEND_URL: required in production');
    } else if (origins.some((o) => !o.startsWith('https://') || /localhost|127\.0\.0\.1/.test(o))) {
      problems.push('REACT_APP_FRONTEND_URL: production origins must be https and not localhost');
    }
  }

  return problems;
}
