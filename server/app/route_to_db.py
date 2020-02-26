import json
from os import getenv, environ

import firebase_admin
from firebase_admin import credentials, db


def add_route_to_db(request):
    """
    Function to add route which was built for some device to Firebase Database
    :param r: Flask request that contains json with route info:
    {
        "device_id": int
        "nodes": [
            {
              "id": ...
              "lat": ...
              "lng": ...
            },
            ...
        ],
        "traffic_signals" : [
            {
                "id": int
                "lat": double
                "lng": double
                "state": bool
            },
            ...
        ],
        "duration": time in seconds,
        "distance": distance in meters
    }
    :return: str with json wrote to db or 'Bad request'
    """
    route_json = request.get_json()

    json_cred = {
        "type": getenv('type'),
        "project_id": getenv('project_id'),
        "private_key_id": getenv('private_key_id'),
        "private_key": getenv('private_key').replace('\\n', '\n'),
        "client_email": getenv('client_email'),
        "client_id": getenv('client_id'),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": getenv('client_x509_cert_url')
    }
    cred = credentials.Certificate(json_cred)
    firebase_app = firebase_admin.initialize_app(cred, options={
        'databaseURL': 'https://vibrant-vector-260112.firebaseio.com/'
    })
    if route_json and route_json.get('device_id') and route_json.get('nodes') and route_json.get('traffic_signals'):
        ref = db.reference('devices', firebase_app)
        device_id = route_json['device_id']
        device = ref.child(device_id)
        routes = device.get('routes')
        if routes[0]:
            route = device.child('routes').child(str(len(routes[0]['routes'])))
        else:
            route = device.child('routes').child('0')
        del routes

        nodes = route.child('nodes')
        for node in route_json['nodes']:
            nodes.child(str(node['id'])).set(node)

        traffic_signals = route.child('traffic_signals')
        for traffic_signal in route_json['traffic_signals']:
            traffic_signals.child(str(traffic_signal['id'])).set(traffic_signal)

        route.child('duration').set(route_json['duration'])
        route.child('distance').set(route_json['distance'])

        firebase_admin.delete_app(firebase_app)
        return f'Updated route for {device_id}', 200
    else:
        firebase_admin.delete_app(firebase_app)
        return 'Bad request', 400


##########################################################
def set_env(path_to_json_file: str):
    """
    Function to test code above in the local machine.
    Writes needed values to environmental variables.
    :param path_to_json_file: file with credentials in json
    """
    json_file = json.loads(open(path_to_json_file).read())
    for key in json_file:
        environ[key] = json_file[key]


##########################################################


if __name__ == '__main__':
    set_env("vibrant-vector-260112-firebase-adminsdk-jctte-87328d93d5.json")
