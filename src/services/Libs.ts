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

import ipaddr from 'ipaddr.js';
import shortid from 'shortid';

/* --- CONSTANTS --- */
export const CADCOOKIENAME = 'CookieAutoDeleteBrowsingDataCleanup';
export const SITEDATATYPES = [
  SiteDataType.CACHE,
  SiteDataType.INDEXEDDB,
  SiteDataType.LOCALSTORAGE,
  SiteDataType.PLUGINDATA,
  SiteDataType.SERVICEWORKERS,
];

/* --- FUNCTIONS --- */
/**
 * Console Log Outputs - Mostly For Debugging
 */
export const cadLog = (x: CADLogItem, output: boolean): void => {
  if (!x.msg || x.msg.trim() === '') return;
  if (!output) return;
  const h = `CAD_${browser.runtime.getManifest().version}`;
  const cOut = [
    // eslint-disable-next-line no-console
    console.debug,
    // eslint-disable-next-line no-console
    console.error,
    // eslint-disable-next-line no-console
    console.info,
    // eslint-disable-next-line no-console
    console.log,
    // eslint-disable-next-line no-console
    console.warn,
  ];
  const cTypes = ['debug', 'error', 'info', 'log', 'warn'];
  let type = (x.type || 'debug').toLowerCase();
  if (!cTypes.includes(type)) {
    // eslint-disable-next-line no-console
    console.error(
      `${h} - Invalid Console Output Type given [ ${type} ].  Using [debug] instead.`,
    );
    type = 'debug';
  }
  // Try to determine what type of object it is.
  const tx = typeof x.x;
  let data = '';
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
      // eslint-disable-next-line no-console
      console.warn(
        `${h} - Received unexpected typeof [ ${tx} ].  Attempting to display it...`,
      );
      data = x.x.toString();
      break;
  }
  // Output to console.
  cOut[cTypes.indexOf(type)](`${h} - ${type} - ${x.msg}\n${data}`);
};

/**
 * Create Partial Cookie info for debug
 */
export const createPartialTabInfo = (
  tab: Partial<browser.tabs.Tab>,
): Partial<browser.tabs.Tab> => {
  return {
    cookieStoreId: tab.cookieStoreId,
    discarded: tab.discarded,
    id: tab.id,
    incognito: tab.incognito,
    status: tab.status,
    url: tab.url,
    windowId: tab.windowId,
  };
};

/**
 * Converts a version string to a number
 */
export const convertVersionToNumber = (version?: string): number => {
  if (!version) return -1;
  return parseInt(version.replace(/[.]/g, ''), 10);
};

/**
 * Abstract Event Listener call to add/remove with checks.
 * @param event The event listener
 * @param listener The callback function to add/check/remove.
 * @param action The EventListenerAction (add/remove).
 */
export const eventListenerActions = (
  event: EvListener<any>,
  listener: (...args: any[]) => void,
  action: EventListenerAction,
): void => {
  if (!event || !event.hasListener) return;
  switch (action) {
    case EventListenerAction.ADD:
      if (!event.hasListener(listener)) {
        event.addListener(listener);
      }
      break;
    case EventListenerAction.REMOVE:
      if (event.hasListener(listener)) {
        event.removeListener(listener);
      }
      break;
  }
};

/**
 * Extract the main domain from sub domains
 *   - sub.sub.domain.com ==> domain.com
 * Local html directory/files will return itself
 */
export const extractMainDomain = (domain: string): string => {
  if (domain === '') return '';
  // return itself if it is a local html file or IP Address.
  if (domain.startsWith('file://') || ipaddr.isValid(domain)) return domain;

  // https://en.wikipedia.org/wiki/Second-level_domain
  const secondLvlDomains = [
    'biz',
    'com',
    'edu',
    'gov',
    'ltd',
    'mod',
    'net',
    'org',
    'police',
    'school',
  ];

  // Delete a '.' if domain contains it at the end
  const eDot = domain.endsWith('.');
  const editedDomain = trimDot(domain);
  const partsOfDomain = editedDomain.split('.');
  const length = partsOfDomain.length;
  const secondLevel = partsOfDomain[length - 2];

  // Check for country top level domain
  if (
    length > 2 &&
    (secondLevel.length === 2 ||
      (secondLvlDomains.includes(secondLevel) &&
        partsOfDomain[length - 1].length === 2))
  ) {
    return `${partsOfDomain.slice(length - 3).join('.')}${eDot ? '.' : ''}`;
  }
  return `${partsOfDomain.slice(length - 2).join('.')}${eDot ? '.' : ''}`;
};

/**
 * This fetches all (first party) cookies for a given tab domain
 * @param state The webextension state
 * @param tab The tab to fetch all (first party) cookies for.
 */
export const getAllCookiesForDomain = async (
  state: State,
  tab: browser.tabs.Tab,
): Promise<browser.cookies.Cookie[] | undefined> => {
  if (!tab.url || tab.url === '') return;
  if (tab.url.startsWith('about:') || tab.url.startsWith('chrome:')) return;
  const debug = getSetting(state, SettingID.DEBUG_MODE) as boolean;
  const partialTabInfo = createPartialTabInfo(tab);
  const { cookieStoreId, url } = tab;
  const hostname = getHostname(url);
  if (hostname === '') {
    cadLog(
      {
        msg: 'Libs.getAllCookiesForDomain:  hostname parsed empty for tab url.',
        x: { partialTabInfo, hostname },
      },
      debug,
    );
    return;
  }
  const cookies: browser.cookies.Cookie[] = [];
  const mainDomain = extractMainDomain(hostname);

  if (hostname.startsWith('file:')) {
    const allCookies = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        storeId: cookieStoreId,
      }),
    );
    const regExp = new RegExp(hostname.slice(7)); // take out 'file://'
    cadLog(
      {
        msg:
          'Libs.getAllCookiesForDomain:  Local File Regex to rest on cookie.path',
        x: { partialTabInfo, hostname, regExp: regExp.toString() },
      },
      debug,
    );
    allCookies
      .filter((c) => c.domain === '' && regExp.test(c.path))
      .forEach((cc) => cookies.push(cc));
  } else if (await isFirstPartyIsolate()) {
    // Firefox Only - FirstPartyIsolation - original method
    cadLog(
      {
        msg:
          'Libs.getAllCookiesForDomain:  browser.cookies.getAll for domain (firstPartyIsolation).',
        x: {
          partialTabInfo,
          domain: hostname,
          firstPartyDomain: mainDomain,
        },
      },
      debug,
    );
    const cookiesFPI = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        domain: hostname,
        firstPartyDomain: mainDomain,
        storeId: cookieStoreId,
      }),
    );
    cookiesFPI.forEach((c) => cookies.push(c));
    // Try to get additional firstParty Isolation cookies if
    // firstparty.isolation.use_site was enabled, to which we don't know
    const siteURL = new URL(url);
    const proto = siteURL.protocol.replace(':', '');
    // firstPartyDomain = (https,domain.com)
    cadLog(
      {
        msg:
          'Libs.getAllCookiesForDomain:  browser.cookies.getAll for domain (FirstPartyIsolation - use_site).',
        x: {
          partialTabInfo,
          domain: hostname,
          firstPartyDomain: `(${proto},${mainDomain})`,
        },
      },
      debug,
    );
    const cookiesFPIUseSite = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        domain: hostname,
        firstPartyDomain: `(${proto},${mainDomain})`,
        storeId: cookieStoreId,
      }),
    );
    cookiesFPIUseSite.forEach((c) => cookies.push(c));
    // firstPartyDomain = (https,domain.com,2048)
    // Should only be used when domain is an IP, but just in case.
    if (siteURL.port) {
      cadLog(
        {
          msg:
            'Libs.getAllCookiesForDomain:  browser.cookies.getAll for domain (FirstPartyIsolation - use_site + port).',
          x: {
            partialTabInfo,
            domain: hostname,
            firstPartyDomain: `(${proto},${mainDomain},${siteURL.port})`,
          },
        },
        debug,
      );
      const cookiesFPIUseSitePort = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(state, {
          domain: hostname,
          firstPartyDomain: `(${proto},${mainDomain},${siteURL.port})`,
          storeId: cookieStoreId,
        }),
      );
      cookiesFPIUseSitePort.forEach((c) => cookies.push(c));
    }
  } else {
    // Chrome / Firefox non-firstPartyIsolation
    cadLog(
      {
        msg: 'Libs.getAllCookiesForDomain:  browser.cookies.getAll for domain.',
        x: {
          partialTabInfo,
          domain: hostname,
        },
      },
      debug,
    );
    const cookiesDomain = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        domain: hostname,
        storeId: cookieStoreId,
      }),
    );
    cookiesDomain.forEach((c) => cookies.push(c));
  }

  cadLog(
    {
      msg: 'Libs.getAllCookiesForDomain:  Filtered Cookie Count',
      x: {
        partialTabInfo,
        tabURL: tab.url,
        hostname,
        cookieCount: cookies.length,
      },
    },
    debug,
  );

  return cookies;
};

/**
 * Gets the default expression options depending on the list/storeId.
 * If storeId is not default, it will try to get defaults set in default list
 * before using CAD defaults (all checked).
 * @param state The State (store.getState())
 * @param storeId The container id, or 'default'
 * @param listType The List Type
 */
export const getContainerExpressionDefault = (
  state: State,
  storeId: string,
  listType: ListType,
): Expression => {
  const getExpression = (list: string): Expression | undefined => {
    return state.lists[list]
      ? state.lists[list].find((exp) => {
          return (
            exp.listType === listType &&
            exp.expression === `_Default:${listType}`
          );
        })
      : undefined;
  };
  const exp: Expression = {
    expression: '',
    listType: ListType.WHITE,
    storeId: '',
  };
  const expDefault =
    storeId !== 'default' && getSetting(state, SettingID.CONTEXTUAL_IDENTITIES)
      ? getExpression('default') || exp
      : exp;
  return getExpression(storeId) || expDefault;
};

/**
 * Returns the host name of the url.
 *   - https://en.wikipedia.org/wiki/Cat ==> en.wikipedia.org
 *
 * Local file will return the directory of that file.
 *   - file:///home/user/documents/file.html ==> file:///home/user/documents
 *   - file:///D:/user/documents/file.html ==> file:///D:/user/documents
 */
export const getHostname = (urlToGetHostName: string | undefined): string => {
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
    // Remove enclosing [ ] from IPv6 for ipaddr parsing
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      return hostname.slice(1, -1);
    }
    return hostname;
  } catch (e) {
    return '';
  }
};

/**
 * Returns all matched Expressions from a single list.
 * Can pass in either a single list of Expression or the entire State
 * First checks for IP, then CIDR, then falls back to Regular Expression.
 * If no input given, return all expressions from that list.
 * @param lists The Container List of Expressions from State.lists
 * @param search whether we're searching for a regex or matching
 * @param input The string for testing
 * @param storeId The storeId/Container
 */
export const getMatchedExpressions = (
  lists: StoreIdToExpressionList,
  storeId: string,
  input?: string,
  search = false,
): ReadonlyArray<Expression> => {
  const expressions = lists[storeId] || [];
  if (expressions.length === 0 || !input || input.trim().length == 0)
    return expressions;
  // Check if input is a valid IP Address (IPv4 or IPv6) (non-CIDR)
  // This takes care of IPv4-mapped IPv6 address (converts to IPv4 counterpart)
  let iip = ipaddr.isValid(input) ? ipaddr.process(input) : undefined;
  // If initial test passes, do further checks.
  // This makes sure the IP Address is a full four part decimal.
  if (
    iip &&
    iip.kind() == 'ipv4' &&
    !ipaddr.IPv4.isValidFourPartDecimal(input)
  ) {
    iip = undefined;
  }
  return expressions.filter((expression) => {
    const exp = expression.expression;
    if (iip) {
      const ipResult = matchIPInExpression(exp, iip);
      if (ipResult !== undefined) return ipResult;
    } // Input not an IP.  Fallback to Regexp
    return search
      ? getSearchResults(exp, input)
      : new RegExp(globExpressionToRegExp(exp)).test(input);
  });
};

/**
 * Attempts to match an expression string in a variety of ways.
 * @param exp  string - The expression/domain string
 * @param input  string - The string to search for
 */
export const getSearchResults = (
  exp: Expression['expression'],
  input: string,
): boolean => {
  try {
    const ixp1 = globExpressionToRegExp(input).slice(0, -1).toLowerCase();
    const exp1 = exp.toLowerCase();
    const exp2 = exp1.slice(exp1.startsWith('*.') ? 2 : 0);
    return (
      new RegExp(globExpressionToRegExp(exp), 'i').test(input) ||
      new RegExp(globExpressionToRegExp(input), 'i').test(exp) ||
      new RegExp(ixp1, 'i').test(exp) ||
      exp1.startsWith(ixp1) ||
      exp1.startsWith(input) ||
      exp2.startsWith(input) ||
      exp2.startsWith(ixp1) ||
      exp1.endsWith(ixp1) ||
      exp1.endsWith(input) ||
      exp1.includes(ixp1)
    );
  } catch (e) {
    return false;
  }
};

/**
 * Gets the value of the setting
 */
export const getSetting = (
  state: State,
  settingName: SettingID,
): string | number | boolean => state.settings[settingName].value;

/**
 * Gets a sanitized cookieStoreId
 */
export const getStoreId = (state: State, storeId: string): string => {
  if (
    storeId === 'firefox-default' ||
    (!getSetting(state, SettingID.CONTEXTUAL_IDENTITIES) &&
      storeId !== 'firefox-private' &&
      isFirefox(state.cache)) ||
    (isChrome(state.cache) && storeId === '0') ||
    (state.cache.browserDetect === browserName.Opera && storeId === '0')
  ) {
    return 'default';
  }
  if (isChrome(state.cache) && storeId === '1') {
    return 'private';
  }

  return storeId;
};

/**
 * Converts a expression to its regular expression equivalent
 */
export const globExpressionToRegExp = (glob: string): string => {
  const normalizedGlob = glob.trim();
  if (normalizedGlob.slice(0, 1) === '/' && normalizedGlob.slice(-1) === '/') {
    // Treat /str/ as regular expression str
    return normalizedGlob.slice(1, -1);
  }
  const wildStart = normalizedGlob.startsWith('*.');

  return `${`${wildStart ? '(^|.)' : '^'}${normalizedGlob.slice(
    wildStart ? 2 : 0,
  )}`
    .replace(/[[\]\\/.]/g, '\\$&')
    .replace(/\*/g, '.*')}$`;
};

/**
 * Returns true if it is an IP (v4 or v6)
 */
export const isAnIP = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }
  const hostname = getHostname(url);
  return ipaddr.isValid(hostname);
};

/**
 * Returns true if it is a webpage or a local file
 */
export const isAWebpage = (URL: string | undefined): boolean => {
  if (!URL) {
    return false;
  }
  return !!(URL.match(/^http:/) || URL.match(/^https:/) || URL.match(/^file:/));
};

/**
 * Test if browser is Chrome
 * @param cache Cache containing browserDetect
 */
export const isChrome = (cache: CacheMap): boolean => {
  return (
    Object.prototype.hasOwnProperty.call(cache, 'browserDetect') &&
    cache.browserDetect === browserName.Chrome
  );
};

/**
 * Test if browser is Firefox (Desktop or Mobile/Android)
 * @param cache Cache containing browserDetect
 */
export const isFirefox = (cache: CacheMap): boolean => {
  return (
    Object.prototype.hasOwnProperty.call(cache, 'browserDetect') &&
    cache.browserDetect === browserName.Firefox
  );
};

/**
 * Test if browser is Firefox Mobile/Android
 * @param cache Cache containing browserDetect and platformOs
 */
export const isFirefoxAndroid = (cache: CacheMap): boolean => {
  return (
    isFirefox(cache) &&
    Object.prototype.hasOwnProperty.call(cache, 'platformOs') &&
    cache.platformOs === 'android'
  );
};

/**
 * Test if browser is Firefox but not Android/mobile version
 * @param cache Cache containing browserDetect and platformOs
 */
export const isFirefoxNotAndroid = (cache: CacheMap): boolean => {
  return (
    isFirefox(cache) &&
    Object.prototype.hasOwnProperty.call(cache, 'platformOs') &&
    cache.platformOs !== 'android'
  );
};

/**
 * Test for FirstPartyIsolation (Firefox).
 * Workaround for not needing Firefox 'Privacy' permission.
 */
export const isFirstPartyIsolate = async (): Promise<boolean> => {
  return browser.cookies
    .getAll({
      domain: '',
    })
    .then(() => {
      // No error = most likely not enabled.
      return Promise.resolve(false);
    })
    .catch((e) => {
      // Error usually if firstPartyIsolate is enabled as it requires firstPartyDomain Property.
      return Promise.resolve(e.message.indexOf('firstPartyDomain') !== -1);
    });
};

/*
 * Checks if the hostname given is a local file
 */
export const localFileToRegex = (hostname: string): string => {
  if (hostname === '') return '';
  if (hostname.startsWith('file:') || hostname.indexOf('/') === 0) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
    return hostname.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
  }
  return hostname; // Doesn't have a file path...return as is.
};

/**
 * Checks if given IP Address is in an Expression.
 * Attempts to match full IP Address, allows CIDR notation.
 * @param iip
 * @param exp
 */
export const matchIPInExpression = (
  exp: Expression['expression'],
  iip: ipaddr.IPv4 | ipaddr.IPv6,
): boolean | undefined => {
  // Check if expression is a single IP Address (IPv4 or IPv6), non CIDR
  if (ipaddr.isValid(exp)) {
    // This takes care of IPv4-mapped IPv6 address (converts to IPv4 counterpart)
    const eip = ipaddr.process(exp);
    // Returns false if trying to match IPv4 and IPv6 together.
    // Putting this through the match function below will throw error.
    if (iip.kind() !== eip.kind()) return false;
    // Both kinds match at this point.
    let bits = 0;
    switch (eip.kind()) {
      case 'ipv4':
        bits = 32;
        break;
      case 'ipv6':
        bits = 128;
        break;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Needed otherwise TS complains about no compatibility in union signatures.
    return eip.match(iip, bits);
  } // Not a single IP Address in Expression.
  // Check for CIDR notation '10.0.0.0/8' or '::/48'
  const cidrNotation = exp.split('/');
  // [0] should be IP, [1] should be CIDR range number
  if (cidrNotation.length === 2) {
    if (ipaddr.isValid(cidrNotation[0])) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Needed otherwise TS complains about no compatibility in union signatures.
        return iip.match(ipaddr.parseCIDR(exp));
      } catch (e) {
        // Most likely an attempt to match IPv4 and IPv6 together,
        // or CIDR is invalid.
        return false;
      }
    } // First part is not a valid IP.  Fallback to Regexp.
  } // Expression Slash Array length not 2.  Fallback to Regexp.
  return undefined;
};

/**
 * Parse cookieStoreId for use in addExpressionUI...
 */
export const parseCookieStoreId = (
  contextualIdentities: boolean,
  cookieStoreId: string | undefined,
): string => {
  return !contextualIdentities ||
    (cookieStoreId && cookieStoreId === 'firefox-default')
    ? 'default'
    : cookieStoreId || 'default';
};

/**
 * Prepare Domains for all cleanups.
 */
export const prepareCleanupDomains = (
  domain: string,
  bName: browserName = browserDetect() as browserName,
): string[] => {
  if (domain.trim() === '') return [];
  const www = new RegExp(/^www[0-9a-z]?\./i);
  const sDot = new RegExp(/^\./);
  let d: string = domain.trim();
  const domains = new Set<string>();
  if (sDot.test(d)) {
    // dot at beginning.  .sub.doma.in(.)
    d = d.slice(1);
  }
  // at this point it should be all unison - sub.doma.in(.)
  domains.add(d); // sub.doma.in
  domains.add(`.${d}`); // .sub.doma.in

  if (!www.test(d)) {
    domains.add(`www.${d}`); // www.sub.doma.in
    domains.add(`.www.${d}`); // .www.sub.doma.in
  }

  if (bName === browserName.Chrome || bName === browserName.Opera) {
    const origins: string[] = [];
    for (const d of domains) {
      origins.push(`http://${d}`);
      origins.push(`https://${d}`);
    }
    return origins;
  }

  return Array.from(domains);
};

/**
 * Puts the domain in the right format for browser.cookies.remove()
 */
export const prepareCookieDomain = (cookie: browser.cookies.Cookie): string => {
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

  return `http${cookie.secure ? 's' : ''}://${cookieDomain.slice(sDot)}${
    cookie.path
  }`;
};

/**
 * Returns the first available matched expression.
 * wrapper for getMatchedExpressions
 */
export const returnMatchedExpressionObject = (
  state: State,
  cookieStoreId: string,
  hostname: string,
): Expression | undefined => {
  return getMatchedExpressions(
    state.lists,
    getStoreId(state, cookieStoreId),
    hostname,
  )[0];
};

/**
 * Return optional attributes for the Cookie API calls
 */
export const returnOptionalCookieAPIAttributes = (
  state: State | CacheMap,
  cookieAPIAttributes: Partial<CookiePropertiesCleanup> & {
    [x: string]: any;
  },
): Partial<CookiePropertiesCleanup> => {
  // Add optional firstPartyDomain attribute
  // To fetch firstPartyIsolation cookies even if FPI is off,
  // set firstPartyDomain to null.
  if (
    isFirefox(state.cache) &&
    !Object.prototype.hasOwnProperty.call(
      cookieAPIAttributes,
      'firstPartyDomain',
    )
  ) {
    return {
      ...cookieAPIAttributes,
      firstPartyDomain: undefined,
    };
  }
  // Only remove FPI Property if it is NOT firefox.
  if (!isFirefox(state.cache)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { firstPartyDomain, ...rest } = cookieAPIAttributes;
    return rest;
  }
  return cookieAPIAttributes;
};

/**
 * Show a notification
 * @param x Contains object consisting of:
 *          - duration: number in seconds
 *          - msg: notification content
 *          - title: notification title
 * @param display Whether to display the notification.
 */
export const showNotification = (
  x: {
    duration: number;
    msg: string;
    title?: string;
  },
  display = true,
): void => {
  if (!display) return;
  const sid = `CAD-notification-${shortid.generate()}`;
  browser.notifications.create(sid, {
    iconUrl: browser.runtime.getURL('icons/icon_48.png'),
    message: x.msg,
    title: `CAD ${browser.runtime.getManifest().version} - ${
      x.title ? x.title : browser.i18n.getMessage('manualActionNotification')
    }`,
    type: 'basic',
  });
  setTimeout(() => {
    browser.notifications.clear(sid);
  }, x.duration * 1000);
};

/**
 * Makes the proper site data property key for browser.browsingData.remove.
 * i.e. Cache => cache ; LocalStorage => localStorage
 * @param siteData The Site Data to convert to browser format.
 */
export const siteDataToBrowser = (siteData: SiteDataType): string =>
  `${siteData[0].toLowerCase()}${siteData.slice(1)}`;

/**
 * Sleep execution for ms.
 * Ensures no 0 second setTimeout otherwise side effects.
 * Ensures we don't go over max signed 32-bit Int of 2,147,483,647
 */
export const sleep = (ms: number): Promise<any> => {
  return new Promise((r) =>
    setTimeout(r, ms < 250 ? 250 : ms > 2147483500 ? 2147483500 : ms),
  );
};

/**
 * Show an Error notification
 * @param e The Error (Error Object)
 * @param duration number in seconds
 */
export const throwErrorNotification = (e: Error, duration: number): void => {
  const nid = `CAD-notification-failed-${shortid.generate()}`;
  browser.notifications.create(nid, {
    iconUrl: browser.runtime.getURL('icons/icon_red_48.png'),
    message: e.message,
    title: browser.i18n.getMessage('errorText'),
    type: 'basic',
  });
  setTimeout(() => {
    browser.notifications.clear(nid);
  }, duration * 1000);
};

/**
 * Trim leading and ending dot of a string
 */
export const trimDot = (str: string): string => str.replace(/^[.]+|[.]+$/g, '');

/**
 * Opposite of a falsey check for undefined
 */
export const undefinedIsTrue = (bool: boolean | undefined): boolean => {
  if (bool === undefined) return true;
  return bool;
};

/**
 * Validate a single Expression.
 * Returns undefined if valid.  Otherwise returns an error message.
 * @param input The Domain Expression to validate.
 */
export const validateExpressionDomain = (input: string): string => {
  const inputTrim = input.trim();
  if (!inputTrim) return browser.i18n.getMessage('inputErrorEmpty');
  if (inputTrim.startsWith('/') && inputTrim.endsWith('/')) {
    // Regular Expression
    try {
      new RegExp(inputTrim.slice(1, -1));
    } catch (e) {
      return browser.i18n.getMessage('inputErrorRegExp', [`${e}`]);
    }
  } else {
    // not Regex
    if (inputTrim.startsWith('/')) {
      // missing end slash.
      return browser.i18n.getMessage('inputErrorSlashStartMissingEnd');
    }
    if (inputTrim.endsWith('/')) {
      // missing beginning slash, or not regex
      return browser.i18n.getMessage('inputErrorSlashEndMissingStart');
    }
    if (inputTrim.indexOf(',') !== -1) {
      // no commas allowed in non-regex
      return browser.i18n.getMessage('inputErrorComma');
    }
  }
  if (inputTrim.indexOf(' ') !== -1) {
    // no spaces allowed in hostnames or RegExp.
    return browser.i18n.getMessage('inputErrorSpace');
  }
  return '';
};
