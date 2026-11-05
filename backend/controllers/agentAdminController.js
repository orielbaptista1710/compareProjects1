// controllers/agentAdminController.js
//
// /api/admin/agents — admins approve, reject or suspend agent applications.
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import * as agentService from '../services/agentAdminService.js';
import { AGENT_STATUS } from '../constants/roles.js';
import { readReason } from '../utils/readReason.js';

const LISTABLE_STATUSES = [
  AGENT_STATUS.PENDING,
  AGENT_STATUS.APPROVED,
  AGENT_STATUS.REJECTED,
  AGENT_STATUS.SUSPENDED,
];

// GET /api/admin/agents?status=pending&page=1&limit=20
export const getAgents = asyncHandler(async (req, res) => {
  const status = LISTABLE_STATUSES.includes(req.query.status) ? req.query.status : AGENT_STATUS.PENDING;
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 1000);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const { data, total } = await agentService.listAgents({ status, page, limit });
  res.json({ success: true, data, total, page, limit });
});

// PUT /api/admin/agents/:id/:action   (action: approve | reject | suspend)
export const reviewAgent = asyncHandler(async (req, res) => {
  const { id, action } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid customer id');
  }
  if (!agentService.AGENT_REVIEW_ACTIONS.includes(action)) {
    res.status(400);
    throw new Error(`Action must be one of: ${agentService.AGENT_REVIEW_ACTIONS.join(', ')}`);
  }

  const reason = readReason(req.body?.rejectionReason);

  const result = await agentService.reviewAgent(id, action, req.user._id, reason);

  if (result.error === 'not_found') {
    res.status(404);
    throw new Error('Customer not found');
  }
  if (result.error === 'email_not_verified') {
    res.status(409);
    throw new Error("This agent hasn't verified their email yet. They need to click the verification link and log in again before they can be approved.");
  }
  if (result.error === 'invalid_transition') {
    res.status(409);
    throw new Error(`Can't ${action} an agent whose status is "${result.status}"`);
  }

  res.json({ success: true, customer: result.customer });
});
