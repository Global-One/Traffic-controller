const map = L.map('map').setView([50.423025, 30.514246], 16);

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
    iconSize: [25, 50],
    iconAnchor: [12, 25],
    popupAnchor: [0, 0]
});


let carMarker = new L.Marker([50.4278, 30.5112],
    {
        icon: carIcon,
        rotationAngle: 90,
        rotationOrigin: "center center",
        id: "car"
    });

carMarker.bindPopup(L.popup().setContent("Some text"));