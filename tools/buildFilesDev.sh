#!/bin/bash
echo "Building"
EXTENSIONNAME="Cookie-AutoDelete"
DES=builds
if [ -z "$TRAVIS_TAG" ]
 then TRAVIS_TAG=$(date +"%y%m%d"_%H%M)
fi

FIREFOXFILENAME=${EXTENSIONNAME}_Firefox_Dev_${TRAVIS_TAG}
CHROMEFILENAME=${EXTENSIONNAME}_Chrome_Dev_${TRAVIS_TAG}

mkdir -p $DES
cd extension/

zip -r ${FIREFOXFILENAME}.xpi *
mv ${FIREFOXFILENAME}.xpi ../$DES/

sed -i '/contextualIdentities/d' manifest.json
sed -i '/privacy/d' manifest.json
sed -i '/browsingData/d' manifest.json
sed -i '/applications/,+5d' manifest.json

# Don't use the b for beta builds in Chrome
if [[ "$TRAVIS_TAG" == *[b]* ]]
 then
 NEWTAG=${TRAVIS_TAG//[b]/.}
 echo $NEWTAG
 sed -i 's/"version.*/"version": "'"$NEWTAG"'"/' manifest.json
fi

zip -r ${CHROMEFILENAME}.zip *
mv ${CHROMEFILENAME}.zip ../$DES/

git checkout manifest.json

echo "Package done."
