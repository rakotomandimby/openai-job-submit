#!/bin/bash

rm -rfv dist/public \
  && rm -rfv dist/views \
  && tsc 
