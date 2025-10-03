const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

const router = express.Router();

// Send a message (REST endpoint as backup to Socket.io)
router.post('/', authMiddleware.authUser, messageController.sendMessage);

// Get messages for a specific chat
router.get('/:chatId', authMiddleware.authUser, messageController.getChatMessages);

module.exports = router;