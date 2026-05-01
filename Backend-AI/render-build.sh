#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Render uses Ubuntu, so we might need to fix libGL for OpenCV
apt-get update && apt-get install -y libgl1-mesa-glx