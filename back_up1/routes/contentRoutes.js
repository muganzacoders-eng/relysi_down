const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post(
  '/',
  auth,
  upload.single('file'),
  contentController.createContent
);

router.get('/', auth, contentController.getContent);
router.get('/:id', auth, contentController.getContentById);
router.put('/:id', auth, contentController.updateContent);
router.delete('/:id', auth, contentController.deleteContent);

module.exports = router;