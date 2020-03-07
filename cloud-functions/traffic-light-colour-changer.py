from firebase_admin import initialize_app

from firebase_admin import credentials
from firebase_admin import db

from json import loads
from os import getenv

import json
import requests

from requests import get

import math

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))), options={'databaseURL': 'https://green-waves.firebaseio.com/'})


def degreesToRadians(degrees):
    return (degrees / math.pi) * 180


def traffic_light_changer(request):

    request_args = request.args
    car_id = request_args['car_id']
    lat_car_rad = float(request_args['lat'])
    lon_car_rad = float(request_args['lon'])

    earthRadiusKm = 6371

    distance_min = 0
    nearest_light = ""

    routes_dict_last = int(db.reference(f'devices/{car_id}').child("last_route_id").get())
    reference = f'devices/{car_id}/routes/{routes_dict_last}/traffic_signals'
    traffic_light_dict = dict(db.reference(reference).get())

    for traffic_light in traffic_light_dict:

        lat_tl_rad = traffic_light_dict[traffic_light]['lat']
        lon_tl_rad = traffic_light_dict[traffic_light]['lng']

        dLat = degreesToRadians(lat_car_rad - lat_tl_rad)
        dLon = degreesToRadians(lon_car_rad - lon_tl_rad)

        lat_tl = degreesToRadians(lat_tl_rad)
        lat_car = degreesToRadians(lat_car_rad)

        a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.sin(dLon / 2) * math.sin(dLon / 2) * math.cos(lat_tl) * math.cos(lat_car)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = c * earthRadiusKm

        if not distance_min:
            distance_min = distance
            nearest_light = traffic_light
        else:
            if distance < distance_min and distance <= 150:
                distance_min = distance
                nearest_light = traffic_light
    db.reference(reference).child(nearest_light).child("state").set(True) 
    return str(nearest_light)