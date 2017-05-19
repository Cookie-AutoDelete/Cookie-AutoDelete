echo "Building"

DES=builds
rmdir -rf $DES
mkdir -p $DES
cd src/

zip -r Firefox.zip *
mv Firefox.zip ../$DES/

sed -i '/contextualIdentities/d' manifest.json
sed -i '/applications/,+5d' manifest.json
zip -r Chrome.zip *



mv Chrome.zip ../$DES/

git checkout manifest.json

echo "Package done."