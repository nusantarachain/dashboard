#!/usr/bin/env bash

if [ ! -f ".env-prod" ]; then
    echo ".env-prod file not exists"e
    exit 1
fi

source .env-prod
yarn build
