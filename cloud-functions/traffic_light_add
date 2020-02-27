from firebase_admin import initialize_app

from firebase_admin import credentials
from firebase_admin import db

from json import loads
from os import getenv

import json
import requests

from requests import get

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))), options={'databaseURL': 'https://green-waves.firebaseio.com/'})
def traffic_light_add(request):
#["url" : "URL_TO_FILE"] request format
#JSON payload format {"id" : "ID_OF_TL", "data" : {"lat" : "LAT", "lon" : "LON", "colour" : "(0 = red, 1 = yellow ,2 = green)"}}
    request_json = request.get_json()
    if request.args and 'url' in request.args:
        url = request.args['url']
    elif request_json and 'url' in request_json:
        url = request_json['url']
    payload = get(url).json()
    for i in payload['traffic-lighters']:
        db.reference('traffic-lights').child(str(i['id'])).set(i['data'])
    return "push completed"
