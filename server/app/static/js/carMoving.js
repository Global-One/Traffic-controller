let pin_to_car = "";

// function to swap origin and destination coordinates
$('#reverse_route').click(() => {
    if (pin_to_car != "") {
        pin_to_car = ""
    } else {
        pin_to_car = $('#marker_id').val();
    }
});

function Move(marker, idshnik) {
    let i;
    let fps;
    let carPos;
    let loop, mLoops;
    let timer;
    let x;
    let y;
    let _data;

    function calculateCoords(data, fps = 30, loop = 0) {
        let carPos = [];
        for (let i = 0; i < fps; ++i) {
            let state = data["state"];
            let course = degToRad(state["course"]);
            let speed = kphToMs(state["speed"]);
            let acceleration = state["acceleration"];
            let t = (loop + i / fps);
            let ax = acceleration * Math.cos(course);
            let ay = acceleration * Math.sin(course);
            let my = speed * Math.sin(course) * t + ay * t * t / 2;
            let mx = speed * Math.cos(course) * t + ax * t * t / 2;
            carPos[i % (fps + 1)] = [
                state["latitude"] + metersToLat(my),
                state["longitude"] + metersToLng(mx)
            ]
        }
        return carPos;
    }

    function nexLonLng() {
        if (i >= fps) {
            ++loop;
            if (loop > mLoops && mLoops !== -1) {
                stop();
                return;
            }
            carPos = calculateCoords(_data, fps, loop);
            i = 0;
        }
        let value = carPos[i++];
        x = value[0];
        y = value[1];
        $('#route_start').val(`${x}, ${y}`)
        if (pin_to_car == idshnik) map.panTo([x, y]);
        let latlng = L.latLng(x, y);
        marker.setLatLng(latlng);
        //marker.setRotationAngle(90 - _data["state"]["course"]);
        marker.setRotationAngle(0);
    }

    function start(data, seconds = 0) {
        stop();
        _data = data;

        i = 0;
        fps = 30;
        carPos = calculateCoords(data, fps);
        loop = 0;
        mLoops = seconds - 1;
        timer = window.setInterval(run, 1000 / fps);
    }

    function run() {
        nexLonLng();
    }

    function stop() {
        clearInterval(timer);
    }

    this.start = start;
    this.stop = stop;
}