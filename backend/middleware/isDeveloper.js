//middleware/isDeveloper.js
const isDeveloper = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    return next();
  }
  return res.status(403).json({ message: 'Developer access required' });
};
export default isDeveloper;
