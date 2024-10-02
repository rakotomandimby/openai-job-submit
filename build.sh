#!/bin/bash

if [ `hostname` == "mail.natixgroup.com" ]; then
  . /home/ubuntu/.aikeys
  WWW_PREFIX="/var/www/openai-resume/"
  PATH="/usr/local/node/bin:/var/www/openai-resume/node_modules/.bin:"${PATH}
  cd ${WWW_PREFIX}
  npm install --save typescript @types/node ts-node ts-node-dev
  npm install 
  rm -rfv dist/public \
    && rm -rfv dist/views \
    && tsc 
else
  PATH="./node_modules/.bin:"${PATH}
  npm install --save typescript @types/node ts-node ts-node-dev
  npm install 
  rm -rfv dist/public \
    && rm -rfv dist/views \
    && tsc
fi

