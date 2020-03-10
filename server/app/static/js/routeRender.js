// сreates context menu on right mouse click on map
map.on('contextmenu', (e) => {
    let tdiv =
        `
        <div class="list-group pl-0">
            <button id="direction_from" onclick="direction_from(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1" disabled>Direction from here</button>
            <button id="direction_to" onclick="direction_to(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1">Direction to here</button>
            <button id="center_map" onclick="center_map(${e.latlng.lat}, ${e.latlng.lng})" class="list-group-item list-group-item-action p-1">Center map here</button>
        </div>
        `
    ;
    let disabled = $('#route_builder').hasClass('invisible');
    if (disabled) {
        let jdiv = $(tdiv);
        jdiv.find("#direction_to").attr('disabled', 'disabled');
        tdiv = jdiv.html();
    }
    let tpopup = L.popup({closeButton: false})
        .setLatLng(e.latlng)
        .setContent(tdiv)
        .openOn(map);
    $(tpopup._container).css({'top': '0px', 'left': '0px', 'margin': '0px'});
    $($($(tpopup._container).children()[0]).children()[0]).css({'margin': '0px'});
    $('.leaflet-popup-content-wrapper').css({'background': 'none', 'box-shadow': 'none'});
    $('.leaflet-popup-tip-container').css({'visibility': 'hidden', 'display': 'none'});
});

map.on('click', () => {
    let disabled = $('#route_builder').addClass('invisible');
});

function center_map(lat, lng) {
    map.panTo([lat, lng]); // we can use this on to center map on car
    map.closePopup();
}

function direction_from(lat, lng) {
    map.closePopup();
    $('#route_start').val(`${lat}, ${lng}`)
}

function direction_to(lat, lng) {
    map.closePopup();
    $('#route_finish').val(`${lat}, ${lng}`);

    let empty = false;
    $('.route-input input').each(function () {
        if ($(this).val().length == 0) {
            empty = true;
        }
    });

    if (empty) {
        $('#build_route').attr('disabled', 'disabled');
    } else {
        $('#build_route').attr('disabled', false);
    }
}

// shows the loading animation and disables page while route is being built
//$(document).bind("ajaxSend", function () {
//    $("#loading").css('display', 'block');
//}).bind("ajaxComplete", function () {
//    $("#loading").hide();
//});

$('#build_route').click(() => {
    // let latLng = cars[$('#route_builder').find('#marker_id').val()].marker.getLatLng();
    // $("#route_start").val(`${latLng.lat}, ${latLng.lng}`);
    let start = $("#route_start").val();
    let finish = $('#route_finish').val();

    $("#loading").css('display', 'block');

    $.ajax(`/build_route?
    origins=${start.replace(', ', ',')}&
    destinations=${finish.replace(', ', ',')}`).done(
        (data) => {
            let deviceID = $('#marker_id').val();
            data['device_id'] = deviceID; // device-id
            // data['device_id'] = 'mqtt-002';
            $.ajax({
                type: "POST",
                async: false,
                url: '/to_firebase',
                dataType: 'json',
                data: JSON.stringify(data),
                contentType: 'application/json'
            });

            let route_nodes = new Array(Object.keys(data['nodes']).length);

            let i = 0;
            for (let node_id in data['nodes']) {
                route_nodes[i] = {'lat': data['nodes'][node_id]['lat'], 'lng': data['nodes'][node_id]['lng']};
                i++;
            }

            show_route(route_nodes, data.duration, data.distance, deviceID);
            show_route_traffic_signals(data['traffic_signals'], deviceID);
            $("#loading").hide();
            $('#reverse_route').attr('disabled', false);
            logEvent("Route was built")
            $('#buttons button').attr('disabled', false);
        });
});

function show_route(route_nodes, duration, distance, deviceID) {
    if (cars[deviceID].routeLine) map.removeLayer(cars[deviceID].routeLine);
    let routeLine = L.polyline(route_nodes).addTo(map);
    routeLine.bindPopup(`
        <b>Duration: </b>${(duration / 60.0).toFixed(0)} minutes<br>
        <b>Distance: </b>${(distance / 1000).toFixed(2)} km
    `);
    cars[deviceID].routeLine = routeLine;
}

let traffic_signals_on_route = {};

// here could be some bugs
function show_route_traffic_signals(traffic_signals_nodes, deviceID) {
    if (cars[deviceID].traffic_signals_on_route) {
        for (let signal in traffic_signals_on_route) {
            map.removeLayer(cars[deviceID].traffic_signals_on_route[signal]);
        }
    }
    for (let traffic_signal_id in traffic_signals_nodes) {
        let traffic_light = new L.Marker(traffic_signals_nodes[traffic_signal_id], {icon: trafficRedLight});
        traffic_signals_on_route[traffic_signals_nodes[traffic_signal_id].id] = traffic_light.addTo(map);
    }
    cars[deviceID].traffic_signals_on_route = traffic_signals_on_route;
}

function enableTrafficSignal(trafficSignalMarker) {
    trafficSignalMarker.setIcon(trafficGreenLight);
}

function disableTrafficSignal(trafficSignalMarker) {
    trafficSignalMarker.setIcon(trafficRedLight);
}
