const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');

    const userResult = await pool.query(
      'SELECT id, full_name, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found' });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'User account is inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }

    next();
  };
}

module.exports = { protect, allowRoles };
