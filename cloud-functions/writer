from firebase_admin import initialize_app

from firebase_admin import credentials
from firebase_admin import db

from json import loads
from os import getenv

from requests import get

from base64 import b64decode

initialize_app(credential=credentials.Certificate(loads(getenv("FIREBASE_CONFIG"))), options={
        'databaseURL': 'https://green-waves.firebaseio.com/',
    	'databaseAuthVariableOverride': {
        	'uid': 'db-writer'
    }
})

def payload_writer(event, context):
    #payload = loads(b64decode(event['data']).decode('utf-8'))
    
    db.reference('payloads').child(payload['id']).push(payload)
    
    url = "https://traffic-controller-paxi7unp3q-uc.a.run.app/update_position"
    get(url, data=b64decode(event['data']).decode('utf-8'))
    
