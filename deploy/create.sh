#!/bin/bash

podman create \
        -p 3000:3000 \
        -v splash_userdata:/var/node/user_data \
        --name splash \
        splash