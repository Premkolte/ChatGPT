const messageModel = require('../models/message.model');
const chatModel = require('../models/chat.model');
const { generateResponse } = require('../services/ai.service');

async function sendMessage(req, res) {
    try {
        const { chatId, content } = req.body;
        const user = req.user;

        if (!chatId || !content) {
            return res.status(400).json({ message: 'Chat ID and content are required' });
        }

        // Verify chat exists and belongs to user
        const chat = await chatModel.findOne({ _id: chatId, user: user._id });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        // Save user message
        const userMessage = await messageModel.create({
            chat: chatId,
            user: user._id,
            content: content,
            role: 'user'
        });

        // Generate AI response
        const aiResponse = await generateResponse(content);

        // Save AI message
        const assistantMessage = await messageModel.create({
            chat: chatId,
            user: user._id,
            content: aiResponse,
            role: 'assistant'
        });

        // Update chat's last activity
        await chatModel.findByIdAndUpdate(chatId, { lastActivity: new Date() });

        res.status(201).json({
            message: 'Messages created successfully',
            userMessage,
            assistantMessage
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getChatMessages(req, res) {
    try {
        const { chatId } = req.params;
        const user = req.user;

        // Verify chat exists and belongs to user
        const chat = await chatModel.findOne({ _id: chatId, user: user._id });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        const messages = await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: 1 })
            .populate('user', 'email fullName');

        res.status(200).json({
            message: 'Messages retrieved successfully',
            messages
        });

    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { sendMessage, getChatMessages };
