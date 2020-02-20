function Move() {
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
        let latlng = L.latLng(value[0], value[1]);
        carMarker.setLatLng(latlng);
        map.panTo(latlng);
        carMarker.setRotationAngle(90 - _data["state"]["course"]);
    }

    function start(data, seconds = 0) {
        _data = data;

        i = 0;
        fps = 60;
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