//middleware/isDeveloper.js
import { USER_ROLES } from '../constants/roles.js';

// 'user' is the legacy developer role; both pass until scripts/migrateRoles.js
// has renamed every account to 'developer'. Admins are deliberately excluded.
const DEVELOPER_ROLES = [USER_ROLES.DEVELOPER, USER_ROLES.LEGACY_DEVELOPER];

const isDeveloper = (req, res, next) => {
  if (req.user && DEVELOPER_ROLES.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Developer access required' });
};
export default isDeveloper;
