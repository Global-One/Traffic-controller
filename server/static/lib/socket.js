const socket = io();

// send test event to the server
socket.on('connect', function () {
    socket.emit('connected');
    console.log('Established connection with server!')
});