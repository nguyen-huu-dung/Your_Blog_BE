// config process env
require('dotenv').config({path: __dirname +  "/.env"});
const express = require('express');
const app = express();
const port = process.env.PORT || 2709;
let { connectDb } = require('./core/config/db.config');
const { router } = require('./routers/index.router');
const { middlewares } = require('./utils/middlewares');
const cors = require('cors');
const clientUrl = process.env.CLIENT_DEPLOY_URL || process.env.CLIENT_LOCAL_URL;
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// config middleware
app.use(cors({
    origin: clientUrl,
    credentials: true
}));
app.use(express.json());
middlewares(app);

// connect database and create grid stream
connectDb();

// config router
router(app);

// process socket io
// notify socket
let userSockets = [];

// notify namespace
const notifyNameSpace = io.of('/notify');

notifyNameSpace.on('connection', (socket) => {

    // listen user info login
    socket.on('sendUserInfo', (arg) => {
        userSockets.push({idSocket: socket.id, ...arg});
    });

    // listen notify
    socket.on('sendNotify', (arg) => console.log(arg));

    // disconnect namespace
    socket.on('disconnect', () => {
        userSockets = userSockets.filter(userSocket => userSocket.idSocket !== socket.id);
    });
});

// chat global namespace
const chatGlobalNamespace = io.of('/chatGlobal');
let userRoomQuestions = [], userRoomChats = [];

chatGlobalNamespace.on('connection', (socket) => {
    // connection global chat
    // console.log("client connect global chat", socket.id);
    // send sum user

    // room question
    socket.on('join-roomQuestion', () => {
        socket.join('roomQuestion');
        userRoomQuestions.push(socket.id);
        chatGlobalNamespace.to('roomQuestion').emit('sum-user-roomQuestion', userRoomQuestions.length);
        // console.log("client join room question", socket.id);
    })

    // listen message
    socket.on('sendMessage-roomQuestion', (arg) => {
        socket.to('roomQuestion').emit('receiveMessage-roomQuestion', arg);
    });

    // leave room
    socket.on('leave-roomQuestion', () => {
        socket.leave('roomQuestion');
        userRoomQuestions = userRoomQuestions.filter(id => id !== socket.id);
        socket.to('roomQuestion').emit('sum-user-roomQuestion', userRoomQuestions.length);
        // console.log("client leave room question", socket.id);
    })

    // room chat
    socket.on('join-roomChat', () => {
        socket.join('roomChat');
        userRoomChats.push(socket.id);
        chatGlobalNamespace.to('roomChat').emit('sum-user-roomChat', userRoomChats.length);
        // console.log("client join room chat", socket.id);
    })

    // listen message
    socket.on('sendMessage-roomChat', (arg) => {
        socket.to('roomChat').emit('receiveMessage-roomChat', arg);
    });

    // leave room
    socket.on('leave-roomChat', () => {
        socket.leave('roomChat');
        userRoomChats = userRoomChats.filter(id => id !== socket.id);
        socket.to('roomChat').emit('sum-user-roomChat', userRoomChats.length);
        // console.log("client leave room chat", socket.id);
    })

    // disconnect namespace
    socket.on('disconnect', () => {
        socket.leave('roomQuestion');
        userRoomQuestions = userRoomQuestions.filter(id => id !== socket.id);
        socket.to('roomQuestion').emit('sum-user-roomQuestion', userRoomQuestions.length);
        socket.leave('roomChat');
        userRoomChats = userRoomChats.filter(id => id !== socket.id);
        socket.to('roomChat').emit('sum-user-roomChat', userRoomChats.length);
        // console.log("client disconnect global chat", socket.id);
    }) 
})

// start server
server.listen(port, () => console.log(`Server is listening socket at port ${port}...`));