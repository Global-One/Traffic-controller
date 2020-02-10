const map = L.map('map').setView([50.4266541, 30.505516], 20);

const trafficGreenLight = L.icon({
        iconUrl: 'http://www.mediafire.com/convkey/7802/5kao4fhnsjs6ej3zg.jpg',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's locationr
    }),
    trafficRedLight = L.icon({
        iconUrl: 'http://www.mediafire.com/convkey/9c0e/zkjo440rz6s2y7rzg.jpg?size_id=2',

        iconSize: [18, 18], // size of the icon
        iconAnchor: [9, 9], // point of the icon which will correspond to marker's location
    });

let carIcon = L.icon({
    iconUrl: 'img/car.png',
    iconSize: [25, 50]
});

let carMarker = new L.Marker([50.4266541, 30.505516],
    {
        icon: carIcon,
        rotationAngle: 60,
        rotationOrigin: "center center",
        id: "car"
    });