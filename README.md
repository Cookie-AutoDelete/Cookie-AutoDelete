[link-amo]: https://addons.mozilla.org/firefox/addon/cookie-autodelete/
[link-cws]: https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh
[link-edge]: https://microsoftedge.microsoft.com/addons/detail/djkjpnciiommncecmdefpdllknjdmmmo

| Latest Release Tests ![Latest Release](https://img.shields.io/github/v/release/Cookie-AutoDelete/Cookie-AutoDelete)                        | Development Tests                                                                                                      | Localization                                                                                                                       | Coverage                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Tagged Release Distribution](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/workflows/Tagged%20Release%20Distribution/badge.svg) | ![Node.js CI Tests](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/workflows/CI/badge.svg?branch=3.X.X-Branch) | [![Crowdin](https://d322cqt584bo4o.cloudfront.net/cookie-autodelete/localized.svg)](https://crowdin.com/project/cookie-autodelete) | [![Coverage Status](https://coveralls.io/repos/github/Cookie-AutoDelete/Cookie-AutoDelete/badge.svg?branch=3.X.X-Branch)](https://coveralls.io/github/Cookie-AutoDelete/Cookie-AutoDelete?branch=3.X.X-Branch) [![codecov](https://codecov.io/gh/Cookie-AutoDelete/Cookie-AutoDelete/branch/3.X.X-Branch/graph/badge.svg)](https://codecov.io/gh/Cookie-AutoDelete/Cookie-AutoDelete) |

# Cookie AutoDelete

Control your cookies! This extension is inspired by [Self-Destructing Cookies](https://addons.mozilla.org/firefox/addon/self-destructing-cookies/). When a tab closes, any cookies not being used are automatically deleted. Prevent tracking by other cookies and add only the ones you trust. Easily import and export your cookie whitelist.

## Main features

- Automatically deletes cookies from closed tabs
- Whitelist/Greylist support for cookies
- Easily export/import your configurations
- Clear all cookies for a domain
- Supports manual mode cleaning from the popup
- Easily see the number of cookies for a site
- Support for Container Tabs (Firefox 53+ only)

### Usage

1. Add the sites you want to keep cookies for to the whitelist (permanently) or greylist (until browser restart)
2. Enable "Automatic Cleaning" in settings or "Auto-Clean" in popup
3. Watch those unused cookies disappear :)

## About This Fork

The main purpose of this fork is to **help migrate the original repository to Manifest V3 (Google Manifest v3) and adopt a more modern JavaScript build toolchain**. As the creator of this fork, I have limited time available, so I won't be spending much time on this fork, nor will I be uploading its build to the Chrome Web Store. Therefore, until the primary goal is achieved, this project will not accept requests for new features.

**Please note that you need to load the build from Release into your browser via developer mode.**

Once this main objective is accomplished, I will open a PR and follow up on its progress, then decide on the next steps for this fork repository.

## Installation

### via Self Installation

- [Github Releases](https://github.com/median-dxz/Cookie-AutoDelete-MV3/releases)

> Please keep in mind that at this time only Mozilla Firefox and Google Chrome (as well as its development branches e.g. Developer Edition, Canary) will be supported.  
> Microsoft Edge Chromium will be considered partially official as it is using the same code as Google Chrome for now.
> While you may be able to install this extension on other browsers (i.e. Varations of Edge, Chrome, Firefox, Android), there will be no official support from the authors and maintainers through Github Discussions and/or Issues.

## Contributing

### Donations

Please check the original repository for instructions on how to donate to the original authors.

### Internationalization (i18n)

[Translate Cookie AutoDelete in your language or help fix a translation on Crowdin!](https://crowdin.com/project/cookie-autodelete)
Some translations were taken from Machine Translations - if you believe there is a better translation for them, please submit an updated translation and raise an issue through CrowdIn.

### Contributing code

If there are any bugs that only a certain browser has, and you have the fix for it, feel free to submit a PR for it, as long as it does not affect the functionality to other browsers. The easiest is to wrap your bugfix with check for that browser.

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
  - Easiest way would be to run the tool [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#Testing_out_an_extension)
  - Another way is go into `about:debugging` and load `/extension/manifest.json`

- Chrome
  - In the extension tab, enable Developer Mode, then `load unpacked extension` and load the `/extension` folder

#### Building

1. Run `npm install` (if you haven't already)
2. Run `npm run build`
3. The build files should be in a new folder called `/builds`

## Documentation

Full documentation can be found in the [wiki](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation).
