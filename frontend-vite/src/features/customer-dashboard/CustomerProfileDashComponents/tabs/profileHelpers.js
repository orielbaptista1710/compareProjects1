// Pure helpers for the Profile tab (no React), kept separate so they're easy to test.
import { AGENT_STATUS } from "../../../../constants/roles";

const DOTS = "•••";

// "+919938812334" -> "+91993881•••34". Short/missing values are returned as-is.
export const maskPhone = (phone) => {
  if (!phone) return "";
  const s = String(phone).trim();
  return s.length > 6 ? `${s.slice(0, -5)}${DOTS}${s.slice(-2)}` : s;
};

// "jo.anderson@gmail.com" -> "jo.an•••@gmail.com"
export const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "";
  const [local, domain] = email.split("@");
  const keep = local.length > 6 ? 5 : Math.min(2, local.length);
  return `${local.slice(0, keep)}${DOTS}@${domain}`;
};

export const initialsOf = (name) =>
  name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

export const memberSince = (createdAt) => {
  const d = createdAt ? new Date(createdAt) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "long" })
    : "—";
};

// Customer.agent.status, defaulting to "none" (an owner account).
export const agentStatusOf = (user) => user?.agent?.status ?? AGENT_STATUS.NONE;
export const isAgentAccount = (user) => agentStatusOf(user) !== AGENT_STATUS.NONE;

// Status pill shown next to "Agent" in the header card.
export const AGENT_STATUS_LABELS = {
  [AGENT_STATUS.PENDING]: "Approval pending",
  [AGENT_STATUS.APPROVED]: "Approved",
  [AGENT_STATUS.REJECTED]: "Not approved",
  [AGENT_STATUS.SUSPENDED]: "Suspended",
};

/**
 * Checklist steps. state: "done" | "action" (needs the user now) | "todo".
 * Each step carries an `id` so the component can attach its button.
 */
export const agentSteps = (user) => {
  const verified = Boolean(user?.emailVerified);
  const { agencyName, reraAgentId } = user?.agent ?? {};
  return [
    {
      id: "details",
      state: "done",
      title: "Agent details sent",
      detail: [reraAgentId && `RERA ${reraAgentId}`, agencyName].filter(Boolean).join(" · "),
    },
    {
      id: "email",
      state: verified ? "done" : "action",
      title: verified ? "Email verified" : "Verify your email",
      detail: verified ? null : "Check your inbox for a link from CompareProjects.",
    },
    {
      id: "approval",
      state: "todo",
      title: "Our team approves your account",
      detail: verified
        ? "Usually within 2 working days. Then you can post listings."
        : "Usually within 2 working days after your email is verified. Then you can post listings.",
    },
  ];
};

export const ownerSteps = (user, { listingsEnabled, listingCount }) => {
  const verified = Boolean(user?.emailVerified);
  const posted = listingCount > 0;
  return [
    { id: "account", state: "done", title: "Account created", detail: `Member since ${memberSince(user?.createdAt)}` },
    {
      id: "email",
      state: verified ? "done" : "action",
      title: verified ? "Email verified" : "Verify your email",
      detail: verified ? null : "You need a verified email to post a property.",
    },
    {
      id: "post",
      state: posted ? "done" : listingsEnabled && verified ? "action" : "todo",
      title: posted ? "Property posted" : "Post your first property",
      detail: posted
        ? `${listingCount} listing${listingCount === 1 ? "" : "s"} so far`
        : listingsEnabled
          ? "Our team checks every listing before it goes live."
          : "Posting opens soon.",
    },
  ];
};
