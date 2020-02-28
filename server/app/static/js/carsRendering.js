firebase.initializeApp({databaseURL: "https://green-waves.firebaseio.com"});
let devicesData = firebase.database().ref('devices');

async function getLastRouteId(deviceId, databaseSnapshot) {
    let id = await databaseSnapshot.child(deviceId).once('value').then(function (snapshot) {
        return snapshot.val().last_route_id;
    });
    return id;
}

async function getTelemetry(device_id, databaseSnapshot) {
    let last_route_id = await getLastRouteId(device_id, databaseSnapshot);
    let telemetry = await databaseSnapshot.child(device_id + '/telemetry/' + last_route_id).once('value').then(function (snapshot) {
        return snapshot.val();
    });
    // console.log(JSON.stringify(telemetry));
    return telemetry;
}

async function getLightersOnCurrentRoute(device_id, databaseSnapshot) {
    let last_route_id = await getLastRouteId(device_id, databaseSnapshot);
    let listOfLighters = await databaseSnapshot.child(device_id + '/routes/' + last_route_id + '/traffic_signals').once('value', function (snapshot) {
        return snapshot.val();
    });
    // console.log(JSON.stringify(listOfLighters));
    return listOfLighters;
}

async function getAllDevices(databaseSnapshot) {
    return await databaseSnapshot.once('value').then(function (snapshot) {
        let tmp = [];
        for (mqtt in snapshot.val()) {
            tmp.push(`${mqtt}`);
        }
        return tmp;
    });
}

async function getTelemetryForAllDevices(databaseSnapshot) {
    let allTelemetry = [];
    let list_of_devices = await databaseSnapshot.once('value').then(function (snapshot) {
        let tmp = [];
        for (mqtt in snapshot.val()) {
            tmp.push(`${mqtt}`);
        }
        return tmp;
    });
    for (device in list_of_devices) {
        tmp = await getTelemetry(list_of_devices[device], databaseSnapshot);
        allTelemetry.push(tmp);
    }
    //console.log(JSON.stringify(allTelemetry));
    return allTelemetry;
}

function createCarMarker(lat, lng) {
    let carIcon = L.icon({
        iconUrl: 'img/car.png',
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
        popupAnchor: [0, 0]
    });

    let marker = new L.Marker([lat, lng],
        {
            icon: carIcon,
            rotationAngle: 0,
            rotationOrigin: "center center",
        });
    marker.addTo(map);
    return marker;
}

var cars = {};

function UpdateCarsData() {
    function update() {
        getAllDevices(devicesData).then(car_ids => {
            // console.log(1, car_ids);
            for (let i in car_ids) {
                // console.log(1.5, i);
                if (cars[car_ids[i]] === undefined) {
                    cars[car_ids[i]] = {};
                    let car = cars[car_ids[i]];
                    console.log(2, car);
                    getTelemetry(car_ids[i], devicesData).then(car_telemetry => {
                        if (car_telemetry) {
                            // console.log(3, car_telemetry);
                            car['last_telemetry_id'] = car_telemetry.length;
                            // console.log(3.5, car_telemetry[0], car_telemetry[0].state);
                            car['marker'] = createCarMarker(car_telemetry[0].state.latitude, car_telemetry[0].state.longitude);
                            let simulation = new CarMovingSimulation(car['marker']);
                            car['simulation'] = simulation;
                            // cars[i]['telemetry_count'] = 0;
                            for (let telemetry in car_telemetry) {
                                // console.log(4, car_telemetry[telemetry]);
                                simulation.processData(car_telemetry[telemetry]);
                            }
                        }
                    });
                } else {
                    // console.log(5);
                    getTelemetry(car_ids[i], devicesData).then(car_telemetry => {
                        if (car_telemetry)
                            for (let i = cars[car_ids[i]].last_telemetry_id; i < car_telemetry.length; ++i) {
                                console.log(5, car_telemetry[i]);
                                cars[car_ids[i]].simulation.processData(car_telemetry[i])
                            }
                    });

                }
            }
        });
    }

    function updateTrafficSignals() {
        for (let car_id in cars) {
            // console.log(car_id);
            if (cars[car_id].last_telemetry_id > 0 && !cars[car_id]['isStarted']) {
                cars[car_id].simulation.start();
                cars[car_id]['isStarted'] = true;
            }
            getLightersOnCurrentRoute(car_id, devicesData).then(traffic_signals => {
                for (let i in traffic_signals) {
                    traffic_signal_id = traffic_signals[i].id;
                    if (traffic_signals[i].state) {
                        traffic_signals_on_route[traffic_signal_id].click()
                    }
                }
            })
        }
    }

    let timer;
    this.start = () => {
        timer = window.setInterval(() => {
            update();
            updateTrafficSignals();
        }, 2000);
    };
    this.stop = () => {
        clearInterval(timer)
    };
}

function StartUpdating() {
    let _updater = new UpdateCarsData();

    this.start = () => {
        window.setInterval(checkForStart, 1000);
        _updater.start();
    };
    this.stop = () => {
        _updater.stop();
        clearInterval(_updater);
    };

    function checkForStart() {
        // console.log(cars);
        for (let car_id in cars) {
            // console.log(car_id);
            if (cars[car_id].last_telemetry_id > 0 && !cars[car_id]['isStarted']) {
                cars[car_id].simulation.start();
                cars[car_id]['isStarted'] = true;
            }
        }
    }
}
