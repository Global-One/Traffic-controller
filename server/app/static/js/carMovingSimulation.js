let upd;
let background_music = new Audio('audio/DejaVu.mp3');

$("#start").click(() => {
    let deviceID = $('#marker_id').val();
    cars[deviceID].canStart = true;
    $.get("/send_mqtt_data", {"device-id": deviceID});
    startUpdating(upd);
    background_music.play();
    background_music.loop = true;
});

$("#stop").click(() => {
    // stopUpdating(upd);
    getAllDevices(devicesData).then(devices => {
        for (let device in devices) {
            $.get("/stop_mqtt_data", {"device-id": devices[device]});
        }
    });
    background_music.pause();
});

function startUpdating(updater) {
    if (updater) {
        stopUpdating(updater);
    } else {
        upd = new StartUpdating();
    }
    upd.start();
    logEvent("Starting!..");
}

function stopUpdating(updater) {
    logEvent("Stopped.");
    if (updater) updater.stop();
    upd = null;
    upd = new StartUpdating();
}
