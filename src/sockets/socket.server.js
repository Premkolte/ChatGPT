const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const messageModel = require('../models/message.model');
const chatModel = require('../models/chat.model');
const { generateResponse } = require('../services/ai.service');

function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use(async (socket, next) => {
        try {
            const cookies = socket.handshake.headers.cookie;
            if (cookies) {                           
                const parsedCookies = cookie.parse(cookies);
                const token = parsedCookies.token;
                if (token) {
                    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                        const user = await userModel.findById(decoded.userId);
                        if (err || !user) {
                            return next(new Error('Authentication error'));
                        }
                        socket.user = user;
                        return next();
                    });
                } else {
                    return next(new Error('Authentication error'));
                }
            } else {
                return next(new Error('Authentication error'));
            }
        } catch (error) {
            return next(new Error('Authentication error'));
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id, "User:", socket.user.email);

        // Join user to their own room for private messaging
        socket.join(socket.user._id.toString());

        // Handle sending messages
        socket.on("send_message", async (data) => {
            try {
                console.log("Received send_message event:", data);
                
                // Handle different data structures from different clients
                let chatId, content;
                if (data.data) {
                    // Postman sends: { event: 'send_message', data: { chatId, content } }
                    chatId = data.data.chatId;
                    content = data.data.content;
                } else {
                    // Direct sends: { chatId, content }
                    chatId = data.chatId || data.chat;
                    content = data.content;
                }

                if (!chatId || !content) {
                    console.log("Missing chatId or content. ChatId:", chatId, "Content:", content);
                    socket.emit("error", { message: "Chat ID and content are required" });
                    return;
                }

                // Verify chat exists and belongs to user
                const chat = await chatModel.findOne({ _id: chatId, user: socket.user._id });
                if (!chat) {
                    console.log("Chat not found for user:", socket.user._id, "chatId:", chatId);
                    socket.emit("error", { message: "Chat not found or access denied" });
                    return;
                }

                console.log("Chat found, saving user message...");
                
                // Save user message
                const userMessage = await messageModel.create({
                    chat: chatId,
                    user: socket.user._id,
                    content: content,
                    role: 'user'
                });

                console.log("User message saved:", userMessage._id);

                // Emit user message to client
                socket.emit("message_sent", {
                    message: userMessage,
                    type: "user"
                });

                // Generate AI response
                socket.emit("ai_thinking", { message: "AI is generating response..." });
                
                console.log("Generating AI response...");
                
                const aiResponse = await generateResponse(content);
                
                console.log("AI response generated:", aiResponse?.substring(0, 100));

                // Save AI message
                const assistantMessage = await messageModel.create({
                    chat: chatId,
                    user: socket.user._id,
                    content: aiResponse,
                    role: 'assistant'
                });

                console.log("Assistant message saved:", assistantMessage._id);

                // Update chat's last activity
                await chatModel.findByIdAndUpdate(chatId, { lastActivity: new Date() });

                // Emit AI response to client
                socket.emit("ai_response", {
                    message: assistantMessage,
                    type: "assistant"
                });
                
                console.log("AI response emitted to client");

            } catch (error) {
                console.error("Error handling message:", error);
                socket.emit("error", { message: "Failed to send message", error: error.message });
            }
        });

        // Handle joining a chat room
        socket.on("join_chat", async (data) => {
            try {
                const { chatId } = data;
                
                // Verify chat exists and belongs to user
                const chat = await chatModel.findOne({ _id: chatId, user: socket.user._id });
                if (!chat) {
                    socket.emit("error", { message: "Chat not found or access denied" });
                    return;
                }

                socket.join(chatId);
                socket.emit("joined_chat", { chatId, message: `Joined chat: ${chat.title}` });
                
                // Send recent messages
                const messages = await messageModel
                    .find({ chat: chatId })
                    .sort({ createdAt: 1 })
                    .limit(50);
                
                socket.emit("chat_history", { messages });

            } catch (error) {
                console.error("Error joining chat:", error);
                socket.emit("error", { message: "Failed to join chat" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
}

module.exports = initSocketServer;