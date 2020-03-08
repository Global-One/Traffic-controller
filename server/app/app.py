from os import getenv
from json import loads, dumps
from time import sleep

from requests import get, post
from flask import Flask, render_template, request

from osmapi import OsmApi

from mqtt import send_data_from_device

osm_api = OsmApi()

app = Flask(__name__, static_folder='static/', template_folder="templates/")

# TODO: secret key
app.config['SECRET_KEY'] = 'secret!'


@app.route('/')
def index():
    """
    Root route
    :return: index.html
    """
    return render_template('index.html')


@app.route('/simulation_status')
def simulation_status():
    status = request.args.get("status")
    if status == 'start':
        return dumps({'status': status}), 200, {'ContentType': 'application/json'}
    elif status == 'stop':
        return dumps({'status': status}), 200, {'ContentType': 'application/json'}
    else:
        return dumps({'status': "undefined"}), 404, {'ContentType': 'application/json'}


@app.route("/update_position", methods=["POST"])
def update_position():
    """
    update position and traffic light state
    :return: response
    """

    return str(get(
        url='https://us-central1-green-waves.cloudfunctions.net/traffic-light-colour-changer',
        params={
            "latitude": request.get_json()['state']['latitude'],
            "longitude": request.get_json()['state']['longitude']
        }
    ))


@app.route('/to_firebase', methods=["POST"])
def send_route_to_firebase():
    """
    write route to database
    :return: response
    """

    return str(post(
        url='https://us-central1-green-waves.cloudfunctions.net/route_to_firebase',
        data=dumps(request.get_json()),
        headers={'content-type': 'application/json'}
    )), 200

@app.route('/build_route')
def build_route():
    """
    /build_route?origins=lat,lng&destinations=lat,lng
    :return: result
    """

    lat1, lng1, lat2, lng2 = [float(y) for x in request.args for y in request.args[x].split(',')]
    api_request_url = f'http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}' \
                      f'?alternatives=false&annotations=nodes'

    response = loads(get(api_request_url).content.decode())

    while response.get('message') == "Too Many Requests":
        response = loads(get(api_request_url).content.decode())
        sleep(0.2)

    if response['code'] == 'NoRoute':
        return response  # handle this situation properly

    nodes_dict = {}
    traffic_signals_dict = {}

    data = response['routes'][0]['legs'][0]

    for node_data in osm_api.NodesGet(data['annotation']['nodes']).values():
        if 'highway' in node_data.get('tag') and node_data['tag']['highway'] == 'traffic_signals':
            traffic_signals_dict[node_data['id']] = {'id': node_data['id'], 'lat': node_data['lat'],
                                                     'lng': node_data['lon'],
                                                     'state': False}
        else:
            nodes_dict[node_data['id']] = {'id': node_data['id'], 'lat': node_data['lat'], 'lng': node_data['lon']}

    nodes_list = []
    traffic_signals_list = []

    for node_id in data['annotation']['nodes']:
        if nodes_dict.get(node_id):
            nodes_list.append(nodes_dict[node_id])
        else:
            nodes_list.append(traffic_signals_dict[node_id])
    for traffic_signal_id in data['annotation']['nodes']:
        if traffic_signals_dict.get(traffic_signal_id):
            traffic_signals_list.append(traffic_signals_dict[traffic_signal_id])

    return {
        "nodes": nodes_list,
        "traffic_signals": traffic_signals_list,
        'duration': data['duration'],
        'distance': data['distance']
    }


@app.route('/send_mqtt_data')
def send_mqtt_data():
    """
    Start mqtt simulation
    :return: None
    """

    send_data_from_device(request.args.get('device-id', 'mqtt-001'))
    return 'mqtt running'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=getenv('PORT', 5000), debug=True)
