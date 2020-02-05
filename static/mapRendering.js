var map = L.map('map').setView([50.4266541, 30.505516], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var trafficGreenLight = L.icon({
        iconUrl: 'http://www.mediafire.com/convkey/7802/5kao4fhnsjs6ej3zg.jpg',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's locationr
    }),
    trafficRedLight = L.icon({
        iconUrl: 'http://www.mediafire.com/convkey/9c0e/zkjo440rz6s2y7rzg.jpg?size_id=2',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's location
    });

window.onload = function (e) {
    let xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open("POST", "https://lz4.overpass-api.de/api/interpreter");
    var request =
        '<osm-script output="json" output-config="" timeout="25">' +
        '<id-query type="area" ref="3600421866" into="searchArea"/>' +
        '<union>' +
        '<query type="node">' +
        '<has-kv k="highway" v="traffic_signals"/>' +
        '<area-query from="searchArea"/>' +
        '</query>' +
        '</union>' +
        '<print geometry="skeleton" ids="yes" mode="body" order="id"/>' +
        '<recurse type="down"/>' +
        '<print geometry="skeleton" ids="yes" mode="skeleton" order="quadtile"/>' +
        '</osm-script>';
    request = (new DOMParser).parseFromString(request, "text/xml");
    console.log(request);
    xhr.send(request);
    xhr.onload = () => {
        if (xhr.status === 200) {
            let data = xhr.response;
            console.log(data.osm3s.timestamp_osm_base);
            addMarkers(data);
        }
    }
}

function addMarkers(data) {
    var trafficLights = data.elements;

    trafficLights.forEach(element => {
        let state = Math.floor(Math.random() * 100);

        if (state % 2 === 0)
            var marker = L.marker([element.lat, element.lon], {icon: trafficGreenLight})
        else
            var marker = L.marker([element.lat, element.lon], {icon: trafficRedLight})
        marker.addTo(map).on('click', changeColor);
        marker.bindPopup("<b>Traffic light</b><br>#" + marker.getLatLng().toString());
        var counter = new Counter(marker, 6000);
        counter.start();
    });
}

function changeColor(e) {
    marker = e.target.getIcon();
    if (marker.options.iconUrl === trafficGreenLight.options.iconUrl)
        e.target.setIcon(trafficRedLight);
    else
        e.target.setIcon(trafficGreenLight);
}

function Counter(marker, delay) {
    var interval;

    function changeColor() {
        if (marker.options.icon.options.iconUrl === trafficGreenLight.options.iconUrl)
            marker.setIcon(trafficRedLight);
        else
            marker.setIcon(trafficGreenLight);
    }

    function run() {
        changeColor();
    }

    function start() {
        interval = window.setInterval(run, delay);
    }

    // exports
    // This actually creates a function that our counter can call
    // you'll see it used below.
    //
    // The other functions above cannot be accessed from outside
    // this function.
    this.start = start;
}