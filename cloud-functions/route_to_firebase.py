import json
from os import getenv, environ

import firebase_admin
from firebase_admin import credentials, db


# from server.app.db.db_initialize import firebase_app


def add_route_to_db(request):
    """
    Function to add route which was built for some device to Firebase Database
    :param request: Flask request that contains json with route info:
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
    cred = credentials.Certificate(json.loads(getenv("FIREBASE_CRED")))
    firebase_app = firebase_admin.initialize_app(cred, options={
        'databaseURL': 'https://green-waves.firebaseio.com/'
    }, name="ROUTE")
    print(type(route_json), route_json)
    if route_json and route_json.get('device_id') and route_json.get('nodes') and route_json.get(
            'traffic_signals') is not None:
        ref = db.reference('devices', firebase_app)
        device_id = route_json['device_id']
        device = ref.child(device_id)
        last_route_id = device.get('last_route_id')[0].get('last_route_id', -1) + 1 if device.get('last_route_id')[
            0] else 0
        print('id', last_route_id)
        device.child('last_route_id').set(last_route_id)
        # routes = device.get('routes')
        route = device.child('routes').child(str(last_route_id))

        nodes = route.child('nodes')
        i = 0
        for node in route_json['nodes']:
            nodes.child(str(i)).set(node)
            i += 1

        traffic_signals = route.child('traffic_signals')
        i = 0
        for traffic_signal in route_json['traffic_signals']:
            traffic_signals.child(str(i)).set(traffic_signal)
            i += 1

        route.child('duration').set(route_json.get('duration', ""))
        route.child('distance').set(route_json.get('distance', ""))

        firebase_admin.delete_app(firebase_app)
        return f'Updated route for {device_id}', 200
    else:
        firebase_admin.delete_app(firebase_app)
        error = 'Bad request: %s%s%s%s not presented' % (
            'no data' if not route_json else '',
            'no device id' if not route_json and not route_json.get('device_id') else '',
            'no nodes' if not route_json and not route_json.get('nodes') else '',
            'no traffic signals' if not route_json and not route_json(
                'traffic_signals') else '')
        print(error)
        return error, 400
