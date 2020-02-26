map.on('contextmenu', (e) => {
    let tdiv =
        `
<!--        <div class="btn-group-vertical">-->
<!--            <button class="btn btn-light btn-sm">Direction from here</button>-->
<!--            <button class="btn btn-light btn-sm">Direction to here</button>-->
<!--            <button class="btn btn-light btn-sm">Center map here</button>-->
<!--        </div>-->
        <div class="list-group pl-0">
            <button id="direction_from" onclick="direction_from(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1">Direction from here</button>
            <button id="direction_to" onclick="direction_to(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1">Direction to here</button>
            <button id="center_map" onclick="center_map(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1">Center map here</button>
        </div>
    `;
    let tpopup = L.popup({closeButton: false})
        .setLatLng(e.latlng)
        .setContent(tdiv)
        .openOn(map);
    $(tpopup._container).css({'top': '0px', 'left': '0px', 'margin': '0px'});
    $($($(tpopup._container).children()[0]).children()[0]).css({'margin': '0px'});
    $('.leaflet-popup-content-wrapper').css({'background': 'none', 'box-shadow': 'none'});
    $('.leaflet-popup-tip-container').css({'visibility': 'hidden', 'display': 'none'});
});

function center_map(lat, lng) {
    map.panTo([lat, lng]);
    map.closePopup();
}

function direction_from(lat, lng) {
    map.closePopup();
    $('#route_origins').val(`${lat}, ${lng}`)
}

function direction_to(lat, lng) {
    map.closePopup();
    $('#route_destinations').val(`${lat}, ${lng}`)
}

$('#reverse_route').click(() => {
    let origins = $("#route_origins").val();
    let destinations = $('#route_destinations').val();
    $("#route_origins").val(destinations);
    $('#route_destinations').val(origins)
});

$(document).bind("ajaxSend", function () {
    $("#loading").css('display', 'block');
}).bind("ajaxComplete", function () {
    $("#loading").hide();
});

$('#show_route').click(() => {
    let origins = $("#route_origins").val();
    let destinations = $('#route_destinations').val();
    console.log(origins, destinations);

    $.ajax(`/test?origins=${origins.replace(', ', ',')}&destinations=${
        destinations.replace(', ', ',')}`).done(
        // $.get('/get_route',
        (data) => {
            route_data = data['nodes'];
            let route_nodes_length = Object.keys(route_data).length;
            route_nodes = new Array(route_nodes_length);

            let i = 0;
            for (node_id in route_data) {
                // for (let i = 0; i < route_nodes_length; ++i){
                // console.log(node_id);
                route_nodes[i] = {'lat': route_data[node_id]['lat'], 'lng': route_data[node_id]['lng']};
                // console.log([route_nodes[i]['lat'], route_nodes[i]['lng']]);
                // let nodeMarker = new L.Marker([route_nodes[i].lat, route_nodes[i].lng]);
                // nodeMarker.addTo(map);
                // nodeMarker.bindPopup("<b>Node #" + route_data.id + " </b><br>" + nodeMarker.getLatLng().toString());
                ++i;
            }

            routeLine = L.polyline(route_nodes).addTo(map);
            routeLine.bindPopup(`<b>Duration: </b>${(data.duration / 60.0).toFixed(0)} minutes
                            <br>
                            <b>Distance: </b>${(data.distance / 1000).toFixed(2)} km`);
            console.log(routeLine);
            let traffic_signals = [];
            for (let traffic_signal in data['traffic_signals']) {
                let traffic_light = new L.Marker(data['traffic_signals'][traffic_signal], {icon: trafficRedLight}).addTo(map)
            }
        })
});