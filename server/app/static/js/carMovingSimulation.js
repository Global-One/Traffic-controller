let upd;

$("#start").click(() => {
    getAllDevices(devicesData).then(devices => {
        for (device in devices) {
            $.get("/send_mqtt_data", {"device-id": devices[device]})
        }
    });
    startUpdating(upd);
});

$("#stop").click(() => {
    getAllDevices(devicesData).then(devices => {
        for (device in devices) {
            $.get("/stop_mqtt_data", {"device-id": devices[device]})
        }
    });
    stopUpdating(upd);
});

function startUpdating(updater) {
    if (updater) stopUpdating(updater);
    updater = new StartUpdating();
    upd = updater;
    updater.start();
    logEvent("Starting!..");
}

function stopUpdating(updater) {
    updater.stop();
    logEvent("Stopped.");
}
