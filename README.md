| CI                                                                                                                                                                                                                                                  | Security                                                                                                                                                                                                                | License                                                                                            | Platform                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [![CI](https://github.com/median-dxz/Cookie-AutoDelete-MV3/actions/workflows/continuous-integration-workflow.yml/badge.svg?branch=main)](https://github.com/median-dxz/Cookie-AutoDelete-MV3/actions/workflows/continuous-integration-workflow.yml) | [![CodeQL](https://github.com/median-dxz/Cookie-AutoDelete-MV3/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/median-dxz/Cookie-AutoDelete-MV3/actions/workflows/codeql-analysis.yml) | [![License: MIT](https://img.shields.io/github/license/median-dxz/Cookie-AutoDelete-MV3)](LICENSE) | ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)      |
| ![Release](https://img.shields.io/badge/Release-Pending-lightgrey)                                                                                                                                                                                  | ![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Preparing-yellow)                                                                                                                                     | ![Coverage](https://img.shields.io/badge/Coverage-Pending-lightgrey)                               | ![Firefox](https://img.shields.io/badge/Firefox-Planned-lightgrey) |

# Cookie AutoDelete Next Edition

Control your cookies! This extension is inspired by [Self-Destructing Cookies](https://addons.mozilla.org/firefox/addon/self-destructing-cookies/). When a tab closes, any cookies not being used are automatically deleted. Prevent tracking by other cookies and add only the ones you trust. Easily import and export your cookie whitelist.

Cookie AutoDelete Next Edition is an independently maintained community fork of [Cookie AutoDelete](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete), distributed under the MIT License.

Independent community-maintained fork; not affiliated with or endorsed by the original Cookie AutoDelete maintainers.

> ## About This Fork
>
> The main purpose of this fork is to **help migrate the original repository to Manifest V3 (Google Manifest v3) and adopt a more modern JavaScript build toolchain**, though reasonable feature requests and bug fixes will still be supported.

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

## Installation

> Please keep in mind that at this time only Mozilla Firefox and Google Chrome (as well as its development branches e.g. Developer Edition, Canary) will be supported.
>
> Microsoft Edge Chromium will be considered partially official as it is using the same code as Google Chrome for now.
>
> While you may be able to install this extension on other browsers (i.e. Varations of Edge, Chrome, Firefox, Android), there will be no official support from the authors and maintainers through Github Discussions and/or Issues.

### via Self Installation

- [Github Releases](https://github.com/median-dxz/Cookie-AutoDelete-MV3/releases)

## Contributing

## Support

Report bugs, ask for support, or suggest features through the [issue forms](https://github.com/median-dxz/Cookie-AutoDelete-MV3/issues/new/choose). See [SUPPORT.md](SUPPORT.md) for the information to include.

Do not report security vulnerabilities in a public issue; see [SECURITY.md](SECURITY.md).

### Internationalization (i18n)

~~[Translate Cookie AutoDelete in your language or help fix a translation on Crowdin!](https://crowdin.com/project/cookie-autodelete)~~

Some translations were taken from Machine Translations - if you believe there is a better translation for them, please submit an updated translation and raise an issue through CrowdIn.

Since the original Crowdin setup isn't really maintained at the moment, it's probably best to just submit PRs modifying the locale files directly for now.

### Contributing code

If there are any bugs that only a certain browser has, and you have the fix for it, feel free to submit a PR for it, as long as it does not affect the functionality to other browsers. The easiest is to wrap your bugfix with check for that browser.

#### Requirements

- Latest version of Node.js

#### Development

- `npm install` - Installs all dependencies
- `npm run dev` - This will run the webpack watcher and automatically pack `/src/background.ts`, popup, and setting items and its dependencies to `/extension`
- `npm run lint` - Runs the eslinter for JS files
- `npm test` - Runs the test suite located in `/test`
- `npm run build` - Builds the Chrome ZIP and unsigned Firefox ZIP test artifacts

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

Full documentation can be found in the upstream [wiki](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation).
