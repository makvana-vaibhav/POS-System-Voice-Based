const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, me);

module.exports = router;
