import time
import datetime
import random

import json

import ssl

import jwt
import paho.mqtt.client as mqtt


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
    time.sleep(5)

    gateway_state = 'Starting gateway at: {}.'.format(time.time())
    client.publish(gateway_topic, gateway_state, qos=1)

    with open(payload, 'r') as f:
        payload_ = json.load(f)

    for telemetry in payload_:
        client.loop()

        if should_backoff:
            if minimum_backoff_time > 32:
                print('Exceeded maximum backoff time. Giving up.')
                break

            delay = minimum_backoff_time + random.randint(0, 1000) / 1000.0
            time.sleep(delay)
            minimum_backoff_time *= 2
            client.connect(mqtt_bridge_hostname, mqtt_bridge_port)

        client.publish(device_topic, '{' + str(payload_[telemetry]) + '}', qos=1)

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
        time.sleep(5)

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
    'payload.json'
)
