// backend/routes/advertisementRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../services/storageService');
const { Op } = require('sequelize');

// Get active advertisements for display
router.get('/active', async (req, res, next) => {
  try {
    const { position, target_audience } = req.query;
    const userRole = req.user?.role || 'all';

    let where = {
      is_active: true,
      [Op.and]: [
        {
          [Op.or]: [
            { start_date: null },
            { start_date: { [Op.lte]: new Date() } }
          ]
        },
        {
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: new Date() } }
          ]
        }
      ]
    };

    if (position) {
      where.position = position;
    }

    if (target_audience) {
      where.target_audience = { [Op.in]: ['all', target_audience] };
    } else {
      where.target_audience = { [Op.in]: ['all', userRole] };
    }

    const advertisements = await db.Advertisement.findAll({
      where,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      limit: 10
    });

    // Update view count
    const adIds = advertisements.map(ad => ad.ad_id);
    if (adIds.length > 0) {
      await db.Advertisement.increment('view_count', {
        where: { ad_id: { [Op.in]: adIds } }
      });
    }

    res.json(advertisements);
  } catch (error) {
    next(error);
  }
});

// Admin: Get all advertisements
router.get('/admin', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    const { count, rows } = await db.Advertisement.findAndCountAll({
      where,
      include: [{
        model: db.User,
        as: 'creator',
        attributes: ['first_name', 'last_name', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      advertisements: rows,
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

// Admin: Create advertisement
router.post('/admin', authMiddleware, adminMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const {
      title,
      description,
      link_url,
      ad_type,
      target_audience,
      position,
      start_date,
      end_date,
      priority
    } = req.body;

    let image_url = null;
    if (req.file) {
      const fileData = await uploadFile(req.file, 'advertisements');
      image_url = fileData.url;
    }

    const advertisement = await db.Advertisement.create({
      title,
      description,
      image_url,
      link_url,
      ad_type,
      target_audience,
      position,
      start_date: start_date || null,
      end_date: end_date || null,
      priority: priority || 1,
      created_by: req.user.userId
    });

    res.status(201).json(advertisement);
  } catch (error) {
    next(error);
  }
});

// Admin: Update advertisement
router.put('/admin/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const advertisement = await db.Advertisement.findByPk(id);
    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    if (req.file) {
      if (advertisement.image_url) {
        try {
          // Extract key from URL for deletion
          const urlParts = advertisement.image_url.split('/');
          const key = urlParts[urlParts.length - 1];
          await deleteFile(key);
        } catch (deleteError) {
          console.warn('Could not delete old image:', deleteError.message);
        }
      }
      const fileData = await uploadFile(req.file, 'advertisements');
      updates.image_url = fileData.url;
    }

    await advertisement.update(updates);
    res.json(advertisement);
  } catch (error) {
    next(error);
  }
});

// Admin: Delete advertisement
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const advertisement = await db.Advertisement.findByPk(id);
    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    if (advertisement.image_url) {
      try {
        const urlParts = advertisement.image_url.split('/');
        const key = urlParts[urlParts.length - 1];
        await deleteFile(key);
      } catch (deleteError) {
        console.warn('Could not delete image:', deleteError.message);
      }
    }

    await advertisement.destroy();
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Track ad click
router.post('/click/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const advertisement = await db.Advertisement.findByPk(id);
    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    // Record click
    await db.AdClick.create({
      ad_id: id,
      user_id: req.user?.userId || null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Update click count
    await advertisement.increment('click_count');

    res.json({ message: 'Click recorded', redirect_url: advertisement.link_url });
  } catch (error) {
    next(error);
  }
});

// Get advertisement analytics
router.get('/analytics/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    let dateFilter = new Date();
    switch (period) {
      case '1d':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 7);
    }

    const advertisement = await db.Advertisement.findByPk(id, {
      include: [{
        model: db.AdClick,
        as: 'clicks',
        where: {
          clicked_at: { [Op.gte]: dateFilter }
        },
        required: false
      }]
    });

    if (!advertisement) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    const analytics = {
      total_views: advertisement.view_count,
      total_clicks: advertisement.click_count,
      recent_clicks: advertisement.clicks.length,
      ctr: advertisement.view_count > 0 ? (advertisement.click_count / advertisement.view_count * 100).toFixed(2) : 0,
      daily_clicks: advertisement.clicks.reduce((acc, click) => {
        const date = click.clicked_at.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

module.exports = router;