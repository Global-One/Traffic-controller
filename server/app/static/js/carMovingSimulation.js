$("#start").click(() => {
    $.get("/simulation_status", {"status": "start"}, function (data, status) {
        console.log("Data: " + data + "\nStatus: " + status);
    });
});

$("#stop").click(() => {
    $.get("/simulation_status", {"status": "stop"}, function (data, status) {
        console.log("Data: " + data + "\nStatus: " + status);
    });
});

function CarMovingSimulation(carMarker) {
    let _move;
    let _updater;
    let _data_count = 0;

    let _data = [];

    function timeoutWithAcceleration(distance, acceleration, speed) {
        acceleration = Math.abs(acceleration);
        let d = Math.pow((2 * speed), 2) - 4 * acceleration * (-2 * distance);
        return (-2 * speed + Math.sqrt(d)) / (2 * acceleration);
    }

    function nextData(i) {
        if (i >= _data.length - 1) {
            _move.stop();
            return;
        }

        let state0 = _data[i]["state"];
        let state1 = _data[i + 1]["state"];
        let speed = kphToMs(state0["speed"]);
        let acceleration = state0["acceleration"];

        let distance = measure(state0["latitude"], state0["longitude"], state1["latitude"], state1["longitude"]);
        let timeout = (acceleration === 0) ? distance / speed * 1000 :
            timeoutWithAcceleration(distance, acceleration, speed) * 1000;
        console.log("Timeout: ", timeout);

        _updater = setTimeout(() => {
            let data = _data[++i];
            _move.stop();
            console.log(++_data_count, "Data updated!");
            _move.start(data);
            nextData(i);
        }, timeout);
    }

    function processData(data) {
        console.log("Data received!");
        _data.push(data);
    }

    function start() {
        _move = new Move(carMarker);
        console.log("START!");
        clearInterval(_updater);
        let data = _data[0];
        _move.start(data);
        nextData(0);
    }

    function stop() {
        console.log("STOP!");
        clearInterval(_updater);
        _move.stop();
    }

    this.start = start;
    this.stop = stop;
    this.processData = processData;

}