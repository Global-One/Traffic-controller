from flask import Flask, send_file, render_template, request
from flask_socketio import SocketIO, send, emit

import json
from threading import Lock

# from firebase import get_all_data, set_env

# TODO: secret key
app = Flask(__name__, static_folder='static/', template_folder="templates/", static_url_path="")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=None)

thread = None
thread_lock = Lock()


def background_thread():
    """Example of how to send server generated events to clients."""
    count = 0
    while True:
        socketio.sleep(2)
        count += 1
        print(count)
        socketio.emit('move_car',
                      {"event_name": 'Server generated event',
                       'data': {'speed': 0,
                                'lon': 0, 'lng': 0}},
                      namespace='/test')


@app.route('/')
def index():
    return render_template('index.html')


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
        if thread is None:
            thread = socketio.start_background_task(background_thread)
    print("Connected!!")
    emit('on_connect', {'data': 'Connected'})


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')


if __name__ == '__main__':
    socketio.run(app)
