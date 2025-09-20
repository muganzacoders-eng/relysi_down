// backend/routes/legalRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Get privacy policy
router.get('/privacy-policy', async (req, res, next) => {
  try {
    const policy = await db.LegalDocument.findOne({
      where: { document_type: 'privacy_policy', is_active: true },
      order: [['version', 'DESC']]
    });

    if (!policy) {
      return res.status(404).json({ error: 'Privacy policy not found' });
    }

    res.json(policy);
  } catch (error) {
    next(error);
  }
});

// Get terms of service
router.get('/terms-of-service', async (req, res, next) => {
  try {
    const terms = await db.LegalDocument.findOne({
      where: { document_type: 'terms_of_service', is_active: true },
      order: [['version', 'DESC']]
    });

    if (!terms) {
      return res.status(404).json({ error: 'Terms of service not found' });
    }

    res.json(terms);
  } catch (error) {
    next(error);
  }
});

// Admin: Create/Update legal documents
router.post('/documents', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { document_type, title, content, version } = req.body;

    // Deactivate previous versions
    await db.LegalDocument.update(
      { is_active: false },
      { where: { document_type } }
    );

    // Create new version
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

// Get user agreements
router.get('/user-agreements', authMiddleware, async (req, res, next) => {
  try {
    const agreements = await db.UserAgreement.findAll({
      where: { user_id: req.user.userId },
      include: [{
        model: db.LegalDocument,
        as: 'document'
      }]
    });

    res.json(agreements);
  } catch (error) {
    next(error);
  }
});

// Accept legal document
router.post('/accept/:documentId', authMiddleware, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const document = await db.LegalDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if already accepted
    const existing = await db.UserAgreement.findOne({
      where: {
        user_id: req.user.userId,
        document_id: documentId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Document already accepted' });
    }

    await db.UserAgreement.create({
      user_id: req.user.userId,
      document_id: documentId,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Document accepted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;