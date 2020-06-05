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
'use strict';

// event listeners
const eventListeners = {
  listeners: [],
  addListener: jest.fn(function() {
    if (arguments.length === 1 && !listeners.includes(argument[0])) {
      listeners.push(arguments[0]);
    }
  }),
  clearListeners: jest.fn(function() {
    if (arguments.length === 0) {
      listeners = [];
    }
  }),
  hasListener: jest.fn(function() {
    return arguments.length === 1 && listeners.includes(arguments[0]);
  }),
  removeListener: jest.fn(function() {
    if (arguments.length === 1) {
      listeners = listeners.filter(l => l !== arguments[0]);
    }
  }),
};

// storage functions
const storageArea = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

const apis = {
  alarm: {
    fn: ['clear', 'clearAll', 'create', 'get', 'getAll'],
  },
  browserAction: {
    fn: ['getBadgeText', 'getTitle', 'setBadgeBackgroundColor', 'setBadgeText', 'setBadgeTextColor', 'setIcon', 'setTitle'],
    events: ['onClicked'],
  },
  browsingData: {
    fn: ['remove', 'removeCache', 'removeCookies', 'removeDownloads', 'removeFormData', 'removeLocalStorage', 'removePluginData'],
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
    fn: ['getPopup', 'getTitle', 'hide', 'setIcon', 'setPopup', 'setTitle', 'show'],
    events: ['onClicked'],
  },
  permissions: {
    fn: ['contains', 'getAll', 'remove', 'request'],
  },
  runtime: {
    fn: ['connect', 'getBackgroundPage', 'getBrowserInfo', 'getManifest', 'getPlatformInfo', 'getURL', 'openOptionsPage', 'reload', 'sendMessage'],
    events: ['onConnect', 'onInstalled', 'onMessage', 'onStartup'],
  },
  tabs: {
    fn: ['connect', 'create', 'executeScript', 'get', 'getCurrent', 'query', 'reload', 'sendMessage', 'update'],
    events: ['onDetached', 'onRemoved', 'onSelectionChanged', 'onUpdated'],
  },
  webRequest: {
    events: ['onCompleted', 'onErrorOccurred', 'onHeadersReceived', 'onResponseStarted'],
  }
}

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
Object.keys(apis).forEach(api => {
  if (!browser[api]) {
    browser[api] = {};
  }
  Object.keys(apis[api]).forEach(a => {
    if (a === 'events') {
      apis[api][a].forEach(ev => {
        // e.g. browser.cookies.onChanged = eventListeners;
        browser[api][ev] = eventListeners;
      });
    } else if (a === 'fn') {
      apis[api][a].forEach(fn => {
        // e.g. browser.cookies.getAll = jest.fn();
        browser[api][fn] = jest.fn();
      });
    } else {
      throw new Error(`Unknown browser webextension init:  ${a}`);
    }
  });
});

global.browser = browser;
// Hide test console debug logs from jest results.

global.console = {
  _error: console.error,
  _debug: console.debug,
  _info: console.info,
  _log: console.log,
  _warn: console.warn,
  error: jest.fn(),
  debug: jest.fn(),
  info: console.info,
  log: jest.fn(),
  warn: jest.fn(),
};
