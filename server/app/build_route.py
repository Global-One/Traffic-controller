import json
from time import sleep

import osmapi as osm
import requests
from requests import get


def build_route(request):
    lat1, lng1, lat2, lng2 = [float(y) for x in request.args for y in request.args[x].split(',')]
    print(lat1, lat2)
    api_request_url = f'http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}' \
                      f'?alternatives=false&annotations=nodes'
    print(api_request_url)
    response = json.loads(get(api_request_url).content.decode())
    pending_count = 0
    print(response.get('message'), response.get('message') == "Too Many Requests")
    while response.get('message') and response.get('message') == "Too Many Requests":
        pending_count += 1
        # print(response.get('message'))
        if pending_count % 20 == 0:
            print('Pending... %d' % pending_count)
            print(response)
        response = json.loads(get(api_request_url).content.decode())
        sleep(0.2)

    if response['code'] == 'NoRoute':
        return response

    api = osm.OsmApi()
    nodes_dict = {}
    traffic_signals_dict = {}
    data = response['routes'][0]['legs'][0]
    # print("Requesting data for nodes..." + str(data['annotation']['nodes']))
    # print(api.NodeGet(data['annotation']['nodes'][0]))
    nodes_to_process = data['annotation']['nodes']
    # my_own_request(nodes_to_process)
    print(len(nodes_to_process))
    all_nodes_data = {}
    for i in range(0, len(nodes_to_process), 300):
        all_nodes_data.update(api.NodesGet(data['annotation']['nodes'][i:i + 300]))
    # print("Get data for nodes: " + str(all_nodes_data))
    for node_date in all_nodes_data.values():
        if 'highway' in node_date.get('tag') and node_date['tag']['highway'] == 'traffic_signals':
            traffic_signals_dict[node_date['id']] = {'id': node_date['id'], 'lat': node_date['lat'],
                                                     'lng': node_date['lon'],
                                                     'state': False}
        else:
            nodes_dict[node_date['id']] = {'id': node_date['id'], 'lat': node_date['lat'], 'lng': node_date['lon']}

    nodes_list = []
    traffic_signals_list = []
    for node_id in data['annotation']['nodes']:
        if nodes_dict.get(node_id):
            nodes_list.append(nodes_dict[node_id])
        else:
            nodes_list.append(traffic_signals_dict[node_id])
    for traffic_signal_id in data['annotation']['nodes']:
        if traffic_signals_dict.get(traffic_signal_id):
            traffic_signals_list.append(traffic_signals_dict[traffic_signal_id])

    result_data = {'nodes': nodes_list, "traffic_signals": traffic_signals_list, 'duration': data['duration'],
                   'distance': data['distance']}

    return result_data


def my_own_request(nodes_list):
    url = 'https://api.openstreetmap.org/api/0.5/nodes?nodes=%s'
    url = url % ','.join([str(node_id) for node_id in nodes_list])
    print(url)
    response = requests.get(url).content.decode()
    print(response)
