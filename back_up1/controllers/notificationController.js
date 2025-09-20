// controllers/notificationController.js
const NotificationService = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await NotificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};