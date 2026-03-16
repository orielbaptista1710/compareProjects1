//middleware/isAdmin.js
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
  }; 
5
export default isAdmin;