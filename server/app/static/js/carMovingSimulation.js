let upd;

$("#start").click(() => {
    let deviceID = $('#marker_id').val();
    cars[deviceID].canStart = true;
    $.get("/send_mqtt_data", {"device-id": deviceID});
    startUpdating(upd);
});

$("#stop").click(() => {
    getAllDevices(devicesData).then(devices => {
        for (let device in devices) {
            $.get("/stop_mqtt_data", {"device-id": devices[device]});
            logEvent("Stopped.");
        }
    });
});

function startUpdating(updater) {
    // if (updater) stopUpdating(updater);
    updater = new StartUpdating();
    upd = updater;
    updater.start();
    logEvent("Starting!..");
}
