import http from "http";
import express from "express";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";
import cors from "cors";

configDotenv();
const app = express();
app.use(cors({
    origin: ['https://books-mall.vercel.app', "http://localhost:3000","https://booksmall-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  }));
const server = http.createServer(app);
const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: ['https://books-mall.vercel.app',"http://localhost:3000","https://booksmall-1.onrender.com"], // The URL of your Vercel app
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





const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
