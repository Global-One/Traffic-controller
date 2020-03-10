from multiprocessing import Process

from flask import Flask, request

from mqtt_simulation.mqtt_device import send_data_from_device

app = Flask(__name__)

ongoing_simulations = {}


@app.route('/send_mqtt_data')
def send_mqtt_data():
    """
    Start mqtt simulation
    :return: None
    """

    if request.args.get('device-id') in ongoing_simulations.keys():
        pass
    else:
        ongoing_simulations[request.args.get('device-id')] = Process(target=send_data_from_device,
                                                                     args=(request.args.get('device-id'),))
        ongoing_simulations[request.args.get('device-id')].start()
    return 'mqtt running'


@app.route('/stop_mqtt_data')
def stop_mqtt_data():
    """
    Stop mqtt simulation
    :return: None
    """

    if request.args.get('device-id') in ongoing_simulations.keys():
        ongoing_simulations[request.args.get('device-id')].kill()
        del ongoing_simulations[request.args.get('device-id')]
    else:
        pass
    return 'mqtt stops'


if __name__ == '__main__':
    app.run()
