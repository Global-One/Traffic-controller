import json
from os import getenv
from threading import Lock

import requests
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from requests import get
import osmapi
from time import sleep

import server
from server.app.build_route import build_route
from server.app.mqtt.mqtt_device import send_data_from_device

app = Flask(__name__, static_folder='static/', template_folder="templates/", static_url_path="")
# TODO: secret key
app.config['SECRET_KEY'] = 'secret!'
# TODO: use 'eventlet' instead
socketio = SocketIO(app, async_mode=None)
# SSLify(app)

thread = None
thread_lock = Lock()


def background_thread(device_id):
    """Example of how to send server generated events to clients."""
    global thread
    print(device_id)
    send_data_from_device(device_id)
    thread = None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/route_editor')
def route_editor():
    return render_template('routeEditor.html')


@app.route('/get_route')
def get_route():
    with open('data.json') as f:
        data = json.load(f)
    print(type(data))
    return data


@app.route('/simulation_status')
def get_javascript_data():
    status = request.args.get("status")
    if status == 'start':
        socketio.emit('start_simulation', namespace='/test')
        return json.dumps({'Simulation status': status}), 200, {'ContentType': 'application/json'}
    elif status == 'stop':
        socketio.emit('stop_simulation', namespace='/test')
        return json.dumps({'Simulation status': status}), 200, {'ContentType': 'application/json'}
    else:
        return json.dumps({'Simulation status': "undefined"}), 404, {'ContentType': 'application/json'}


@app.route("/update_position", methods=["POST"])
def update_position():
    data = request.get_json()
    latitude = data['state']['latitude']
    longitude = data['state']['longitude']
    response = get(r"https://us-central1-green-waves.cloudfunctions.net/traffic-light-colour-changer",
                   params={"latitude": latitude,
                           "longitude": longitude})
    socketio.emit('move_car',
                  {'event_name': 'Server generated event',
                   'data': data},
                  namespace='/test')
    traffic_light = response.text
    print(response)
    print(traffic_light)
    return json.dumps({'success': True}), 200


@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    # with thread_lock:
    #     thread = socketio.start_background_task(background_thread)
    print("Connected!!")


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

@app.route('/to_firebase', methods=["POST"])
def send_route_to_firebase():
    url = 'https://us-central1-green-waves.cloudfunctions.net/route_to_firebase'
    payload = request.get_json()
    headers = {'content-type': 'application/json'}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(payload)
    print(response)
    return json.dumps({'success': True}), 200

@app.route('/build_route')
def build_route():
    """
    Function can be called with ?origins=lat,lng&destinations=lat,lng request
    """
    lat1, lng1, lat2, lng2 = [float(y) for x in request.args for y in request.args[x].split(',')]
    api_request_url = f'http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}' \
                      f'?alternatives=false&annotations=nodes'
    response = json.loads(get(api_request_url).content.decode())
    while response.get('message') == "Too Many Requests":
        print('Pending...')
        response = json.loads(get(api_request_url).content.decode())
        sleep(0.2)

    if response['code'] == 'NoRoute':
        return response

    api = osmapi.OsmApi()
    nodes_dict = {}
    traffic_signals_dict = {}
    data = response['routes'][0]['legs'][0]
    all_nodes_data = api.NodesGet(data['annotation']['nodes'])
    for node_date in all_nodes_data.values():
        if 'highway' in node_date.get('tag') and node_date['tag']['highway'] == 'traffic_signals':
            traffic_signals_dict[node_date['id']] = {'id': node_date['id'], 'lat': node_date['lat'],
                                                     'lng': node_date['lon'],
                                                     'state': False}
        else:
            nodes_dict[node_date['id']] = {'id': node_date['id'], 'lat': node_date['lat'], 'lng': node_date['lon']}

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

    result_data = {'nodes': nodes_list, "traffic_signals": traffic_signals_list, 'duration': data['duration'],
                   'distance': data['distance']}

    return result_data

    # КОСТЫЛЬ, нужно как-то передавать айди девайса
    # return server.app.build_route.build_route(request, 'mqtt-001')

server.app.build_route.set_env("server/green-waves-firebase-adminsdk.json")

@app.route('/send_mqtt_data')
def send_mqtt_data():
    send_data_from_device(request.args.get('device_id'))
    # global thread
    # with thread_lock:
    #     if thread is None:
    #         thread = socketio.start_background_task(background_thread, request.args.get('device_id'))
    #     thread = socketio.start_background_task(background_thread, request.args.get('device_id'))
    return ''

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=getenv('PORT', 5000))
    # FLASK_DEBUG = 1
    # app.debug = True
    # app.config['DEBUG'] = True
    # app.run(debug=True)
