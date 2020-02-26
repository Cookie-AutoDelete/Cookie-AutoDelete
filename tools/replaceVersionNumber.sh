#!/usr/bin/env bash
echo "Replacing"
if ! [ -z "$TRAVIS_TAG" ]; then 
 	sed -i 's/"version.*/"version": "'"$TRAVIS_TAG"'"/' extension/manifest.json
	echo "Replacement done with $TRAVIS_TAG"
else 
	echo "No Replacement done."
fi

