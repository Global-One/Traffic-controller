from firebase_admin import initialize_app

from firebase_admin import credentials
from firebase_admin import db

from json import loads
from os import getenv

from math import cos, pi, radians, degrees, atan2

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))), options={'databaseURL': 'https://green-waves.firebaseio.com/'})


def payload_builder(request):
    """
    create device payloads from last generated route
    :param request: ?device-id=<mqtt-000>
    :return: status
    """

    def angle_between_coordinates(ll1, ll2):
        lat1, lng1 = ll1[0], ll1[1]
        lat2, lng2 = ll2[0], ll2[1]

        dy = lat2 - lat1
        dx = cos(radians(lat1)) * (lng2 - lng1)
        return degrees(atan2(dy, dx))

    if 'device-id' not in request.args:
        return 'error'

    base = db.reference(f'devices/{request.args["device-id"]}')

    base_snapshot = dict(base.get())

    telemetry = []

    for node in base_snapshot['routes'][base_snapshot['last_route_id']]['nodes'].values():
        telemetry.append({
            "id": request.args["device-id"],
            "msec": "TODO",
            "name": "Emergency0",
            "skin": "ambulance",
            "state": {
                "acceleration": 0,
                "course": angle_between_coordinates(
                    (
                        telemetry[-1]['state']['latitude'] if telemetry else 0,
                        telemetry[-1]['state']['longitude'] if telemetry else 0
                    ), (
                        float(node['lat']),
                        float(node['lng'])
                    )
                ),
                "gear": "TODO",
                "latitude": float(node['lat']),
                "longitude": float(node['lng']),
                "rpm": "TODO",
                "speed": 80
            },
            "status": "Moving",
            "timestp": "TODO",
            "type": "Emergency"
        })

    base.child(f'telemetry/{base_snapshot["last_route_id"]}').set(telemetry)

    return 'done'

if __name__ == '__main__':
    class Request:
        args = {"device-id": "mqtt-001"}

    payload_builder(Request)


