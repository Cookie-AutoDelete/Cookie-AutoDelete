/**
 * Copyright (c) 2020 Kenneth Tran and CAD Team
 * (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT
 * (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const BUILDS = 'builds';
const EXT = 'extension';
const EXTNAME = 'Cookie-AutoDelete_';
const MANIFEST = 'manifest.json';

const ROOTDIR = process.cwd();
const BUILDDIR = path.join(ROOTDIR, BUILDS);
const EXTDIR = path.join(ROOTDIR, EXT);

console.log('\n\nUsing NodeJS Version %s on %s %s', process.version, process.platform, process.arch);
console.log('Current Root Directory is:  %s', ROOTDIR);

console.log('GITHUB_REF:  %s', process.env.GITHUB_REF);
console.log('TRAVIS_TAG:  %s', process.env.TRAVIS_TAG);
console.log('GITSHA    :  %s', process.env.GITSHA);

let versionTag = process.env.GITHUB_REF || process.env.TRAVIS_TAG || '';

if (versionTag.startsWith('refs/tags/')) {
  versionTag = versionTag.slice(10);
}

if (versionTag && !RegExp(/^v?\d+\.\d+\.\d+$/).test(versionTag)) {
  console.warn('Version [ %s ] is not in valid semver form.', versionTag);
  versionTag = '';
}

if (!versionTag) {
  console.log('Neither GITHUB_REF nor TRAVIS_TAG contained a valid semver version.  Presuming non-publishing version.\nAdding Dev_ and using Date Format YYYYMMDD_HHMMSS as tag.');
}

const sha = (process.env.GITSHA ? `_${process.env.GITSHA.substr(0, 7)}` : '');

const TAG = (versionTag || 'Dev_' + new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().replace(/T/, '_').replace(/-|:|\..+/g, '')) + sha + '_';

console.log('TAG to append:  %s\n', TAG);

const CHROMEFILENAME = EXTNAME + TAG + 'Chrome';
const FIREFOXFILENAME = EXTNAME + TAG + 'Firefox';

function archiverZip(cb, filename) {
  if (typeof (cb) !== 'function') {
    console.error('callback is not a function!');
    return null;
  }
  const fileStream = fs.createWriteStream(path.join(BUILDDIR, filename + '.zip'));

  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the Compression Level.
  });

  // Listen for all archive data to be written
  // 'close' eent is fired only when a file descriptor is involved
  function fileOnClose() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
    cb(0);
  }

  // This event is fired when data source is drained no matter what was the data source.
  // Not part of archiver but from NodeJS Stream API.
  function fileOnEnd() {
    console.log('Data has been drained');
  }

  console.log('Creating an archive in: %s', fileStream.path);

  fileStream.on('close', fileOnClose);
  fileStream.on('end', fileOnEnd);

  // Good Practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.warn('ARCHIVER WARNING %s: %s (%s)', err.code, err.message, err.data);
    } else {
      throw err;
    }
  });

  // Good Practice to catch his error explicitly
  archive.on('error', function(err) {
    throw err;
  });

  // Pipe archive data to the file
  archive.pipe(fileStream);

  // Append files from Extension Folder.
  archive.directory(EXTDIR, false);

  archive.finalize();
}

function firefoxBuild(cb) {
  if (typeof (cb) !== 'function') {
    console.error('callback is not a function!');
    return null;
  }
  console.log('\nBuilding unsigned extension for Mozilla Firefox...');

  archiverZip(
    function(r) {
      if (r === 0) {
        // Copy ZIP to XPI
        console.log('Copying .ZIP to .XPI...');
        fs.copyFileSync(path.join(BUILDDIR, FIREFOXFILENAME + '.zip'), path.join(BUILDDIR, FIREFOXFILENAME + '.xpi'));
        console.log('>> Copy Success!');
        // End of Mozilla Firefox build.
        console.log('Mozilla Firefox Build Complete!');
      } else {
        console.warn('Archiver was not successful as it returned [%s]. Stopping the rest of the process.', r);
      }
      cb(r);
    }, FIREFOXFILENAME,
  );
}

function chromeBuild(cb) {
  if (typeof (cb) !== 'function') {
    console.error('callback is not a function!');
    return null;
  }
  // Copy manifest into memory to preserve it.
  console.log('\nGetting a copy of %s to memory...', MANIFEST);
  const mforig = fs.readFileSync(path.join(EXTDIR, MANIFEST));
  console.log('>> Done!');
  console.log('Prepping %s for Google Chrome...', MANIFEST);

  function delMFPerm(mf, perm) {
    let i = mf.permissions.indexOf(perm);
    console.log('> Removing Perm: %s ... %s', perm, (i === -1 ? 'Not Found!' : (mf.permissions.splice(i, 1).length === 1 ? 'Done!' : 'An Easter Egg Error!')));
  }

  const mf = require(path.join(EXTDIR, MANIFEST));
  delMFPerm(mf, 'contextualIdentities');
  console.log('> Removing [applications] section ... %s', delete mf.applications ? 'Done!' : 'Failed');

  console.log('Overwriting %s for Google Chrome ...', MANIFEST);
  fs.writeFileSync(path.join(EXTDIR, MANIFEST), JSON.stringify(mf, null, 2));
  console.log('>> Done!');

  console.log('\nBuilding unsigned extension for Google Chrome...');

  archiverZip(
    function(r) {
      if (r === 0) {
        // continue
        // Revert modifications
        fs.writeFileSync(path.join(EXTDIR, MANIFEST), mforig);
        console.log('%s has been reverted back to original contents!', MANIFEST);

        // End of Google Chrome build.
        console.log('Google Chrome Build Complete!');
      } else {
        console.warn('Archiver was not successful as it returned [%s]. Stopping the rest of the process.', r);
      }
      cb(r);
    }, CHROMEFILENAME,
  );
}

function mainBuild() {
  firefoxBuild((r) => {
    if (r === 0) {
      // Do Chrome Build
      chromeBuild((r) => {
        if (r === 0) {
          // EdgeChromium Build, for future.
          console.log('\n\n> All Done! <\n');
        } else {
          console.error('Google Chrome Build did not complete successfully.  Stopping the rest of the Build.');
          process.exitCode = 4;
        }
      });
    } else {
      console.error('Firefox Build did not complete successfully.  Stopping the rest of the progress');
      process.exitCode = 3;
    }
  });
}

function preCheck(cb) {
  if (typeof (cb) !== 'function') {
    console.error('callback is not a function!');
    return null;
  }
  console.log('Creating %s if it does not exists...', BUILDDIR);
  fs.mkdirSync(BUILDDIR, { recursive: true });

  console.log('Checking if %s folder exists...', EXTDIR);
  const extRes = fs.statSync(EXTDIR);
  if (!extRes) {
    console.error('%s does NOT exist - Cannot build WebExtension.  Terminating.', EXTDIR);
    cb(1);
  } else if (!extRes.isDirectory()) {
    console.error('%s is found but is NOT a directory.  Cannot build WebExtension.  Terminating.', EXTDIR);
    cb(2);
  } else {
    console.log('Yup.  Directory %s Exists!', EXTDIR);
    cb(0);
  }
}

// Start Point!
preCheck((r) => {
  if (r === 0) {
    mainBuild();
  } else {
    console.warn('PreCheck Failed! Terminating!');
    process.exitCode = r;
  }
});
