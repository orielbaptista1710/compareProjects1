// services/developerAccountService.js
//
// Deactivating a developer account (scripts/deactivateUser.js) also takes its
// live listings off the public site; reactivating (scripts/reactivateUser.js)
// puts exactly those back. Same idea as an agent suspension
// (agentAdminService.js): approved ⇄ suspended, other statuses untouched.
import User from '../models/User.js';
import Property from '../models/Property.js';
import { LISTING_STATUS, OWNER_MODEL } from '../constants/roles.js';

const setActive = async (username, isActive) => {
  const user = await User.findOneAndUpdate({ username }, { isActive }, { new: true });
  if (!user) return null;

  const [from, to] = isActive
    ? [LISTING_STATUS.SUSPENDED, LISTING_STATUS.APPROVED]
    : [LISTING_STATUS.APPROVED, LISTING_STATUS.SUSPENDED];
  const { modifiedCount } = await Property.updateMany(
    { userId: user._id, ownerModel: OWNER_MODEL.USER, status: from },
    { $set: { status: to } }
  );
  return { user, listings: modifiedCount };
};

/** @returns {Promise<null | { user, listings: number }>} null when no such user */
export const deactivateDeveloper = (username) => setActive(username, false);

/** @returns {Promise<null | { user, listings: number }>} null when no such user */
export const reactivateDeveloper = (username) => setActive(username, true);
