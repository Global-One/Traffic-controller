function kphToMs(speed) {
    return speed / 3.6;
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function metersToLat(y) {
    //Earth’s radius, sphere
    let R = 6378137;

    //Coordinate offsets in radians
    let dLat = y / R;

    return dLat * 180 / Math.PI;
}

function metersToLng(x) {
    //Earth’s radius, sphere
    let R = 6378137;

    //Coordinate offsets in radians
    let dLng = x / R;

    return dLng * 180 / Math.PI * 1.48;
}

//https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
function measure(lat1, lon1, lat2, lon2) {  // generally used geo measurement function
    const R = 6378.137; // Radius of earth in KM
    let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d * 1000; // meters
}
