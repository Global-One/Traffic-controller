window.onload = () => {
    getAllDevices(devicesData).then(car_ids => {
        for (let i in car_ids) {
            if (cars[car_ids[i]] === undefined) {
                getTelemetry(car_ids[i], devicesData).then(car_telemetry => {
                    let last_id = car_telemetry.length - 1;
                    cars[car_ids[i]] = {};
                    cars[car_ids[i]].marker =
                        createCarMarker(car_telemetry[last_id].state.latitude, car_telemetry[last_id].state.longitude);
                    logEvent('Created car ' + car_ids[i]);
                    cars[car_ids[i]].marker.on('click', () => showRouteControl(car_ids[i]));
                });
            }
        }
    });


    $('.route-input input').keyup(function () {
        var empty = false;
        $('.route-input input').each(function () {
            if ($(this).val().length == 0) {
                empty = true;
            }
        });

        if (empty) {
            $('.route-buttons button').attr('disabled', 'disabled');
        } else {
            $('.route-buttons button').attr('disabled', false);
        }
    });
};

function showRouteControl(car_id) {
    let control = $('#route_builder');
    control.find('#marker_id').val(car_id);
    let latLng = cars[car_id].marker.getLatLng();
    control.find('#route_start').val(`${latLng.lat}, ${latLng.lng}`);
    control.removeClass('invisible');
    map.panTo(latLng);
}

async function getLastRouteId(deviceId, databaseSnapshot) {
    return await databaseSnapshot.child(deviceId).once('value').then(function (snapshot) {
        return snapshot.val().last_route_id;
    });
}

async function getTelemetry(device_id, databaseSnapshot) {
    return await databaseSnapshot.child(
        device_id + '/telemetry/' + await getLastRouteId(device_id, databaseSnapshot)
    ).once('value').then(function (snapshot) {
        return snapshot.val();
    });
}

async function getLightersOnCurrentRoute(device_id, databaseSnapshot) {
    return await databaseSnapshot.child(
        device_id + '/routes/' + await getLastRouteId(device_id, databaseSnapshot) + '/traffic_signals'
    ).once('value').then(function (snapshot) {
        return snapshot.val();
    });
}

async function getAllDevices(databaseSnapshot) {
    return await databaseSnapshot.once('value').then(function (snapshot) {
        let tmp = [];
        for (let mqtt in snapshot.val()) {
            tmp.push(`${mqtt}`);
        }
        return tmp;
    });
}

async function getTelemetryForAllDevices(databaseSnapshot) {
    let allTelemetry = [];
    let list_of_devices = await databaseSnapshot.once('value').then(function (snapshot) {
        let tmp = [];
        for (let mqtt in snapshot.val()) {
            tmp.push(`${mqtt}`);
        }
        return tmp;
    });
    for (let device in list_of_devices) {
        let tmp = await getTelemetry(list_of_devices[device], databaseSnapshot);
        allTelemetry.push(tmp);
    }
    return allTelemetry;
}

function createCarMarker(lat, lng) {
    let carIcon = L.icon({
        iconUrl: 'img/animated_ambulance.gif',
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
        popupAnchor: [0, 0]
    });

    let marker = new L.Marker([lat, lng],
        {
            icon: carIcon,
            rotationAngle: 0,
            rotationOrigin: "top center",
        });
    marker.addTo(map);
    return marker;
}

function UpdateCarsData() {
    function update() {
        getAllDevices(devicesData).then(car_ids => {
            for (let i in car_ids) {
                if (cars[car_ids[i]].simulation === undefined && cars[car_ids[i]].canStart) {
                    getTelemetry(car_ids[i], devicesData).then(car_telemetry => {
                        if (car_telemetry) {
                            let car = cars[car_ids[i]];
                            car['last_telemetry_id'] = car_telemetry.length - 1;
                            let simulation = new Move(car.marker, car_ids[i]);
                            car['simulation'] = simulation;
                            car['isStarted'] = false;
                            for (let telemetry in car_telemetry) {
                                logEvent("Received telemetry", JSON.stringify(car_telemetry[telemetry]));
                                simulation.start(car_telemetry[telemetry]);
                            }
                            car['last_update'] = new Date();
                        }
                    });
                } else if (cars[car_ids[i]].isStarted) {
                    getTelemetry(car_ids[i], devicesData).then(car_telemetry => {
                            if (car_telemetry) {
                                if (cars[car_ids[i]].last_telemetry_id === car_telemetry.length - 1) {
                                    let now = new Date();
                                    if (now.getTime() - cars[car_ids[i]].last_update.getTime() > 2000) {
                                        cars[car_ids[i]].simulation.start(car_telemetry[car_telemetry.length - 1]);
                                        cars[car_ids[i]].simulation.stop();
                                        cars[car_ids[i]].last_update = now;
                                    }
                                }
                                for (let j = cars[car_ids[i]].last_telemetry_id + 1; j < car_telemetry.length; ++j) {
                                    cars[car_ids[i]].simulation.start(car_telemetry[j]);
                                    logEvent("Received telemetry", JSON.stringify(car_telemetry[j]));
                                    cars[car_ids[i]].last_update = new Date();
                                }
                                cars[car_ids[i]].last_telemetry_id = car_telemetry.length - 1;
                            }
                        }
                    );

                }
            }
        });
    }

    function updateTrafficSignals() {
        for (let car_id in cars) {
            getLightersOnCurrentRoute(car_id, devicesData).then(traffic_signals => {
                for (let i in traffic_signals) {
                    let traffic_signal_id = traffic_signals[i].id;
                    if (traffic_signals[i].state && cars[car_id].traffic_signals_on_route && cars[car_id].traffic_signals_on_route[traffic_signal_id].getIcon() === trafficRedLight) {
                        logEvent('Traffic light change', JSON.stringify({'id': traffic_signal_id}));
                        cars[car_id].traffic_signals_on_route[traffic_signal_id].setIcon(trafficGreenLight);
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
        }, 400);
    };
    this.stop = () => {
        clearInterval(timer);
        for (let i in cars) {
            if (cars[i].simulation !== undefined)
                cars[i].simulation.stop();
        }
    };
}

function StartUpdating() {
    let _updater = new UpdateCarsData();

    this.start = () => {
        window.setInterval(checkForStart, 200);
        _updater.start();
    };
    this.stop = () => {
        _updater.stop();
        clearInterval(_updater);
    };

    function checkForStart() {
        for (let car_id in cars) {
            if (!cars[car_id]['isStarted'] && cars[car_id].canStart) {
                // cars[car_id].simulation.start();
                cars[car_id]['isStarted'] = true;
            }
        }
    }
}
