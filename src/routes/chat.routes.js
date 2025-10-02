const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// Define chat-related routes here
router.post('/', authMiddleware.authUser, chatController.createChat);

module.exports = router;