#!/bin/bash

EVENT_PAYLOAD_FILE=$1

echo `jq "." $EVENT_PAYLOAD_FILE`
PRID=`jq ".number" $EVENT_PAYLOAD_FILE`

if [ $PRID = "null" ]; then
  bash <(curl -s https://codecov.io/bash) -f ./coverage/* -n  -F -Z
else
  echo "Pull Request Number Override:  $PRID"
  bash <(curl -s https://codecov.io/bash) -f ./coverage/* -P $PRID -n  -F -Z
fi
