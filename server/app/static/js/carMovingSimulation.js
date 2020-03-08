var upd;

$("#start").click(() => {
    $.get("/simulation_status", {"status": "start"}, function (res) {
        logEvent("...", res);
    });

    getAllDevices(devicesData).then(devices => {
        for (device in devices) {
            $.get("/send_mqtt_data", {"device-id": devices[device]})
        }
    });
    startUpdating(upd);
});

$("#stop").click(() => {
    $.get("/simulation_status", {"status": "stop"}, function (res) {
        logEvent("...", res);
    });
    stopUpdating(upd);
});

function startUpdating(updater) {
    if (updater) stopUpdating(updater);
    updater = new StartUpdating();
    upd = updater
    updater.start();
    console.log("Starting!..");
}

function stopUpdating(updater) {
    updater.stop();
    console.log("Stopped.");
}
