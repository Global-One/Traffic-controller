$("#start").click(() => {
    $.get("/simulation_status", {"status": "start"}, function (data, status) {
        console.log("Data: " + data + "\nStatus: " + status);
    });
    getAllDevices(devicesData).then(devices => {
        for (let i in devices) {
            $.ajax({
                url: `/send_mqtt_data?device_id=${devices[i]}`,
                global: false
            })
        }
    });
});
//
// $("#stop").click(() => {
//     $.get("/simulation_status", {"status": "stop"}, function (data, status) {
//         console.log("Data: " + data + "\nStatus: " + status);
//     });
// });
//
// function CarMovingSimulation(carMarker) {
//     let _move;
//     let _updater;
//     let _data_count = 0;
//
//     let _data = [];
//
//     function timeoutWithAcceleration(distance, acceleration, speed) {
//         acceleration = Math.abs(acceleration);
//         let d = Math.pow((2 * speed), 2) - 4 * acceleration * (-2 * distance);
//         return (-2 * speed + Math.sqrt(d)) / (2 * acceleration);
//     }
//
//     function nextData() {
//         if (_data.length === 1) {
//             // _move.stop();
//             _move.stop();
//             _move.start(_data[0]);
//             setTimeout(nextData, 500);
//             return;
//         }
//
//         let state0 = _data[0]["state"];
//         let state1 = _data[1]["state"];
//         let speed = kphToMs(state0["speed"]);
//         let acceleration = state0["acceleration"];
//
//         let distance = measure(state0["latitude"], state0["longitude"], state1["latitude"], state1["longitude"]);
//         let timeout = (acceleration === 0) ? distance / speed * 1000 :
//             timeoutWithAcceleration(distance, acceleration, speed) * 1000;
//         console.log("Timeout: ", timeout);
//         _move.stop();
//         console.log(++_data_count, "Data updated!");
//         _move.start(_data.shift());
//
//         // _updater = setTimeout(() => {
//         //     let data = _data.shift();
//         //     // _move.stop();
//         //     // console.log(++_data_count, "Data updated!");
//         //     // _move.start(data);
//         //     nextData();
//         // }, timeout);
//     }
//
//     function processData(data) {
//         console.log("Data received!");
//         _data.push(data);
//         if (_data.length > 2) {
//             if (_move)
//                 nextData();
//             else start();
//         }
//     }
//
//     function start() {
//         _move = new Move(carMarker);
//         clearInterval(_updater);
//         let data = _data[0];
//         console.log(data);
//         let start_timeout = setInterval(() => {
//             if (data !== undefined) {
//                 clearInterval(start_timeout);
//                 console.log("START!");
//                 _move.start(data);
//             } else
//                 console.log('No data to start')
//         }, 50);
//         nextData();
//     }
//
//     function stop() {
//         console.log("STOP!");
//         clearInterval(_updater);
//         _move.stop();
//     }
//
//     this.start = start;
//     this.stop = stop;
//     this.processData = processData;
//
// }