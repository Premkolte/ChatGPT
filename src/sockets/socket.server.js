const { Server } = require("socket.io");

function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });

        // Additional event handlers can be added here
    });

    return io;
}

module.exports = initSocketServer;