const { Content, ContentCategory, User } = require('../models/Content');
const { uploadFile } = require('../services/storageService');

exports.createContent = async (req, res, next) => {
  try {
    const { title, description, content_type, is_paid, price, categories } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileData = await uploadFile(file, 'content');
    
    const content = await Content.create({
      title,
      description,
      content_type,
      file_url: fileData.url,
      file_key: fileData.key,
      file_size: fileData.size,
      is_paid,
      price,
      uploaded_by: req.user.userId
    });

    if (categories && categories.length > 0) {
      await content.setCategories(categories);
    }

    res.status(201).json(content);
  } catch (error) {
    next(error);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const content = await Content.findAll({
      include: [
        { model: User, attributes: ['first_name', 'last_name'] },
        { model: ContentCategory, through: { attributes: [] } }
      ]
    });
    res.json(content);
  } catch (error) {
    next(error);
  }
};

// Add to contentController.js

exports.getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findByPk(id, {
      include: [
        { model: User, attributes: ['first_name', 'last_name'] },
        { model: ContentCategory, through: { attributes: [] } }
      ]
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    next(error);
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const file = req.file;
    
    const content = await Content.findByPk(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Only owner or admin can update
    if (req.user.role !== 'admin' && content.uploaded_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this content' });
    }

    // Handle file update
    if (file) {
      if (content.file_key) {
        await deleteFile(content.file_key);
      }
      const fileData = await uploadFile(file, 'content');
      updates.file_url = fileData.url;
      updates.file_key = fileData.key;
      updates.file_size = fileData.size;
    }

    await content.update(updates);

    // Update categories if provided
    if (updates.categories) {
      await content.setCategories(updates.categories);
    }

    res.json(content);
  } catch (error) {
    next(error);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findByPk(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Only owner or admin can delete
    if (req.user.role !== 'admin' && content.uploaded_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this content' });
    }

    // Delete file from storage
    if (content.file_key) {
      await deleteFile(content.file_key);
    }

    await content.destroy();
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
};