![Tagged Release Distribution](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/workflows/Tagged%20Release%20Distribution/badge.svg)
![Node.js CI Tests](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/workflows/Node.js%20CI%20Tests/badge.svg?branch=3.X.X-Branch)
[![dependencies Status](https://david-dm.org/Cookie-AutoDelete/Cookie-AutoDelete/status.svg)](https://david-dm.org/Cookie-AutoDelete/Cookie-AutoDelete)
[![devDependencies Status](https://david-dm.org/Cookie-AutoDelete/Cookie-AutoDelete/dev-status.svg)](https://david-dm.org/Cookie-AutoDelete/Cookie-AutoDelete?type=dev)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/cookie-autodelete/localized.svg)](https://crowdin.com/project/cookie-autodelete)

# Cookie AutoDelete
Control your cookies! This extension is inspired by [Self-Destructing Cookies](https://addons.mozilla.org/en-US/firefox/addon/self-destructing-cookies/). When a tab closes, any cookies not being used are automatically deleted. Prevent tracking by other cookies and add only the ones you trust. Easily import and export your cookie whitelist.

## Main features
- Automatically deletes cookies from closed tabs
- Whitelist/Greylist support for cookies
- Easily export/import your whitelist
- Clear all cookies for a domain
- Supports manual mode cleaning from the popup
- Easily see the number of cookies for a site
- Support for Container Tabs (Firefox 53+ only)

### Usage
1. Add the sites you want to keep cookies for to the whitelist (permanently) or greylist (until browser restart)
2. Enable “Active Mode” in the popup or settings
3. Watch those unused cookies disappear :)

## Installation
### via Official Channels
- [Google Chrome](https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh)
- [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/)
- [Microsoft Edge Chromium](https://microsoftedge.microsoft.com/addons/detail/djkjpnciiommncecmdefpdllknjdmmmo) (Exactly the same as Google Chrome for the time being)

### via Self Installation
- [Github Releases](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/releases)

> Please keep in mind that at this time only Mozilla Firefox and Google Chrome (as well as its development branches e.g. Developer Edition, Canary) will be supported.  Microsoft Edge Chromium will be considered initially as partially official as it is using the same code as Google Chrome for now.  While you may be able to install this extension on other browsers (i.e. Varations of Edge, Chrome, Firefox, Android),  there will be no official support from the authors and maintainers through Github Issues.

## Contributing

### Internationalization (i18n)

[Translate Cookie AutoDelete in your language or help fix a translation on Crowdin!](https://crowdin.com/project/cookie-autodelete)
Some translations were taken from Machine Translations - if you believe there is a better translation for them, please submit an updated translation and raise an issue through CrowdIn.

### Contributing code

#### Requirements
- Latest version of Node.js

#### Development
- `npm install` - Installs all dependencies
- `npm run dev` - This will run the webpack watcher and automatically pack `/src/background.ts`, popup, and setting items and its dependencies to `/extension`
- `npm run lint` - Runs the eslinter for JS files
- `npm test` - Runs the test suite located in `/test`
- `npm run build` - Builds the Firefox (.xpi/.zip) and Chrome (.zip) builds

#### Testing
1. Run `npm install` (if you haven't already)
2. Run `npm run dev`
3. Load the extension in the browser

- Firefox
  - Easiest way would be to run the tool [web-ext](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext#Testing_out_an_extension)
  - Another way is go into `about:debugging` and load `/extension/manifest.json`

- Chrome
  - In the extension tab, enable Developer Mode, then `load unpacked extension` and load the `/extension` folder

#### Building

1. Run `npm install` (if you haven't already)
2. Run `npm run build`
3. The build files should be in a new folder called `/builds`

## Documentation
Full documentation can be found in the [wiki](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation).
