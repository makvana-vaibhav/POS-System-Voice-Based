const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processVoiceOrder } = require('../controllers/voiceController');

// Store audio in memory for processing
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/voice/process  – accepts audio file or transcript text
router.post('/process', upload.single('audio'), processVoiceOrder);

module.exports = router;
