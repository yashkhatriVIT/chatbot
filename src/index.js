// importing libraries
const express = require('express');
const http = require('http');
const path = require('path');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');
// Make a socket connection
iosocket = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = iosocket(server);

// Setting up port
const port = process.env.PORT || 3000;

// Adding public directory
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));



let mess = 'Welcome!!'
io.on('connection', (socket) => {
    
    socket.on('sendMessage', (txt, callback) => {
        const filter = new Filter();
        if(filter.isProfane(txt)){
            return callback('Profanity is not allowed');
        }
        let user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(user.username, txt));
        callback('Delivered');
    })


    socket.on('sendLocation', (data, cb) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${data.latitude},${data.longitude}`));
        cb('Location Shared!!')
    })


    socket.on('join', (details, callback) => {
        
        let {user, error} = addUser({id:socket.id, ...details});

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage(`Admin`, mess));
        socket.broadcast.to(user.room).emit('message', generateMessage(`Admin`, `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',generateMessage(`Admin`, `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})




server.listen(port, () => {
    console.log(`The app is listening at ${port}`);
});


// netstat -ano | findstr :<PORT> 
// taskkill /PID <PID> /F