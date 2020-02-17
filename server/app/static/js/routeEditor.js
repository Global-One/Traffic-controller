const map = L.map('map').setView([50.423025, 30.514246], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var popup = L.popup();

let points = [];

function onMapClick(e) {
    let buttonHTML = `
        ${e.latlng.toString()}
        <br>
        <button id="addPoint" class="btn-outline-dark" onclick="addPoint(${e.latlng.lat}, ${e.latlng.lng});">Add to route</button>
    `;

    popup
        .setLatLng(e.latlng)
        .setContent(buttonHTML)
        .openOn(map);
}

function addPoint(lat, lng) {
    points[i] = [lat, lng, 50];
    let text = `
            <div id="point${i}">
                <div class="row align-middle align-items-center">
                    <span class="close fat align-middle" onclick="removePoint(this.parentElement.parentElement)"></span>
                    <h5 style="position: relative">
                        <a href="#" onclick="showPoint(${lat}, ${lng})">Point ${i}: </a>
                    </h5>
                </div>
                <p>
                    Latitude: ${lat};
                    <br>
                    Longitude: ${lng}
                </p>
                <div class="row">
                    <div class="col-md-6 col-lg-6 col-xl-4 justify-content-end">
                        <span>Speed: </span>
                        <span id="speedValue${i}" style="font-weight:bold;color:#4CAF50">50</span>
                    </div>
                    <div class="col-md-6 col-lg-6 col-xl-8 pl-0">
                        <input oninput="changeSpeed(this)" type="range" class="slider" id="speed${i}" min="0" max="130" value="50">
                    </div>
                </div>
            </div>
        `;
    i++;
    let x = $("#route-points");
    x.append(text);
    $("#control").scrollTop(x.height());
    map.closePopup();
}

function showPoint(lat, lng) {
    L.popup()
        .setLatLng([lat, lng])
        .setContent(
            `Latitude:    ${lat}
                <br>
                Longitude: ${lng}`)
        .openOn(map);
}

function removePoint(e) {
    let pos = e.id.slice(5, e.id.length);
    points.splice(pos, 1);
    for (let j = parseInt(pos) + 1; j < i; ++j) {
        let elem = $("#point" + j);
        elem[0].id = "point" + (j - 1);
        elem.children()[0].lastElementChild.lastElementChild.textContent = "Point " + (j - 1);
    }
    --i;
    $("#" + e.id).remove();
}

$("#export_json").click(function exportJSON() {

    function radToDeg(x) {
        return x * (180 / Math.PI);
    }

    function degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    function angleBetweenCoords(ll1, ll2) {
        let lat1 = ll1[0],
            lng1 = ll1[1],
            lat2 = ll2[0],
            lng2 = ll2[1];
        let
            dy = lat2 - lat1;
        let dx = Math.cos(degToRad(lat1)) * (lng2 - lng1);
        return radToDeg(Math.atan2(dy, dx));
    }

    function acceleration(index) {
        if (index >= points.length - 1)
            return 0;
        let distance = measure(points[index][0], points[index][1], points[index + 1][0], points[index + 1][1]);
        let speed0 = kphToMs(points[index][2]);
        let speed1 = kphToMs(points[index + 1][2]);
        return (Math.pow(speed1, 2) - Math.pow(speed0, 2)) / (2 * distance);
    }

    function download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    let dataArr = [];
    let course;
    points.forEach((value, index) => {
        course = (index === points.length - 1) ? course : angleBetweenCoords(value, points[index + 1]);
        let speed = (index === points.length - 1) ? 0 : value[2];
        let acc = acceleration(index);
        dataArr.push({
            "state": {
                "acceleration": acc,
                "course": course,
                "latitude": value[0],
                "longitude": value[1],
                "speed": speed
            }
        })
    });

    download("route.json", JSON.stringify(dataArr));
});

function changeSpeed(e) {
    let index = e.id.slice(5, e.id.length);
    let speed = parseInt($(e).val());
    $("#speedValue" + index).text(speed);
    if (points[index].length === 2)
        points[index].push(speed);
    else {
        points[index].pop();
        points[index].push(speed);
    }
}

var i = 0;
map.on('click', onMapClick);
