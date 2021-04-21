#!/usr/bin/env bash




rsync -avzrhcP -e 'ssh -i ~/.ssh/id_ecdsa_sec' --delete-after ./packages/apps/build/ root@$DEPLOY_SERVER:/home/www/nuchain


