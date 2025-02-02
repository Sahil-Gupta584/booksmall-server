import http from "http";
import express from "express";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";
configDotenv();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: "/socket.io",
    cors: {
        // origin: process.env.CLIENT_URL, // The URL of your Vercel app
        origin: ['https://books-mall.vercel.app','https://fantastic-halibut-6954xqq9jgq6frg5w.github.dev'] // The URL of your Vercel app
        methods: ["GET", "POST"],
        credentials: true,

    },
});




const onlineUsers = new Map();
const offlineMessages = new Map();

const broadcastOnlineUsers = () => {
    const activeUsers = Array.from(onlineUsers.keys());
    io.emit('ACTIVE_USERS', activeUsers);
    console.log('activeUsers', activeUsers)

};


io.on("connection", (socket) => {
    console.log("Socket Connection done");

    socket.on('REGISTER_USER', (userId) => {

        onlineUsers.set(userId, socket.id);
        broadcastOnlineUsers()
        console.log('OnlineUsers', onlineUsers);

        // Deliver any offline messages for this user
        const offlineMessageQueue = offlineMessages.get(userId) || [];
        console.log('offlinemessages', offlineMessageQueue)
        offlineMessageQueue.forEach(message => {
            console.log('from offline message')
            io.to(socket.id).emit('RECEIVE_MSG_EVENT', message);
        });
        offlineMessages.delete(userId);
    });

    socket.on("TYPING_EVENT", ({ partnerId, isTyping }) => {

        const partnerSocketId = onlineUsers.get(partnerId);
        console.log('partnerSocketId', partnerSocketId)
        io.to(partnerSocketId).emit("TYPING_EVENT", { partnerId, isTyping })

    })

    socket.on("SEEN_MESSAGE", ({ chatId, partnerId }) => {
        const partnerSocketId = onlineUsers.get(partnerId);
        console.log('partnerSocketId', partnerSocketId);
        console.log('emitting seen message from backend');
        io.to(partnerSocketId).emit("SEEN_MESSAGE", { chatId })

    })

    socket.on('SEND_MESSAGE', (newMessage) => {
        const receiverSocketId = onlineUsers.get(newMessage.receiverId);
        if (receiverSocketId) {
            console.log('sendin for online');
            io.to(receiverSocketId).emit('RECEIVE_MSG_EVENT', newMessage);
        } else {
            // Store the message for later delivery
            console.log('saving for offline')
            let offlineMessageQueue = offlineMessages.get(newMessage.receiverId) || [];
            offlineMessageQueue.push(newMessage);
            offlineMessages.set(newMessage.receiverId, offlineMessageQueue);
        }
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        broadcastOnlineUsers();
    });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
