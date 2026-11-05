// services/agentAdminService.js
//
// Admin review of agent applications (Customer.agent). Status changes are
// atomic: the update only matches when the current status allows the move,
// so two admins clicking at once can't produce an invalid state.
import Customer from '../models/Customer.js';
import Property from '../models/Property.js';
import { AGENT_STATUS, OWNER_MODEL } from '../constants/roles.js';
import logger from '../utils/logger.js';
import { invalidatePropertyCaches } from '../utils/propertyCache.js';

const AGENT_LIST_FIELDS =
  'customerName customerEmail customerPhone emailVerified isActive agent createdAt';

// action → which statuses it may start from, and where it ends up.
// approve also reinstates a suspended or previously rejected agent.
const TRANSITIONS = {
  approve: { from: [AGENT_STATUS.PENDING, AGENT_STATUS.REJECTED, AGENT_STATUS.SUSPENDED], to: AGENT_STATUS.APPROVED },
  reject: { from: [AGENT_STATUS.PENDING], to: AGENT_STATUS.REJECTED },
  suspend: { from: [AGENT_STATUS.APPROVED], to: AGENT_STATUS.SUSPENDED },
};

export const AGENT_REVIEW_ACTIONS = Object.keys(TRANSITIONS);

// While an agent is suspended their approved listings are off the public site
// (public queries only show 'approved'); approving the agent again restores
// exactly those. Pending/rejected listings are left as they are.
const LISTING_STATUS_ON = {
  suspend: { from: 'approved', to: 'suspended' },
  approve: { from: 'suspended', to: 'approved' },
};

const updateAgentListings = async (customerId, action) => {
  const change = LISTING_STATUS_ON[action];
  if (!change) return 0;

  const { modifiedCount } = await Property.updateMany(
    { userId: customerId, ownerModel: OWNER_MODEL.CUSTOMER, status: change.from },
    { $set: { status: change.to } }
  );
  if (modifiedCount) invalidatePropertyCaches();
  return modifiedCount;
};

export const listAgents = async ({ status = AGENT_STATUS.PENDING, page = 1, limit = 20 }) => {
  const filter = { 'agent.status': status };
  const [data, total] = await Promise.all([
    Customer.find(filter)
      .select(AGENT_LIST_FIELDS)
      .sort({ 'agent.appliedAt': 1 }) // oldest application first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return { data, total };
};

/**
 * @returns {{ customer } | { error: 'not_found' } | { error: 'invalid_transition', status }
 *   | { error: 'email_not_verified' }}
 */
export const reviewAgent = async (customerId, action, adminId, reason) => {
  const { from, to } = TRANSITIONS[action];
  // Only agents who have verified their email can be approved.
  const requireVerified = action === 'approve';

  const customer = await Customer.findOneAndUpdate(
    {
      _id: customerId,
      'agent.status': { $in: from },
      ...(requireVerified && { emailVerified: true }),
    },
    {
      $set: {
        'agent.status': to,
        'agent.reviewedBy': adminId,
        'agent.reviewedAt': new Date(),
        ...(action === 'reject' && { 'agent.rejectionReason': reason }),
      },
    },
    { new: true }
  ).select(AGENT_LIST_FIELDS).lean();

  if (!customer) {
    const existing = await Customer.findById(customerId).select('agent.status emailVerified').lean();
    if (!existing) return { error: 'not_found' };
    const status = existing.agent?.status ?? AGENT_STATUS.NONE;
    if (requireVerified && from.includes(status) && !existing.emailVerified) {
      return { error: 'email_not_verified' };
    }
    // Already in the target status: an earlier attempt may have updated the
    // agent but failed on the listings, so finish that part on a retry.
    if (status === to) await updateAgentListings(customerId, action);
    return { error: 'invalid_transition', status };
  }

  const listingsChanged = await updateAgentListings(customerId, action);

  logger.info('Agent reviewed', {
    action,
    adminId: String(adminId),
    customerId: String(customerId),
    listingsChanged,
  });
  return { customer };
};
