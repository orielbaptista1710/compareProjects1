// backend/fakeTests/validateEnv.test.js
//
// Boot-time configuration checks (utils/validateEnv.js). config/env.js runs
// these and refuses to start on any problem.
import { describe, it, expect } from "vitest";
import { validateEnv } from "../utils/validateEnv.js";

const SECRET = "x".repeat(40);

const DEV = {
  NODE_ENV: "development",
  MONGO_URI: "mongodb://localhost/test",
  DATABASE_URL: "postgres://localhost/test",
  JWT_SECRET: SECRET,
};

const PROD = {
  ...DEV,
  NODE_ENV: "production",
  RENDER: "true",
  FIREBASE_SERVICE_ACCOUNT: '{"project_id":"demo"}',
  REACT_APP_FRONTEND_URL: "https://www.example.com,https://example.com",
};

describe("validateEnv", () => {
  it("accepts a valid development and production config", () => {
    expect(validateEnv(DEV)).toEqual([]);
    expect(validateEnv(PROD)).toEqual([]);
  });

  it("requires the database URLs and JWT secret", () => {
    const problems = validateEnv({ NODE_ENV: "development", MONGO_URI: "  " });
    expect(problems).toEqual([
      "MONGO_URI: required",
      "DATABASE_URL: required",
      "JWT_SECRET: required",
    ]);
  });

  it("rejects a short JWT secret without printing it", () => {
    const problems = validateEnv({ ...DEV, JWT_SECRET: "short-secret" });
    expect(problems).toEqual(["JWT_SECRET: must be at least 32 characters"]);
    expect(problems.join(" ")).not.toContain("short-secret");
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(validateEnv({ ...DEV, NODE_ENV: "prod" })).toEqual([
      "NODE_ENV: must be one of development, production, test",
    ]);
  });

  it("refuses to run on Render unless NODE_ENV is production", () => {
    expect(validateEnv({ ...DEV, RENDER: "true" })).toContain('NODE_ENV: must be "production" on Render');
    expect(validateEnv({ ...DEV, RENDER: "true", NODE_ENV: undefined })).toContain(
      'NODE_ENV: must be "production" on Render'
    );
  });

  it("allows NODE_ENV=test only under the test runner (test mode disables rate limits)", () => {
    expect(validateEnv({ ...DEV, NODE_ENV: "test", VITEST: "true" })).toEqual([]);
    expect(validateEnv({ ...DEV, NODE_ENV: "test" })).toEqual([
      'NODE_ENV: "test" is only allowed under the test runner (it disables rate limits)',
    ]);
  });

  it("rejects a FIREBASE_SERVICE_ACCOUNT that isn't valid JSON, in any environment", () => {
    expect(validateEnv({ ...DEV, FIREBASE_SERVICE_ACCOUNT: "{not json" })).toEqual([
      "FIREBASE_SERVICE_ACCOUNT: not valid JSON",
    ]);
  });

  it("requires Firebase credentials and real https origins in production", () => {
    expect(validateEnv({ ...PROD, FIREBASE_SERVICE_ACCOUNT: undefined })).toEqual([
      "FIREBASE_SERVICE_ACCOUNT: required in production",
    ]);
    expect(validateEnv({ ...PROD, REACT_APP_FRONTEND_URL: undefined })).toEqual([
      "REACT_APP_FRONTEND_URL: required in production",
    ]);
    for (const bad of ["http://www.example.com", "https://www.example.com,http://localhost:5173"]) {
      expect(validateEnv({ ...PROD, REACT_APP_FRONTEND_URL: bad })).toEqual([
        "REACT_APP_FRONTEND_URL: production origins must be https and not localhost",
      ]);
    }
  });
});
