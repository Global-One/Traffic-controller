$(document).ready(function () {
    namespace = "/test";
    var socket = io(namespace);
    // var socket = io.connect('http://' + document.domain + ':' + location.port + '/test');

    // send test event to the server
    socket.on('connect', function () {
        socket.emit('connected');
        console.log('Established connection with server!')
    });

    socket.on('move_car', function (msg) {
        let data = msg.data;
        carMarker.setLatLng(L.latLng(data.state.latitude, data.state.longitude));
        logEvent(msg.event_name, JSON.stringify(data))
    });

    socket.on('on_connect', function (msg) {
        console.log("Connected");
        // $('#log').append('<br>' + $('<div/>').text('Received #' + msg.data + ': ' + msg.data).html());
    });
});