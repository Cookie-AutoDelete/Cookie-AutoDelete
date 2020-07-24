/**
 * Copyright (c) 2017-2020 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * This setup file for jest testing essentially mimics the
 * Firefox WebExtension APIs with jest mock functions.
 *
 * Use global.browser for testing for calls to webextension API.
 * If you are expecting values to be returned, use jest-when
 *   e.g. when(global.browser.i18n.getMessage)
 *          .calledWith(expect.any(String), expect.any(Array))
 *          .mockReturnValue('translated');
 * to have it return a value depending on the input received.
 */
'use strict';

// event listeners
const eventListeners = {
  addListener: jest.fn(),
  clearListeners: jest.fn(),
  hasListener: jest.fn(),
  removeListener: jest.fn(),
};

// storage functions
const storageArea = {
  storage: {},
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

const apis = {
  alarms: {
    fn: ['clear', 'clearAll', 'create', 'get', 'getAll'],
  },
  browserAction: {
    fn: [
      'getBadgeText',
      'getTitle',
      'setBadgeBackgroundColor',
      'setBadgeText',
      'setBadgeTextColor',
      'setIcon',
      'setTitle',
    ],
    events: ['onClicked'],
  },
  browsingData: {
    fn: [
      'remove',
      'removeCache',
      'removeCookies',
      'removeDownloads',
      'removeFormData',
      'removeLocalStorage',
      'removePluginData',
    ],
  },
  contextualIdentities: {
    fn: ['create', 'get', 'query', 'remove', 'update'],
    events: ['onCreated', 'onRemoved', 'onUpdated'],
  },
  cookies: {
    fn: ['get', 'getAll', 'getAllCookieStores', 'remove', 'set'],
    events: ['onChanged'],
  },
  i18n: {
    fn: ['getMessage'],
  },
  contextMenus: {
    fn: ['create', 'refresh', 'remove', 'removeAll', 'update'],
    events: ['onClicked'],
  },
  notifications: {
    fn: ['clear', 'create', 'getAll', 'update'],
    events: ['onClicked', 'onClosed'],
  },
  pageAction: {
    fn: [
      'getPopup',
      'getTitle',
      'hide',
      'setIcon',
      'setPopup',
      'setTitle',
      'show',
    ],
    events: ['onClicked'],
  },
  permissions: {
    fn: ['contains', 'getAll', 'remove', 'request'],
  },
  runtime: {
    fn: [
      'connect',
      'getBackgroundPage',
      'getBrowserInfo',
      'getManifest',
      'getPlatformInfo',
      'getURL',
      'openOptionsPage',
      'reload',
      'sendMessage',
    ],
    events: ['onConnect', 'onInstalled', 'onMessage', 'onStartup'],
  },
  tabs: {
    fn: [
      'connect',
      'create',
      'executeScript',
      'get',
      'getCurrent',
      'query',
      'reload',
      'sendMessage',
      'update',
    ],
    events: ['onDetached', 'onRemoved', 'onSelectionChanged', 'onUpdated'],
  },
  webRequest: {
    events: [
      'onCompleted',
      'onErrorOccurred',
      'onHeadersReceived',
      'onResponseStarted',
    ],
  },
};

const browser = {
  extension: {
    isAllowedIncognitoAccess: jest.fn(),
    lastError: undefined,
  },
  privacy: {
    websites: {
      firstPartyIsolate: jest.fn(),
    },
  },
  storage: {
    local: storageArea,
    managed: storageArea,
    onChanged: eventListeners,
    sync: storageArea,
  },
};

// Add in rest of webextension functions
Object.keys(apis).forEach((api) => {
  if (!browser[api]) {
    browser[api] = {};
  }
  Object.keys(apis[api]).forEach((a) => {
    if (a === 'events') {
      apis[api][a].forEach((ev) => {
        // e.g. browser.cookies.onChanged = eventListeners;
        browser[api][ev] = eventListeners;
      });
    } else if (a === 'fn') {
      apis[api][a].forEach((fn) => {
        // e.g. browser.cookies.getAll = jest.fn();
        browser[api][fn] = jest.fn();
      });
    } else {
      throw new Error(`Unknown browser webextension init:  ${a}`);
    }
  });
});

global.browser = browser;
global.chrome = browser;

/**
 * Simple browerDetect function for testing purposes.
 * Should only be called if cache's browserDetect was undefined
 * @returns {string} 'UnknownBrowser'
 */
function browserDetect() {
  return 'UnknownBrowser';
}
global.browserDetect = browserDetect;

/**
 * This hides the test console debug logs from jest results.
 */
global.console = {
  _error: console.error, // eslint-disable-line no-console
  _debug: console.debug, // eslint-disable-line no-console
  _info: console.info, // eslint-disable-line no-console
  _log: console.log, // eslint-disable-line no-console
  _warn: console.warn, // eslint-disable-line no-console
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

/**
 * Generate Jest Mock Spies for a given class.
 * @param parent The class to spy on.
 * @returns {{}} an object which contains the generated spy functions
 */
function generateSpies(parent) {
  const spyParent = {};
  for (const k of Object.keys(parent)) {
    try {
      if (!spyParent[k]) spyParent[k] = jest.spyOn(parent, k);
    } catch {
      // Most likely not a function
    }
  }
  return spyParent;
}
global.generateSpies = generateSpies;
