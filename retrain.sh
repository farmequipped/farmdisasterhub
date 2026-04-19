#!/bin/bash
sudo systemctl stop sage-python.service
python server/python/retrain.py
sudo systemctl start sage-python.service