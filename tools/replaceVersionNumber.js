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

console.log('Checking if a CI TAG exists...');
if (process.env.TRAVIS_TAG !== undefined || process.env.GITHUB_REF !== undefined) {
  console.log('GITHUB_REF:  %s', process.env.GITHUB_REF);
  console.log('TRAVIS_TAG:  %s', process.env.TRAVIS_TAG);
  let versionTag = process.env.GITHUB_REF || process.env.TRAVIS_TAG;
  console.log('TAG exists - %s', versionTag);
  if (versionTag.startsWith('v')) {
    versionTag = versionTag.splice(1);
  }
  console.log('New Version Number: ', versionTag);
  console.log('Replacing...');
  changeVersion('../package.json', versionTag);
  changeVersion('../extension/manifest.json', versionTag);
  console.log('Replacements done with ' + versionTag);
} else {
  console.log("CI TAG does not exist.  No Replacements done.");
  console.log(process.env);
  return -1;
}
