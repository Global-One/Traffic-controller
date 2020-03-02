const map = L.map('map').setView([50.423025, 30.514246], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    zoom: 15,
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
// show the scale bar on the lower left corner
L.control.scale().addTo(map);

firebase.initializeApp({databaseURL: "https://green-waves.firebaseio.com"});
let devicesData = firebase.database().ref('devices');

const trafficGreenLight = L.icon({
        iconUrl: 'img/green-light.png',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's locationr
    }),
    trafficRedLight = L.icon({
        iconUrl: 'img/red-light.png',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's location
    });

let carIcon = L.icon({
    iconUrl: 'img/car.png',
    iconSize: [35, 35],
    iconAnchor: [17.5, 17.5],
    popupAnchor: [0, 0]
});


// let carMarker = new L.Marker([50.4278, 30.5112],
//     {
//         icon: carIcon,
//         rotationAngle: 90,
//         rotationOrigin: "center center",
//         id: "car",
//         draggable: true
//     });
//
// let carMarker2 = new L.Marker([50.4278, 30.5125],
//     {
//         icon: carIcon,
//         rotationAngle: 90,
//         rotationOrigin: "center center",
//         id: "car",
//         draggable: true
//     });

// var lastPos;
// carMarker.on('drag', function (event) {
//     var marker = event.target;
//     var position = marker.getLatLng();
//     console.log(map.getBounds().getNorth(), position.lat);
//     if (position.lat < map.getBounds().getSouth() || position.lat > map.getBounds().getNorth() ||
//         position.lng < map.getBounds().getWest() || position.lng > map.getBounds().getEast()) {
//         $('html').css({'cursor': 'not-allowed'});
//         console.log("OUT");
//         marker.setLatLng(lastPos)
//     } else {
//         lastPos = position;
//         marker.setLatLng(new L.LatLng(position.lat, position.lng), {draggable: 'true'});
//     }
// });

// carMarker.bindPopup(L.popup().setContent("Some text"));