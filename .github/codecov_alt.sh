#!/bin/bash

EVENT_PAYLOAD_FILE=$1

PRID=`jq ".number" $EVENT_PAYLOAD_FILE`

if [ $PRID = "null" ]; then
  bash <(curl -s https://codecov.io/bash) -f ./coverage/* -Z
else
  echo "Pull Request Number Override:  $PRID"
  bash <(curl -s https://codecov.io/bash) -P $PRID -f ./coverage/* -Z
fi
