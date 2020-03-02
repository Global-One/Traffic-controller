$(document).ready(function () {
    let protocol = window.location.protocol;
    namespace = "/test";
    // var socket = io(namespace);
    const socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

    // let simulation = new CarMovingSimulation(carMarker);
    // let simulation2 = new CarMovingSimulation(carMarker2);

    // send test event to the server
    socket.on('connect', function () {
        logEvent("Connected.");
        console.log('Established connection with server!')
    });

    socket.on('disconnect', () => {
        logEvent("Disconnected.");
        console.log("Disconnected from server.")
    });

    let canStart = false;
    let updater/* = new StartUpdating()*/;
    socket.on('move_car', function (msg) {
        let data = msg.data;
        logEvent(msg["event_name"], JSON.stringify(data));

        // simulation.processData(data);
        // simulation2.processData(data);
        canStart = true;
    });

    socket.on('start_simulation', () => {
        updater = new StartUpdating();
        updater.start();
        console.log("Starting!..");
    });

    socket.on('stop_simulation', () => {
        console.log("Stopped.");
        // simulation.stop();
        canStart = true;
        updater.stop();
    });
});