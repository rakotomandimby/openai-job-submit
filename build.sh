#!/bin/bash

if [ `hostname` == "mail.natixgroup.com" ]; then
  WWW_PREFIX="/var/www/openai-resume/"
  PATH="/usr/local/node/bin:/var/www/openai-resume/node_modules/.bin:"${PATH}
  cd ${WWW_PREFIX}
  rm -rfv dist/public \
    && rm -rfv dist/views \
    && tsc 
else
  PATH="./node_modules/.bin:"${PATH}
  rm -rfv dist/public \
    && rm -rfv dist/views \
    && tsc
fi

