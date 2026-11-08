//middleware/isAdmin.js
import { USER_ROLES } from '../constants/roles.js';

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === USER_ROLES.ADMIN) {
      return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
  };
export default isAdmin;
