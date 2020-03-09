const map = L.map('map').setView([50.423025, 30.514246], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    zoom: 15,
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})
    .addTo(map);

// show the scale bar on the lower left corner
L.control.scale()
    .addTo(map);

// this firebase has read-only unauthorised access
firebase.initializeApp({databaseURL: "https://green-waves.firebaseio.com"});
// reference to node with device data
let devicesData = firebase.database().ref('devices');

// prepared icons for traffic lights
const trafficGreenLight = L.icon({
        iconUrl: 'img/green-light.png',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's locationr
    }),
    trafficRedLight = L.icon({
        iconUrl: 'img/red-light.png',

        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });

