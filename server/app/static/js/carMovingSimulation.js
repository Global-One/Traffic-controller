let upd;
let background_music = new Audio('http://dl160.y2mate.com/?file=M3R4SUNiN3JsOHJ6WWQ2a3NQS1Y5ZGlxVlZIOCtyZ05sdHd1emhFdlNvOEg2OFlMMHU2aGFQOWFFYU1abk5tbEhZNVZ1Qmo1UDkyYlkwbVB2NVFqZldPQTQ5NWcvRzNwNm9FMVRkeHpVMU9xdmV1enhYUWtyd0t3TFA3VVI3VlhlWEkxb0U5dW1Hdll4Zi9kclJ6NXYwS3BtRW1HWmlVMXBDNDBPZU9Cb3BoRWhXaUdTZGFxM29CVzZ5V1Q2NTlIenRtdDZWbWtqZU5uNjVJa0RoQTZJY1VObjUvdHovbmVvRk1Ralp4Qml4ajgrclgvVmNsbVNlT05iMnBqS0hBPQ%3D%3D');

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
