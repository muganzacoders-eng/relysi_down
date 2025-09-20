const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Create classroom (teacher/admin only)
router.post('/', 
  auth,
  roleCheck(['teacher', 'admin']),
  classroomController.createClassroom // Ensure this is a function
);

// Get all classrooms
router.get('/', 
  auth,
  classroomController.getClassrooms // Ensure this is a function
);

// Get specific classroom
router.get('/:id', 
  auth,
  classroomController.getClassroomById // Ensure this is a function
);

// Update classroom
router.put('/:id', 
  auth,
  roleCheck(['teacher', 'admin']),
  classroomController.updateClassroom // Ensure this is a function
);

// Delete classroom
router.delete('/:id', 
  auth,
  roleCheck(['teacher', 'admin']),
  classroomController.deleteClassroom // Ensure this is a function
);

// Join classroom
router.post('/:id/join', 
  auth,
  roleCheck(['student']),
  classroomController.joinClassroom // Ensure this is a function
);

// Leave classroom
router.post('/:id/leave', 
  auth,
  roleCheck(['student']),
  classroomController.leaveClassroom // Ensure this is a function
);

module.exports = router;