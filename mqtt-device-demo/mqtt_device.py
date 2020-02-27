import time
import datetime
import random
import functools
import numpy

import ssl

import jwt
import paho.mqtt.client as mqtt

from firebase_admin import initialize_app

from firebase_admin import credentials
from firebase_admin import db

from json import loads, dumps
from os import getenv

from math import cos, radians, degrees, atan2

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))), options={'databaseURL': 'https://green-waves.firebaseio.com/'})


def payload_builder(device_id):

    def angle_between_coordinates(ll1, ll2):
        lat1, lng1 = ll1[0], ll1[1]
        lat2, lng2 = ll2[0], ll2[1]

        dy = lat2 - lat1
        dx = cos(radians(lat1)) * (lng2 - lng1)
        return degrees(atan2(dy, dx))

    base = db.reference(f'devices/{device_id}')

    base_snapshot = dict(base.get())

    telemetry = []

    route = []

    def extend_route(node1, node2):
        for lat, lng in ((lat, lng) for lat, lng in zip(
                numpy.arange(node1['lat'], node2['lat'], 0.0001413),
                numpy.arange(node1['lng'], node2['lng'], 0.0001413))
                         ):
            route.append({"lat": lat, "lng": lng})
        return node2

    # takes two neighbour nodes and creates additional nodes in-between
    functools.reduce(extend_route, base_snapshot['routes'][base_snapshot['last_route_id']]['nodes'].values())

    for node in route:
        telemetry.append({
            "id": device_id,
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

    return telemetry


def create_jwt(project_id, private_key_file, algorithm):
    with open(private_key_file, 'r') as f:
        return jwt.encode({
                'iat': datetime.datetime.utcnow(),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
                'aud': project_id
        }, f.read(), algorithm=algorithm)


def get_client(
        project_id,
        cloud_region,
        registry_id,
        device_id,
        private_key_file,
        algorithm,
        ca_certs,
        mqtt_bridge_hostname,
        mqtt_bridge_port
):
    client = mqtt.Client(
        client_id=f'projects/{project_id}/locations/{cloud_region}/registries/{registry_id}/devices/{device_id}'
    )

    client.username_pw_set(
            username='unused',
            password=create_jwt(project_id, private_key_file, algorithm)
    )

    client.tls_set(ca_certs=ca_certs, tls_version=ssl.PROTOCOL_TLSv1_2)

    def on_connect(unused_client, unused_userdata, unused_flags, rc):
        print('on_connect:', mqtt.connack_string(rc))
        global should_backoff
        global minimum_backoff_time
        should_backoff = False
        minimum_backoff_time = 1

    def error_str(rc):
        return '{}: {}'.format(rc, mqtt.error_string(rc))

    def on_disconnect(unused_client, unused_userdata, rc):
        print('on_disconnect:', error_str(rc))
        global should_backoff
        should_backoff = True

    client.on_connect = on_connect
    client.on_publish = lambda unused_client, unused_userdata, unused_mid: print('on_publish.')
    client.on_disconnect = on_disconnect
    client.on_message = lambda unused_client, unused_userdata, message:\
        print('Received message \'{}\' on topic \'{}\' with Qos {}.'.format(
            str(message.payload.decode('utf-8')), message.topic, str(message.qos)))

    client.connect(mqtt_bridge_hostname, mqtt_bridge_port)

    client.subscribe(f'/devices/{device_id}/config', qos=1)
    client.subscribe(f'/devices/{device_id}/commands/#', qos=0)

    return client


def detach_device(client, device_id):
    client.publish(f'/devices/{device_id}/detach', '{}', qos=1)


def attach_device(client, device_id, auth):
    client.publish(f'/devices/{device_id}/attach', f'{{"authorization" : "{auth}"}}', qos=1)


def send_data_from_bound_device(
        project_id,
        cloud_region,
        registry_id,
        device_id,
        gateway_id,
        private_key_file,
        algorithm,
        ca_certs,
        mqtt_bridge_hostname,
        mqtt_bridge_port,
        jwt_expires_minutes,
        payload
):
    global minimum_backoff_time

    device_topic = '/devices/{}/{}'.format(device_id, 'events')
    gateway_topic = '/devices/{}/{}'.format(gateway_id, 'state')

    jwt_iat = datetime.datetime.utcnow()
    jwt_exp_mins = jwt_expires_minutes

    client = get_client(
        project_id,
        cloud_region,
        registry_id,
        gateway_id,
        private_key_file,
        algorithm,
        ca_certs,
        mqtt_bridge_hostname,
        mqtt_bridge_port
    )

    attach_device(client, device_id, '')
    time.sleep(3)

    gateway_state = 'Starting gateway at: {}.'.format(time.time())
    client.publish(gateway_topic, gateway_state, qos=1)

    for telemetry in payload:
        client.loop()

        if should_backoff:
            if minimum_backoff_time > 32:
                print('Exceeded maximum backoff time. Giving up.')
                break

            delay = minimum_backoff_time + random.randint(0, 1000) / 1000.0
            time.sleep(delay)
            minimum_backoff_time *= 2
            client.connect(mqtt_bridge_hostname, mqtt_bridge_port)

        client.publish(device_topic, dumps(telemetry), qos=1)
        time.sleep(3)

        seconds_since_issue = (datetime.datetime.utcnow() - jwt_iat).seconds
        if seconds_since_issue > 60 * jwt_exp_mins:
            jwt_iat = datetime.datetime.utcnow()
            client = get_client(
                project_id,
                cloud_region,
                registry_id,
                gateway_id,
                private_key_file,
                algorithm,
                ca_certs,
                mqtt_bridge_hostname,
                mqtt_bridge_port
            )

    detach_device(client, device_id)


send_data_from_bound_device(
    'green-waves',
    'us-central1',
    'emergency-vehicles-registry',
    'emergency-vehicle-0',
    'emergency-vehicles-gateway',
    'rsa_private_gateway.pem',  # RS256_x509 key, RS256 doesn`t work
    'RS256',  # used in JWT creation, works
    'roots.pem',
    'mqtt.googleapis.com',
    8883,
    20,
    payload_builder("mqtt-001")
)
