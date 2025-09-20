
// Utility function to send notifications (backend):
// utils/notificationUtils.js
const db = require('../models');
const { io } = require('../server');

exports.sendNotification = async (userId, notificationData) => {
  try {
    const notification = await db.Notification.create({
      user_id: userId,
      ...notificationData
    });
    
    // Send real-time notification
    io.to(`user-${userId}`).emit('new-notification', notification);
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};



/*
Example usage in controllers:
javascript
// When a student joins a classroom
const { sendNotification } = require('../utils/notificationUtils');

exports.joinClassroom = async (req, res, next) => {
  try {
    // ... existing join logic
    
    // Send notification to teacher
    await sendNotification(classroom.teacher_id, {
      title: 'New Student Enrollment',
      message: `${req.user.first_name} ${req.user.last_name} has joined your ${classroom.title} classroom`,
      type: 'classroom',
      related_entity_type: 'classroom',
      related_entity_id: classroom.classroom_id
    });

    res.status(201).json({ message: 'Successfully joined classroom' });
  } catch (error) {
    next(error);
  }
};

You can trigger notifications from anywhere in your application using the NotificationService
The modal will automatically update when new notifications arrive and show an unread count badge when there are unread notifications
// When a student joins a classroom
await NotificationService.createNotification(teacherId, {
  title: 'New Student Enrollment',
  message: `${studentName} has joined your ${classroomName} classroom`,
  type: 'classroom',
  related_entity_type: 'classroom',
  related_entity_id: classroomId
});
*/