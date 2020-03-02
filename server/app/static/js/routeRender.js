// Creates context menu on right mouse click on map
map.on('contextmenu', (e) => {
    let tdiv =
        `
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

// Function to swap origin and destination coordinates
$('#reverse_route').click(() => {
    let origins = $("#route_origins").val();
    let destinations = $('#route_destinations').val();
    $("#route_origins").val(destinations);
    $('#route_destinations').val(origins)
});


// It shows the loading animation and disables page while route is being built
$(document).bind("ajaxSend", function () {
    $("#loading").css('display', 'block');
}).bind("ajaxComplete", function () {
    $("#loading").hide();
});

$('#show_route').click(() => {
    let origins = $("#route_origins").val();
    let destinations = $('#route_destinations').val();

    $.ajax(`/build_route?origins=${origins.replace(', ', ',')}&destinations=${
        destinations.replace(', ', ',')}`).done(
        (data) => {
            let route_data = data['nodes'];
            console.log(typeof route_data);

            let post_data = data;
            post_data['device_id'] = 'mqtt-001';
            $.ajax({
                type: "POST",
                url: '/to_firebase',
                dataType: 'json',
                data: JSON.stringify(post_data),
                contentType: 'application/json'
            });

            let route_nodes = new Array(Object.keys(route_data).length);

            let i = 0;
            for (let node_id in route_data) {
                route_nodes[i] = {'lat': route_data[node_id]['lat'], 'lng': route_data[node_id]['lng']};
                ++i;
            }

            show_route(route_nodes, data.duration, data.distance);
            console.log(routeLine);
            show_route_traffic_signals(data['traffic_signals']);
        })
});

function show_route(route_nodes, duration, distance) {
    routeLine = L.polyline(route_nodes).addTo(map);
    routeLine.bindPopup(`<b>Duration: </b>${(duration / 60.0).toFixed(0)} minutes
                            <br>
                            <b>Distance: </b>${(distance / 1000).toFixed(2)} km`);
}

var traffic_signals_on_route = {};

function show_route_traffic_signals(traffic_signals_nodes) {
    for (let traffic_signal_id in traffic_signals_nodes) {
        let traffic_light = new L.Marker(traffic_signals_nodes[traffic_signal_id], {icon: trafficRedLight}).addTo(map);
        traffic_signals_on_route[traffic_signals_nodes[traffic_signal_id].id] = traffic_light;
        traffic_light['setEnabled'] = enableTrafficSignal;
        traffic_light.addTo(map);
    }
}

function enableTrafficSignal(trafficSignalMarker) {
    trafficSignalMarker.setIcon(trafficGreenLight);
}

function disableTrafficSignal(trafficSignalMarker) {
    trafficSignalMarker.setIcon(trafficRedLight);
}