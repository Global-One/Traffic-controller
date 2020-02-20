import json
from os import getenv
from threading import Lock

from flask import Flask, render_template, request
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='static/', template_folder="templates/", static_url_path="")
# TODO: secret key
app.config['SECRET_KEY'] = 'secret!'
# TODO: use 'eventlet' instead
socketio = SocketIO(app, async_mode='eventlet')
# SSLify(app)

thread = None
thread_lock = Lock()


def background_thread():
    """Example of how to send server generated events to clients."""
    global thread
    print("File reading...")
    with open("server/route.json") as f:
        data = json.loads(f.read())
        for state in data:
            socketio.emit('move_car', {"event_name": "Change state", "data": state}, namespace='/test')
            socketio.sleep(0.5)
    thread = None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/route_editor')
def route_editor():
    return render_template('routeEditor.html')


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
    if list(request.args.keys()):
        data = request.args
    else:
        data = request.get_json()
    socketio.emit('move_car',
                  {'event_name': 'Server generated event',
                   'data': data},
                  namespace='/test')
    return json.dumps({'success': True}), 200


@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    with thread_lock:
        thread = socketio.start_background_task(background_thread)
    print("Connected!!")


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=getenv('PORT', 443))
    # FLASK_DEBUG = 1
    # app.debug = True
    # app.config['DEBUG'] = True
    # app.run(debug=True)
