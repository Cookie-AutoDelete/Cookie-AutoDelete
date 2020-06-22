const path = require('path');
const ROOTDIR = process.cwd();
const REGVER = RegExp(/^\d+\.\d+\.\d+$/);

function changeVersion(fp, version) {
  const fs = require('fs');
  let jsonData = require(fp);
  if (jsonData.version === undefined) {
    console.error('ERROR:  No version key found');
    return -1;
  }
  if (jsonData.version === version) {
    console.log('Version is already updated to %s on %s', version, fp);
  } else {
    console.log('Replacing old version number: %s', jsonData.version);
    jsonData.version = version;
    fs.writeFileSync(fp, JSON.stringify(jsonData, null, 2));
    console.log('Finished updating version number to %s on:  %s', jsonData.version, fp);
  }
}

console.log('\nUsing NodeJS Version %s on %s %s', process.version, process.platform, process.arch);
console.log('Current Process Directory:  %s', ROOTDIR);

console.log('\nGITHUB_REF:  %s', process.env.GITHUB_REF);
console.log('TRAVIS_TAG:  %s', process.env.TRAVIS_TAG);

let versionTag = process.env.GITHUB_REF || process.env.TRAVIS_TAG || '';

if (versionTag.startsWith('refs/tags/')) {
  versionTag = versionTag.slice(10);
}

if (versionTag.startsWith('v')) {
  versionTag = versionTag.slice(1);
}

if (versionTag && !REGVER.test(versionTag)) {
  console.warn('Version Tag [ %s ] is not in valid semver form.', versionTag);
  versionTag = '';
}

if (versionTag) {
  console.log('\nVersion Tag is valid.  Checking NPM Package Version.');
  let pkgVer = require(path.join(ROOTDIR, 'package.json')).version;
  if (pkgVer) {
    if (REGVER.test(pkgVer)) {
      console.log('Version from CI Tag:   %s', versionTag);
      console.log('Version from NPM pkg:  %s', pkgVer);
      if (pkgVer === versionTag) {
        console.log('Version matches.  Continuing with Version Replacement.');
        changeVersion(path.join(ROOTDIR, 'extension', 'manifest.json'), versionTag);
        console.log('Replacements done with ' + versionTag);
      } else {
        console.error('ERROR:  Version Tag does not match NPM Package Version.  Please revise either version to match and try again.');
        process.exitCode = 3;
      }
    } else {
      console.error('ERROR:  NPM Package Version is not in valid semver form.  Please check version in package.json.');
      process.exitCode = 2;
    }
  } else {
    console.error('ERROR: Version does not exist in NPM Package.  Please check package.json for a version item.');
    process.exitCode = 1;
  }
} else {
  console.log('\nGITHUB_REF or TRAVIS_TAG version tag does not exist or is not valid.  Presuming non-publishing version.  No Replacements done.');
}
