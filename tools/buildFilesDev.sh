echo "Building"

DES=builds
DATETIME=$(date +"%m%d%y"_%H%M)
FIREFOXFILENAME=Firefox_Dev
CHROMEFILENAME=Chrome_Dev

rmdir -rf $DES
mkdir -p $DES
cd src/

zip -r ${FIREFOXFILENAME}.zip *
mv ${FIREFOXFILENAME}.zip ../$DES/

sed -i '/contextualIdentities/d' manifest.json
sed -i '/applications/,+5d' manifest.json

zip -r ${CHROMEFILENAME}.zip *
mv ${CHROMEFILENAME}.zip ../$DES/

git checkout manifest.json

echo "Package done."