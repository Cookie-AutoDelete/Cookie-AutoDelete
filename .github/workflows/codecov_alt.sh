#!/bin/bash
echo "$PR_NUM"
if [ -z "$PR_NUM" ]; then
  bash <(curl -s https://codecov.io/bash) -f ./coverage/* -Z
  exit $?
else
  bash <(curl -s https://codecov.io/bash) -f ./coverage/* -P $PR_NUM -Z
  exit $?
fi
