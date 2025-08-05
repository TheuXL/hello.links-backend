const express = require('express');
const router = express.Router();
const { serveContent, verifyPasswordAndServeContent } = require('../controllers/contentController');

// This regex ensures that any alias that starts with 'api' (followed by a slash or end of string)
// is not captured, preventing conflicts with API routes. It allows Unicode characters like emojis.
router.get('/:alias(?!api($|\\/)).*', serveContent);
router.post('/:alias(?!api($|\\/)).*', verifyPasswordAndServeContent);

module.exports = router; 