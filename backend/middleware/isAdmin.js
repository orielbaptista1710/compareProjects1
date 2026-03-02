//middleware/isAdmin.js
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
  }; 

export default isAdmin;