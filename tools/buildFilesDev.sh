#!/bin/bash
echo "Building"
EXTENSIONNAME="Cookie-AutoDelete"
DES=builds
if [ -z "$TRAVIS_TAG" ]; then
 TRAVIS_TAG="Dev_"
 TRAVIS_TAG+=$(date +"%y%m%d"_%H%M)
fi

FIREFOXFILENAME=${EXTENSIONNAME}_Firefox_${TRAVIS_TAG}
CHROMEFILENAME=${EXTENSIONNAME}_Chrome_${TRAVIS_TAG}

mkdir -p $DES
cd extension/

echo "Building Mozilla Firefox version..."
zip -r ../$DES/${FIREFOXFILENAME}.xpi *
echo "Mozilla Firefox Build done."

echo "Preparing to build Google Chrome version..."
echo "Removing manifest.json lines not needed in Google Chrome..."
sed -i '/contextualIdentities/d' manifest.json
sed -i '/privacy/d' manifest.json
sed -i '/browsingData/d' manifest.json
sed -i '/applications/,+5d' manifest.json
echo "Lines removed."

# Don't use the b for beta builds in Chrome
if [[ "$TRAVIS_TAG" == *[b]* ]]
 then
 NEWTAG=${TRAVIS_TAG//[b]/.}
 echo $NEWTAG
 sed -i 's/"version.*/"version": "'"$NEWTAG"'"/' manifest.json
fi
echo "Building Google Chrome version..."
zip -r ../$DES/${CHROMEFILENAME}.zip *
echo "Google Chrome build done."
echo "Reverting manifest.json..."
git checkout manifest.json
echo "Checked out original manifest.json"

echo "Package done."
