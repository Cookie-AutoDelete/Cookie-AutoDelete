/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import ipRegex from 'ip-regex';
import shortid from 'shortid';

/* --- CONSTANTS --- */
export const LSCLEANUPNAME = 'CookieAutoDeleteLocalStorageCleanup';


/* --- FUNCTIONS --- */
/**
 * Console Log Outputs - Mostly For Debugging
 */
export const cadLog = (x: CADLogItem) => {
  if (!x.msg || x.msg.trim() === '') return;
  const h = `CAD_${browser.runtime.getManifest().version}`;
  const cOut = [
    console.debug,
    console.error,
    console.info,
    // tslint:disable-next-line:no-console
    console.log,
    console.warn
  ];
  const cTypes = ['debug', 'error', 'info', 'log', 'warn'];
  let type = (x.type || 'debug').toLowerCase();
  if (!cTypes.includes(type)) {
    console.error(`${h} - Invalid Console Output Type given [ ${type} ].  Using [debug] instead.`);
    type = 'debug';
  }
  // Try to determine what type of object it is.
  const tx = typeof x.x;
  let data: string = '';
  switch (tx) {
    case 'boolean':
    case 'number':
    case 'string':
      data = x.x.toString();
      break;
    case 'undefined':
      break;
    case 'object':
      data = JSON.stringify(x.x, null, 2);
      break;
    default:
      console.warn(`${h} - Received unexpected typeof [ ${tx} ].  Attempting to display it...`);
      data = x.x.toString();
      break;
  }
  // Output to console.
  cOut[cTypes.indexOf(type)](`${h} - ${type} - ${x.msg}\n${data}`);
};

/**
 * Converts a version string to a number
 */
export const convertVersionToNumber = (version?: string) => {
  if (!version) return -1;
  return parseInt(version.replace(/[\.]/g, ''), 10);
};

/**
 * Extract the main domain from sub domains
 *   - sub.sub.domain.com ==> domain.com
 * Local html directory/files will return itself
 */
export const extractMainDomain = (domain: string) => {
  if (domain === '') return '';
  // return itself if it is a local html file or IP Address.
  if (domain.startsWith('file://') || ipRegex({exact: true, includeBoundaries: true}).test(domain)) return domain;

  // https://en.wikipedia.org/wiki/Second-level_domain
  const secondLvlDomains = [
    'biz', 'com', 'edu', 'gov', 'ltd', 'mod', 'net', 'org', 'police', 'school'];

  // Delete a '.' if domain contains it at the end
  const eDot = domain.endsWith('.');
  const editedDomain = trimDot(domain);
  const partsOfDomain = editedDomain.split('.');
  const length = partsOfDomain.length;
  const secondLevel = partsOfDomain[length - 2];

  // Check for country top level domain
  if (
    length > 2 &&
    ( secondLevel.length === 2 ||
      secondLvlDomains.includes(secondLevel) &&
    partsOfDomain[length - 1].length === 2)
  ) {
    return `${partsOfDomain.slice(length - 3).join('.')}${eDot ? '.' : ''}`;
  }
  return `${partsOfDomain.slice(length - 2).join('.')}${eDot ? '.' : ''}`;
};

/**
 * Returns the host name of the url.
 *   - https://en.wikipedia.org/wiki/Cat ==> en.wikipedia.org
 * Local file will return the directory of that file.
 *   - file:///home/user/documents/file.html ==> file:///home/user/documents
 *   - file:///D:/user/documents/file.html ==> file:///D:/user/documents
 */
export const getHostname = (urlToGetHostName: string | undefined) => {
  if (!urlToGetHostName) {
    return '';
  }
  if (urlToGetHostName.startsWith('file:')) {
    // This assumes the browser supplied us with a valid local file url.
    // E.g. file:///C:/test.html or file:///home/user/test.html
    return urlToGetHostName.substring(0, urlToGetHostName.lastIndexOf('/'));
  }
  try {
    // Strip "www." if the URL starts with it.
    const hostname = new URL(urlToGetHostName).hostname.replace(
      /^www[a-z0-9]?\./,
      '',
    );
    // Additional check for IPv6 for ipRegex to be happy.
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      return hostname.slice(1, -1);
    }
    return hostname;
  } catch (e) {
    return '';
  }
};

/**
 * Gets the value of the setting
 */
export const getSetting = (state: State, settingName: string) =>
  state.settings[settingName].value;

/**
 * Gets a sanitized cookieStoreId
 */
export const getStoreId = (state: State, storeId: string) => {
  if (
    storeId === 'firefox-default' ||
    (!getSetting(state, 'contextualIdentities') &&
      storeId !== 'firefox-private' &&
      state.cache.browserDetect === 'Firefox') ||
    (state.cache.browserDetect === 'Chrome' && storeId === '0') ||
    (state.cache.browserDetect === 'Opera' && storeId === '0')
  ) {
    return 'default';
  }
  if (state.cache.browserDetect === 'Chrome' && storeId === '1') {
    return 'private';
  }

  return storeId;
};

/**
 * Converts a expression to its regular expression equivalent
 */
export const globExpressionToRegExp = (glob: string) => {
  const normalizedGlob = glob.trim();
  if (normalizedGlob.slice(0, 1) === '/' && normalizedGlob.slice(-1) === '/') {
    // Treat /str/ as regular exprssion str
    return normalizedGlob.slice(1, -1);
  }

  if (normalizedGlob.startsWith('*.')) {
    return `${normalizedGlob
      .replace('*.', '(^|.)')
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')}$`;
  }
  return `^${normalizedGlob
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\\/g, '\\')}$`;
};

/**
 * Returns true if it is an IP (v4 or v6)
 */
export const isAnIP = (url: string | undefined) => {
  if (!url) {
    return false;
  }
  const hostname = getHostname(url);
  return ipRegex({exact: true, includeBoundaries: true}).test(hostname);
};

/**
 * Returns true if it is a webpage or a local file
 */
export const isAWebpage = (URL: string | undefined) => {
  if (!URL) {
    return false;
  }
  if (URL.match(/^http:/) || URL.match(/^https:/) || URL.match(/^file:/)) {
    return true;
  }
  return false;
};

/**
 * Test for FirstPartyIsolation (Firefox).
 * Workaround for not needing Firefox 'Privacy' permission.
 */
export const isFirstPartyIsolate = async () => {
  return browser.cookies.getAll({
    domain: '',
  }).then((r) => {
    // No error = most likely not enabled.
    return Promise.resolve(false);
  }).catch((e) => {
    // Error usually if firstPartyIsolate is enabled as it requires firstPartyDomain Property.
    return Promise.resolve(e.message.indexOf('firstPartyDomain') !== -1);
  });
}

/*
 * Checks if the hostname given is a local file
 */
export const localFileToRegex = (hostname: string) => {
  if (hostname === '') return '';
  if (hostname.startsWith('file:') || hostname.indexOf('/') === 0) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
    return hostname.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
  }
  return hostname; // Doesn't have a file path...return as is.
};

/**
 * Parse cookieStoreId for use in addExpressionUI...
 */
export const parseCookieStoreId = (contextualIdentities: boolean, cookieStoreId: string | undefined) => {
  return (!contextualIdentities || (cookieStoreId && cookieStoreId === 'firefox-default')) ? 'default' : cookieStoreId || 'default';
}

/**
 * Prepare Domains for all cleanups.
 */
export const prepareCleanupDomains = (domain: string) => {
  if (domain.trim() === '') return [];
  const www = new RegExp(/^www[0-9a-z]?\./i);
  const sDot = new RegExp(/^\./);
  let d: string = domain.trim();
  const domains = new Set();
  if (sDot.test(d)) {
    // dot at beginning.  .sub.doma.in(.)
    d = d.slice(1);
  }
  // at this point it should be all unison - sub.doma.in(.)
  domains.add(d);        // sub.doma.in
  domains.add(`.${d}`);  // .sub.doma.in

  if (! www.test(d)) {
    domains.add(`www.${d}`);   // www.sub.doma.in
    domains.add(`.www.${d}`);  // .www.sub.doma.in
  }

  return Array.from(domains) as string[];
};

/**
 * Puts the domain in the right format for browser.cookies.remove()
 */
export const prepareCookieDomain = (cookie: browser.cookies.Cookie) => {
  let cookieDomain = cookie.domain.trim();
  if (cookieDomain.length === 0 && cookie.path.trim().length !== 0) {
    // No Domain - presuming local file (file:// protocol)
    return `file://${cookie.path}`;
  }
  // Looks like a v6 IP
  if (/^[0-9a-f]*:[0-9a-f:]+$/i.test(cookieDomain)) {
    cookieDomain = `[${cookieDomain}]`;
  }

  const sDot = cookieDomain.startsWith('.') ? 1 : 0;

  return `http${cookie.secure ? 's' : ''}://${cookieDomain.slice(sDot)}${cookie.path}`;
};

/**
 * Returns the first availble matched expression
 */
export const returnMatchedExpressionObject = (
  state: State,
  cookieStoreId: string,
  hostname: string,
) => {
  const storeId = getStoreId(state, cookieStoreId);
  const expressionList = state.lists[storeId] || [];
  return expressionList.find(expression =>
    new RegExp(globExpressionToRegExp(expression.expression)).test(hostname),
  );
};

/**
 * Return optional attributes for the Cookie API calls
 */
export const returnOptionalCookieAPIAttributes = (
  state: State | CacheMap,
  cookieAPIAttributes: Partial<CookiePropertiesCleanup> & {
    [x: string]: any;
  },
  firstPartyIsolate: boolean,
) => {
  // Add optional firstPartyDomain attribute
  if (
    state.cache.browserDetect === 'Firefox' &&
    firstPartyIsolate &&
    !Object.prototype.hasOwnProperty.call(
      cookieAPIAttributes,
      'firstPartyDomain',
    )
  ) {
    return {
      ...cookieAPIAttributes,
      firstPartyDomain: null,
    };
  }
  if (
    !(
      state.cache.browserDetect === 'Firefox' &&
      firstPartyIsolate
    )
  ) {
    const { firstPartyDomain, ...rest } = cookieAPIAttributes;
    return rest;
  }
  return cookieAPIAttributes;
};

/**
 * Show a notification
 */
export const showNotification = (x: {
  duration: number,
  msg: string,
  title?: string,
}) => {
  const sid = `manual-${shortid.generate()}`;
  browser.notifications.create(sid, {
    iconUrl: browser.runtime.getURL('icons/icon_48.png'),
    message: x.msg,
    title: `CAD ${browser.runtime.getManifest().version} - ${x.title ? x.title : browser.i18n.getMessage('manualActionNotification')}`,
    type: 'basic',
  });
  setTimeout(() => {
    browser.notifications.clear(sid);
  }, x.duration * 1000);
};

/**
 * Sleep execution for ms.
 * Ensures no 0 second setTimeout otherwise side effects.
 * Ensures we don't go over max signed 32-bit Int of 2,147,483,647
 */
export const sleep = (ms: number) => {
  return new Promise(r => setTimeout(r, (ms < 250 ? 250 : (ms > 2147483500 ? 2147483500 : ms))));
};

/**
 * Show an Error notification
 */
export const throwErrorNotification = (e: Error) => {
  browser.notifications.create('failed-notification', {
    iconUrl: browser.runtime.getURL('icons/icon_red_48.png'),
    message: e.message,
    title: browser.i18n.getMessage('errorText'),
    type: 'basic',
  });
};

/**
 * Trim leading and ending dot of a string
 */
export const trimDot = (str: string) => str.replace(/^[\.]+|[\.]+$/g, '');


/**
 * Opposite of a falsey check for undefined
 */
export const undefinedIsTrue = (bool: boolean | undefined) => {
  if (bool === undefined) return true;
  return bool;
};
