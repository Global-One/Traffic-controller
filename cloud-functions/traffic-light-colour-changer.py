from json import loads
from math import sin, cos, atan2, pi, sqrt
from os import getenv

from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import initialize_app

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))),
               options={'databaseURL': 'https://green-waves.firebaseio.com/'})


def traffic_light_changer(request):
    request_args = request.args
    car_id = request_args['car_id']
    lat_car = float(request_args['lat'])
    lng_car = float(request_args['lon'])

    distance_min = 0
    nearest_light = ""

    routes_dict_last = int(db.reference(f'devices/{car_id}').child("last_route_id").get())
    reference = f'devices/{car_id}/routes/{routes_dict_last}/traffic_signals'
    traffic_light_dict = db.reference(reference).get()

    for i, traffic_light in enumerate(traffic_light_dict):
        lat_tl = traffic_light['lat']
        lng_tl = traffic_light['lng']

        distance = measure(lat_car, lng_car, lat_tl, lng_tl)

        if distance <= 0.15:
            distance_min = distance
            nearest_light = str(i)
        if distance_min and distance < distance_min:
            distance_min = distance
            nearest_light = str(i)

    if nearest_light:
        db.reference(reference).child(nearest_light).child("state").set(True)
        return str(nearest_light)
    return "No traffic light to enable."


# https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
def measure(lat1, lon1, lat2, lon2):  # generally used geo measurement function
    R = 6378.137  # Radius of earth in KM
    dLat = lat2 * pi / 180 - lat1 * pi / 180
    dLon = lon2 * pi / 180 - lon1 * pi / 180
    a = sin(dLat / 2) * sin(dLat / 2) + cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2)
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    d = R * c
    return d * 1000  # meters
