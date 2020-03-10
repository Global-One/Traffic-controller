#!/bin/bash

docker tag traffic-controller:latest eu.gcr.io/green-waves/traffic-controller:latest

docker push eu.gcr.io/green-waves/traffic-controller:latest
