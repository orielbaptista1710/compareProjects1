import { describe, it, expect } from "vitest";
import { posterRoleOf, getPostingGate } from "../postingGate";
import { AGENT_STATUS, LISTED_BY } from "../../../constants/roles";

const customer = (agentStatus, extra = {}) => ({
  emailVerified: true,
  agent: { status: agentStatus },
  ...extra,
});

describe("posterRoleOf", () => {
  it("posts as an agent only once approved", () => {
    expect(posterRoleOf(customer(AGENT_STATUS.APPROVED))).toBe(LISTED_BY.AGENT);
    for (const status of [AGENT_STATUS.NONE, AGENT_STATUS.PENDING, AGENT_STATUS.REJECTED, AGENT_STATUS.SUSPENDED]) {
      expect(posterRoleOf(customer(status))).toBe(LISTED_BY.OWNER);
    }
  });

  it("defaults to owner with no account or no agent info", () => {
    expect(posterRoleOf(null)).toBe(LISTED_BY.OWNER);
    expect(posterRoleOf({ emailVerified: true })).toBe(LISTED_BY.OWNER);
  });
});

describe("getPostingGate", () => {
  it("lets a verified customer and an approved agent post", () => {
    expect(getPostingGate(customer(AGENT_STATUS.NONE))).toBeNull();
    expect(getPostingGate(customer(AGENT_STATUS.APPROVED))).toBeNull();
  });

  it("blocks an unverified email before anything else", () => {
    const gate = getPostingGate(customer(AGENT_STATUS.SUSPENDED, { emailVerified: false }));
    expect(gate.title).toMatch(/verify your email/i);
  });

  it("blocks no account at all", () => {
    expect(getPostingGate(null).title).toMatch(/verify your email/i);
  });

  it("explains suspended, pending and rejected agents", () => {
    expect(getPostingGate(customer(AGENT_STATUS.SUSPENDED)).title).toMatch(/suspended/i);
    expect(getPostingGate(customer(AGENT_STATUS.PENDING)).title).toMatch(/awaiting approval/i);
    expect(getPostingGate(customer(AGENT_STATUS.REJECTED)).title).toMatch(/wasn't approved/i);
  });

  it("shows the admin's reason for a rejected agent and offers the profile", () => {
    const gate = getPostingGate({
      emailVerified: true,
      agent: { status: AGENT_STATUS.REJECTED, rejectionReason: "RERA ID could not be verified" },
    });
    expect(gate.text).toBe("RERA ID could not be verified");
    expect(gate.toProfile).toBe(true);
  });
});
