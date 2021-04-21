#!/usr/bin/env bash




rsync -avzrhcP -e 'ssh -i ~/.ssh/id_ecdsa_sec' --delete-after ./packages/apps/build/ root@149.129.246.35:/home/www/nuchain


