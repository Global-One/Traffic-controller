from google.cloud import pubsub_v1
from google.oauth2 import service_account

from time import sleep
from os import getenv

from requests import get
from json import loads


def payload_publisher(request):
    def publish(url: str, topic: str, client=pubsub_v1.PublisherClient(credentials=service_account.Credentials.from_service_account_info(loads(getenv('GOOGLE_APPLICATION_CREDENTIALS'))))):
        topic = client.topic_path('green-waves', topic)

        futures = dict()

        def get_callback(future, data):
            def callback(future):
                try:
                    print(f"Published message: {data}, ID: {future.result()}")
                    futures.pop(data)
                except:
                    print(f"A problem occurred when publishing {data}: {future.exception()}\n")

            return callback

        for data in get(url).content.splitlines():  # already in bytes
            futures.update({data: None})
            future = client.publish(topic, data=data if data else b'<empty line>')
            futures[data] = future
            future.add_done_callback(get_callback(future, data))

            sleep(1.0)  # publish every second

        while futures:
            sleep(3)  # wait to finish

        return f"Published messages from {url} to {topic}."

    if request.args and 'url' in request.args and 'topic' in request.args:
        return publish(request.args['url'], request.args['topic'])
    else:
        return f'Invalid argument.'
