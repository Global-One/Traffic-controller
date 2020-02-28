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

function CarMovingSimulation() {
    let m = new Move();
    let updater;
    let data;

    let d = [];

    function timeoutWithAcceleration(distance, acceleration, speed) {
        acceleration = Math.abs(acceleration);
        let d = Math.pow((2 * speed), 2) - 4 * acceleration * (-2 * distance);
        return (-2 * speed + Math.sqrt(d)) / (2 * acceleration);
    }

    function nextData(i) {
        if (i >= d.length - 1) {
            m.stop();
            return;
        }

        let state0 = d[i]["state"];
        let state1 = d[i + 1]["state"];
        let speed = kphToMs(state0["speed"]);
        let acceleration = state0["acceleration"];

        let distance = measure(state0["latitude"], state0["longitude"], state1["latitude"], state1["longitude"]);
        let timeout = (acceleration === 0) ? distance / speed * 1000 :
            timeoutWithAcceleration(distance, acceleration, speed) * 1000;
        console.log("Timeout: ", timeout);

        updater = setTimeout(() => {
            data = d[++i];
            m.stop();
            console.log("Data updated!");
            m.start(data);
            nextData(i);
        }, timeout);
    }

    function processData(data) {
        d.push(data);
    }

    function start() {
        console.log("START!");
        clearInterval(updater);
        let data = d[0];
        m.start(data);
        nextData(0);
    }

    function stop() {
        console.log("STOP!");
        clearInterval(updater);
        m.stop();
    }

    this.start = start;
    this.stop = stop;
    this.processData = processData;

}