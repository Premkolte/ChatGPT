const chatModel = require('../models/chat.model');

async function createChat(req, res) {
    try {
        const { title } = req.body;
        const user = req.user;

        if (!user || !user._id) {
            return res.status(401).json({ message: 'User authentication required' });
        }

        const newChat = await chatModel.create({
            user: user._id,
            title,
        });

        res.status(201).json({
            message: 'Chat created successfully',
            chat: newChat,
            lastActivity: newChat.lastActivity,
            user: newChat.user
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createChat };