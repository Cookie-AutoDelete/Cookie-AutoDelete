function changeVersion(filename, version) {
  const fs = require('fs');
  var jsonData = require(filename);
  if (jsonData.version === undefined) {
    console.error('ERROR:  No version key found');
    return -1;
  }
  jsonData.version = version;
  fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
  console.log('Finished updating version number on: ' + filename);
}

console.log('Checking if CI_TAG exists...');
if (process.env.TRAVIS_TAG !== undefined) {
  let versionTag = process.env.TRAVIS_TAG;
  console.log('CI_TAG exists - %s', versionTag);
  if (versionTag.startsWith('v')) {
    versionTag = versionTag.splice(1);
  }
  console.log('New Version Number: ', versionTag);
  console.log('Replacing...');
  changeVersion('../package.json', versionTag);
  changeVersion('../extension/manifest.json', versionTag);
  console.log('Replacement done with ' + versionTag);
} else {
  console.log("CI_TAG does not exist.  No Replacements done.");
}
