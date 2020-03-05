import json
from os import getenv
from threading import Lock

from flask import Flask, render_template, request
from flask_socketio import SocketIO
from requests import get

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


@app.route('/build_route')
def build_route():
    # КОСТЫЛЬ, нужно как-то передавать айди девайса
    return server.app.build_route.build_route(request, 'mqtt-001')


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
