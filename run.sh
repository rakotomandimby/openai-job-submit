#!/bin/bash

rm -rfv dist/public \
  && rm -rfv dist/views \
  && tsc \
  && cp -rv public dist/ \
  && cp -rv views dist/ \
  && node dist/index.js
