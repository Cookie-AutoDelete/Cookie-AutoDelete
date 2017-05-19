echo "Building"

EXTENSIONNAME="Cookie-AutoDelete"
DES=builds
DATETIME=$(date +"%m%d%y"_%H%M)
FIREFOXFILENAME=${EXTENSIONNAME}_Firefox_Dev_${DATETIME}
CHROMEFILENAME=${EXTENSIONNAME}_Chrome_Dev_${DATETIME}

rmdir -rf $DES
mkdir -p $DES
cd src/

zip -r ${FIREFOXFILENAME}.xpi *
mv ${FIREFOXFILENAME}.xpi ../$DES/

sed -i '/contextualIdentities/d' manifest.json
sed -i '/applications/,+5d' manifest.json

zip -r ${CHROMEFILENAME}.zip *
mv ${CHROMEFILENAME}.zip ../$DES/

git checkout manifest.json

echo "Package done."