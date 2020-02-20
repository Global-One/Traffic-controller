$(document).ready(function () {
    let protocol = window.location.protocol;
    namespace = "/test";
    // var socket = io(namespace);
    const socket = io.connect(protocol + '//' + document.domain + ':' + location.port + namespace);

    let simulation = new CarMovingSimulation();

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
    socket.on('move_car', function (msg) {
        let data = msg.data;
        logEvent(msg["event_name"], JSON.stringify(data));

        simulation.processData(data);
        canStart = true;
    });

    socket.on('start_simulation', () => {
        if (canStart) {
            simulation.stop();
            simulation.start();
        }
        console.log("Starting!..");
    });

    socket.on('stop_simulation', () => {
        console.log("Stopped.");
        simulation.stop();
        canStart = true;
    });
});