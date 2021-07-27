#!/usr/bin/env bash

rsync -avzrhcP -e 'ssh -i ~/.ssh/id_ecdsa_sec' \
	--exclude env-config.js \
	--delete-after \
	--chown=www-data:www-data \
	./packages/apps/build/ root@$DEPLOY_SERVER:/home/www/nuchain


