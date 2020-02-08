from flask import Flask, send_file
from flask_socketio import SocketIO, send, emit

# TODO: secret key
app = Flask(__name__, static_folder='static/', template_folder="templates/", static_url_path="")
sock = SocketIO(app)


@app.route('/')
def traffic_tracker():
    return send_file('templates/index.html')


@sock.on('connected')
def connected():
    print('Established connection with client!')


if __name__ == '__main__':
    FLASK_DEBUG = True
    sock.run(app)  # TODO: change default port?
