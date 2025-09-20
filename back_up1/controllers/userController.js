const { User, Student, Teacher, Expert, Parent } = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { deleteFile } = require('../services/storageService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let where = {};
    
    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_token'] },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Teacher, as: 'teacherProfile', required: false },
        { model: Expert, as: 'expertProfile', required: false },
        { model: Parent, as: 'parentProfile', required: false }
      ]
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_token'] },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Teacher, as: 'teacherProfile', required: false },
        { model: Expert, as: 'expertProfile', required: false },
        { model: Parent, as: 'parentProfile', required: false }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow admins or the user themselves to update
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    // Handle password update
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(updates.password, salt);
      delete updates.password;
    }

    // Handle profile picture update
    if (req.file) {
      if (user.profile_picture_url) {
        await deleteFile(user.profile_picture_key);
      }
      const fileData = await uploadFile(req.file, 'profile-pictures');
      updates.profile_picture_url = fileData.url;
      updates.profile_picture_key = fileData.key;
    }

    // Update user
    await user.update(updates);

    // Update role-specific profile if needed
    if (user.role === 'student' && updates.studentProfile) {
      const student = await Student.findOne({ where: { user_id: id } });
      if (student) {
        await student.update(updates.studentProfile);
      } else {
        await Student.create({ user_id: id, ...updates.studentProfile });
      }
    }
    // Similar blocks for other roles...

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_token'] },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Teacher, as: 'teacherProfile', required: false },
        { model: Expert, as: 'expertProfile', required: false },
        { model: Parent, as: 'parentProfile', required: false }
      ]
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow admins to delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete users' });
    }

    // Can't delete yourself
    if (req.user.userId === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete profile picture if exists
    if (user.profile_picture_key) {
      await deleteFile(user.profile_picture_key);
    }

    // Delete user
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can verify users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to verify users' });
    }

    await user.update({ is_verified: true });

    res.json({ message: 'User verified successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getExperts = async (req, res, next) => {
  try {
    const experts = await User.findAll({
      where: { role: 'expert' },
      include: [{
        model: Expert,
        as: 'expertProfile',
        attributes: ['specialization', 'qualifications']
      }]
    });
    res.json(experts);
  } catch (error) {
    next(error);
  }
};