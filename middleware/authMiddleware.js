// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_token'] }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

const teacherMiddleware = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Teacher privileges required.' });
  }
  next();
};

const studentMiddleware = (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Student privileges required.' });
  }
  next();
};

const parentMiddleware = (req, res, next) => {
  if (req.user.role !== 'parent' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Parent privileges required.' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  teacherMiddleware,
  studentMiddleware,
  parentMiddleware
};