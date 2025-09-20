// backend/routes/adminRoutes.js - Enhanced admin routes
const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../services/storageService');
const { Op } = require('sequelize');

// Apply middleware to all admin routes
router.use(authMiddleware, adminMiddleware);

// Dashboard Statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Promise.all([
      db.User.count(),
      db.User.count({ where: { role: 'student' } }),
      db.User.count({ where: { role: 'teacher' } }),
      db.User.count({ where: { role: 'parent' } }),
      db.Content.count(),
      db.Classroom.count(),
      db.Exam.count(),
      db.CounselingSession.count(),
      db.Advertisement.count({ where: { is_active: true } }),
      db.User.count({ where: { created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
    ]);

    const [totalUsers, students, teachers, parents, totalContent, totalClassrooms, 
           totalExams, totalCounseling, activeAds, newUsersThisMonth] = stats;

    res.json({
      users: {
        total: totalUsers,
        students,
        teachers,
        parents,
        newThisMonth: newUsersThisMonth
      },
      content: {
        total: totalContent
      },
      classrooms: {
        total: totalClassrooms
      },
      exams: {
        total: totalExams
      },
      counseling: {
        total: totalCounseling
      },
      advertisements: {
        active: activeAds
      }
    });
  } catch (error) {
    next(error);
  }
});

// Content Management
router.get('/content', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (status === 'active') where.is_active = true;
    if (status === 'inactive') where.is_active = false;
    if (type) where.content_type = type;

    const { count, rows } = await db.Content.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'uploader',
          attributes: ['first_name', 'last_name', 'email']
        },
        {
          model: db.ContentCategory,
          as: 'categories',
          through: { attributes: [] }
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      content: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete content
router.delete('/content/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await db.Content.findByPk(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Delete file from storage
    if (content.file_key) {
      try {
        await deleteFile(content.file_key);
      } catch (deleteError) {
        console.warn('Could not delete file from storage:', deleteError.message);
      }
    }

    await content.destroy();
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// User Management
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (role) where.role = role;
    if (status === 'verified') where.is_verified = true;
    if (status === 'unverified') where.is_verified = false;

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_token'] },
      include: [
        { model: db.Student, as: 'studentProfile', required: false },
        { model: db.Teacher, as: 'teacherProfile', required: false },
        { model: db.Parent, as: 'parentProfile', required: false }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Category Management
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await db.ContentCategory.findAll({
      include: [{
        model: db.Content,
        as: 'contents',
        attributes: [],
        required: false
      }],
      attributes: {
        include: [
          [db.sequelize.fn('COUNT', db.sequelize.col('contents.content_id')), 'content_count']
        ]
      },
      group: ['ContentCategory.category_id'],
      order: [['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const category = await db.ContentCategory.create({
      name,
      description
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    next(error);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await db.ContentCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update({ name, description });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await db.ContentCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used
    const contentCount = await db.ContentCategoryMapping.count({
      where: { category_id: id }
    });

    if (contentCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is being used by ${contentCount} content items.` 
      });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Legal Document Management
router.get('/legal-documents', async (req, res, next) => {
  try {
    const documents = await db.LegalDocument.findAll({
      include: [{
        model: db.User,
        as: 'creator',
        attributes: ['first_name', 'last_name', 'email']
      }],
      order: [['document_type', 'ASC'], ['version', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    next(error);
  }
});

router.post('/legal-documents', async (req, res, next) => {
  try {
    const { document_type, title, content, version } = req.body;

    // Deactivate previous versions
    await db.LegalDocument.update(
      { is_active: false },
      { where: { document_type } }
    );

    const document = await db.LegalDocument.create({
      document_type,
      title,
      content,
      version: version || '1.0',
      is_active: true,
      created_by: req.user.userId
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// System Settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await db.SystemSetting.findAll();
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.SystemSetting.upsert({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value.toString(),
        updated_by: req.user.userId
      });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Analytics
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const [userGrowth, contentUploads, examsTaken, counselingSessions] = await Promise.all([
      db.User.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('user_id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: dateFilter }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']]
      }),
      
      db.Content.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('content_id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: dateFilter }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']]
      }),

      db.ExamResult.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('submitted_at')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('result_id')), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: dateFilter }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('submitted_at'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('submitted_at')), 'ASC']]
      }),

      db.CounselingSession.findAll({
        attributes: [
          [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
          [db.sequelize.fn('COUNT', db.sequelize.col('session_id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: dateFilter }
        },
        group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
        order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']]
      })
    ]);

    res.json({
      userGrowth,
      contentUploads,
      examsTaken,
      counselingSessions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;