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

import {
  CADCOOKIENAME,
  cadLog,
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  isChrome,
  isFirefoxNotAndroid,
  isFirstPartyIsolate,
  prepareCleanupDomains,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  showNotification,
  throwErrorNotification,
  undefinedIsTrue,
} from './Libs';
import ActivityLog from '../ui/settings/components/ActivityLog';

/** Prepare a cookie for deletion */
export const prepareCookie = (
  cookie: browser.cookies.Cookie,
  debug = false,
): CookiePropertiesCleanup => {
  const cookieProperties = {
    ...cookie,
    hostname: '',
    mainDomain: '',
    preparedCookieDomain: prepareCookieDomain(cookie),
  };
  if (cookieProperties.preparedCookieDomain.startsWith('file:')) {
    cookieProperties.hostname = cookieProperties.preparedCookieDomain;
    cookieProperties.mainDomain = cookieProperties.preparedCookieDomain;
  } else {
    cookieProperties.hostname = getHostname(
      cookieProperties.preparedCookieDomain,
    );
    cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
  }
  cadLog(
    {
      msg: 'CleanupService.prepareCookie: results',
      x: {
        domain: cookie.domain,
        path: cookie.path,
        preparedCookieDomain: cookieProperties.preparedCookieDomain,
        mainDomain: cookieProperties.mainDomain,
        hostname: cookieProperties.hostname,
      },
    },
    debug,
  );
  return cookieProperties;
};

/** Returns an object representing the cookie with internal flags */
export const isSafeToClean = (
  state: State,
  cookieProperties: CookiePropertiesCleanup,
  cleanupProperties: CleanupPropertiesInternal,
): CleanReasonObject => {
  const debug = getSetting(state, 'debugMode') as boolean;
  const {
    mainDomain,
    storeId,
    hostname,
    name,
    expirationDate,
    firstPartyDomain,
    session,
  } = cookieProperties;
  const partialCookieInfo = {
    mainDomain,
    storeId,
    hostname,
    name,
    expirationDate,
    firstPartyDomain,
    session,
  };
  const { greyCleanup, openTabDomains, ignoreOpenTabs } = cleanupProperties;
  const openTabStatus = ignoreOpenTabs
    ? OpenTabStatus.TabsWereIgnored
    : OpenTabStatus.TabsWasNotIgnored;
  cadLog(
    {
      msg: 'CleanupService.isSafeToClean:  Properties Debug',
      x: { partialCookieInfo, cleanupProperties, openTabStatus },
    },
    debug,
  );

  // Check if cookie is expired.
  if (getSetting(state, 'cleanExpiredCookies') as boolean) {
    const now = Math.ceil(Date.now() / 1000);
    if (expirationDate && expirationDate < now) {
      cadLog(
        {
          msg: `CleanupService.isSafeToClean:  Cookie Expired since ${expirationDate}.  Date.now is ${now}`,
          x: partialCookieInfo,
        },
        debug,
      );
      return {
        cached: false,
        cleanCookie: true,
        cookie: cookieProperties,
        openTabStatus,
        reason: ReasonClean.ExpiredCookie,
      };
    }
  }

  // Tests if the main domain is open on that specific storeId/container
  if (openTabDomains[storeId] && openTabDomains[storeId].includes(mainDomain)) {
    cadLog(
      {
        msg: `CleanupService.isSafeToClean:  mainDomain found in openTabsDomain[${storeId}] - not cleaning.`,
        x: { partialCookieInfo, openTabsInStoreId: openTabDomains[storeId] },
      },
      debug,
    );
    return {
      cached: false,
      cleanCookie: false,
      cookie: cookieProperties,
      openTabStatus,
      reason: ReasonKeep.OpenTabs,
    };
  }

  // Checks the list for the first available match
  const matchedExpression = returnMatchedExpressionObject(
    state,
    storeId,
    hostname,
  );

  // Startup cleanup checks
  if (greyCleanup && !matchedExpression) {
    cadLog(
      {
        msg:
          'CleanupService.isSafeToClean:  unmatched and greyCleanup.  Safe to Clean',
        x: partialCookieInfo,
      },
      debug,
    );
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      openTabStatus,
      reason: ReasonClean.StartupNoMatchedExpression,
    };
  }

  if (
    greyCleanup &&
    matchedExpression &&
    matchedExpression.listType === ListType.GREY &&
    // Tests the cleanAllCookies flag and if it doesn't include that name or if there is no cookieNames
    (undefinedIsTrue(matchedExpression.cleanAllCookies) ||
      (matchedExpression.cookieNames &&
        !matchedExpression.cookieNames.includes(cookieProperties.name)))
  ) {
    cadLog(
      {
        msg:
          'CleanupService.isSafeToClean:  greyCleanup - matching Expression and cookie name was unchecked.  Safe to Clean.',
        x: { partialCookieInfo, matchedExpression },
      },
      debug,
    );
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.StartupCleanupAndGreyList,
    };
  }

  // Normal cleanup checks
  if (!matchedExpression) {
    cadLog(
      {
        msg:
          'CleanupService.isSafeToClean:  unmatched Expression.  Safe to Clean.',
        x: partialCookieInfo,
      },
      debug,
    );
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      openTabStatus,
      reason: ReasonClean.NoMatchedExpression,
    };
  }
  if (
    matchedExpression &&
    !undefinedIsTrue(matchedExpression.cleanAllCookies) &&
    matchedExpression.cookieNames &&
    !matchedExpression.cookieNames.includes(cookieProperties.name)
  ) {
    cadLog(
      {
        msg:
          'CleanupService.isSafeToClean:  matched Expression but unchecked cookie name.  Safe to Clean.',
        x: { partialCookieInfo, matchedExpression },
      },
      debug,
    );
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.MatchedExpressionButNoCookieName,
    };
  }
  cadLog(
    {
      msg:
        'CleanupService.isSafeToClean:  Matched Expression and cookie name.  Cookie stays!',
      x: { partialCookieInfo, matchedExpression },
    },
    debug,
  );
  return {
    cached: false,
    cleanCookie: false,
    cookie: cookieProperties,
    expression: matchedExpression,
    openTabStatus,
    reason: ReasonKeep.MatchedExpression,
  };
};

/** Clean cookies */
export const cleanCookies = async (
  state: State,
  markedForDeletion: CleanReasonObject[],
  firstPartyIsolate: boolean,
): Promise<void> => {
  const promiseArr: Promise<browser.cookies.Cookie | null>[] = [];
  markedForDeletion.forEach((obj) => {
    const cookieProperties = obj.cookie;
    const cookieAPIProperties = returnOptionalCookieAPIAttributes(
      state,
      {
        firstPartyDomain: cookieProperties.firstPartyDomain,
        storeId: cookieProperties.storeId,
      },
      firstPartyIsolate,
    );
    const cookieRemove = {
      ...cookieAPIProperties,
      name: cookieProperties.name,
      url: cookieProperties.preparedCookieDomain,
    };
    cadLog(
      {
        msg:
          'CleanupService.cleanCookies: Cookie being removed through browser.cookies.remove via Promises:',
        x: cookieRemove,
      },
      getSetting(state, 'debugMode') as boolean,
    );
    // url: "http://domain.com" + cookies[i].path
    const promise = browser.cookies.remove(cookieRemove);
    promiseArr.push(promise);
  });
  await Promise.all(promiseArr).catch((e) => {
    throw e;
  });
};

// Cleanup of all cookies for domain.
export const clearCookiesForThisDomain = async (
  state: State,
  tab: browser.tabs.Tab,
): Promise<boolean> => {
  const hostname = getHostname(tab.url);
  const firstPartyIsolate = await isFirstPartyIsolate();
  const getCookies = await browser.cookies.getAll(
    returnOptionalCookieAPIAttributes(
      state,
      {
        domain: hostname,
        storeId: tab.cookieStoreId,
      },
      firstPartyIsolate,
    ),
  );
  // Filter out our own CAD cookie that cleans up other Browsing Data
  const cookies = getCookies.filter((c) => c.name !== CADCOOKIENAME);

  if (cookies.length > 0) {
    let cookieDeletedCount = 0;
    for (const cookie of cookies) {
      const r = await browser.cookies.remove(
        returnOptionalCookieAPIAttributes(
          state,
          {
            firstPartyDomain: cookie.firstPartyDomain,
            name: cookie.name,
            storeId: cookie.storeId,
            url: prepareCookieDomain(cookie),
          },
          firstPartyIsolate,
        ) as {
          // This explicit type is required as cookies.remove requires these two
          // parameters, but url is not defined in cookies.Cookie as it is made
          // up of cookie.domain + cookie.path, and neither required parameters
          // can take 'undefined'.  returnOptionalCookieAPIAttributes has the
          // parameters set to Partial<CookiePropertiesCleanup>, which appends
          // '| undefined' to all parameters.
          name: string;
          url: string;
        },
      );
      if (r) cookieDeletedCount += 1;
    }
    showNotification({
      duration: getSetting(state, 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('manualCleanSuccess', [
        browser.i18n.getMessage('cookiesText'),
        hostname,
      ])}\n${browser.i18n.getMessage('manualCleanRemoved', [
        cookieDeletedCount.toString(),
        cookies.length.toString(),
      ])}`,
    });
    return cookieDeletedCount > 0;
  }

  showNotification({
    duration: getSetting(state, 'notificationOnScreen') as number,
    msg: `${browser.i18n.getMessage('manualCleanNothing', [
      browser.i18n.getMessage('cookiesText'),
      hostname,
    ])}`,
  });

  return cookies.length > 0;
};

export const clearLocalstorageForThisDomain = async (
  state: State,
  tab: browser.tabs.Tab,
): Promise<boolean> => {
  // Using this method to ensure cross browser compatiblity
  try {
    let local = 0;
    let session = 0;
    const result = await browser.tabs.executeScript(undefined, {
      code: `var cad_r = {local: window.localStorage.length, session: window.sessionStorage.length};window.localStorage.clear();window.sessionStorage.clear();cad_r;`,
    });
    result.forEach((frame: { [key: string]: any }) => {
      local += frame.local;
      session += frame.session;
    });
    showNotification({
      duration: getSetting(state, 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('manualCleanSuccess', [
        browser.i18n.getMessage('localStorageText'),
        getHostname(tab.url),
      ])}\n${browser.i18n.getMessage('removeStorageCount', [
        local.toString(),
        browser.i18n.getMessage('localStorageText'),
      ])}\n${browser.i18n.getMessage('removeStorageCount', [
        session.toString(),
        browser.i18n.getMessage('sessionStorageText'),
      ])}`,
    });
    return true;
  } catch (e) {
    throwErrorNotification(e);
    showNotification({
      duration: getSetting(state, 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('manualCleanNothing', [
        browser.i18n.getMessage('localStorageText'),
        getHostname(tab.url),
      ])}`,
    });
    return false;
  }
};

export const clearSiteDataForThisDomain = async (
  state: State,
  siteData: string,
  hostname: string,
): Promise<boolean> => {
  if (hostname.trim() === '') return false;
  const debug = getSetting(state, 'debugMode') as boolean;
  cadLog(
    {
      msg: `CleanupService.clearSiteDataForThisDomain: Received ${siteData} clean request for ${hostname}.`,
    },
    debug,
  );
  const domains = prepareCleanupDomains(hostname, isChrome(state.cache));
  if (siteData === 'All') {
    for (const sd of [
      'cache',
      'cookies',
      'indexedDB',
      'localStorage',
      'pluginData',
      'serviceWorkers',
    ]) {
      await removeSiteData(sd, isChrome(state.cache), domains, debug);
    }
  } else {
    await removeSiteData(
      `${siteData[0].toLowerCase()}${siteData.slice(1)}`,
      isChrome(state.cache),
      domains,
      debug,
    );
  }
  return true;
};

export const removeSiteData = async (
  siteData: string,
  isChrome: boolean,
  domains: string[],
  debug: boolean,
): Promise<boolean> => {
  const listName = isChrome ? 'origins' : 'hostnames';
  cadLog(
    {
      msg: `CleanupService.removeSiteData: Cleanup of ${listName} for ${siteData}:`,
      x: domains,
    },
    debug,
  );
  try {
    await browser.browsingData.remove(
      {
        [listName]: domains,
      },
      {
        [siteData]: true,
      },
    );
    return true;
  } catch (e) {
    cadLog(
      {
        msg: `CleanupService.removeSiteData:  browser.browsingData.remove of ${listName} for ${siteData} returned an error:`,
        type: 'error',
        x: e,
      },
      debug,
    );
    throwErrorNotification(e);
    return false;
  }
};

/** This will use the browsingData's hostname/origin attribute to delete any extra browsing data */
export const otherBrowsingDataCleanup = async (
  state: State,
  isSafeToCleanObjects: CleanReasonObject[],
): Promise<ActivityLog['browsingDataCleanup']> => {
  const chrome = isChrome(state.cache);
  const debug = getSetting(state, 'debugMode') as boolean;
  const browsingDataResult: ActivityLog['browsingDataCleanup'] = {};
  if (
    getSetting(state, 'cacheCleanup') &&
    ((isFirefoxNotAndroid(state.cache) && state.cache.browserVersion >= '78') ||
      chrome)
  ) {
    browsingDataResult.cache = await cleanSiteData(
      'Cache',
      isSafeToCleanObjects,
      chrome,
      debug,
    );
  }
  if (
    getSetting(state, 'indexedDBCleanup') &&
    ((isFirefoxNotAndroid(state.cache) && state.cache.browserVersion >= '77') ||
      chrome)
  ) {
    browsingDataResult.indexedDB = await cleanSiteData(
      'IndexedDB',
      isSafeToCleanObjects,
      chrome,
      debug,
    );
  }
  if (
    getSetting(state, 'localstorageCleanup') &&
    ((isFirefoxNotAndroid(state.cache) && state.cache.browserVersion >= '58') ||
      chrome)
  ) {
    browsingDataResult.localStorage = await cleanSiteData(
      'LocalStorage',
      isSafeToCleanObjects,
      chrome,
      debug,
    );
  }
  if (
    getSetting(state, 'pluginDataCleanup') &&
    ((isFirefoxNotAndroid(state.cache) && state.cache.browserVersion >= '78') ||
      isChrome(state.cache))
  ) {
    browsingDataResult.pluginData = await cleanSiteData(
      'PluginData',
      isSafeToCleanObjects,
      chrome,
      debug,
    );
  }
  if (
    getSetting(state, 'serviceWorkersCleanup') &&
    ((isFirefoxNotAndroid(state.cache) && state.cache.browserVersion >= '77') ||
      isChrome(state.cache))
  ) {
    browsingDataResult.serviceWorkers = await cleanSiteData(
      'ServiceWorkers',
      isSafeToCleanObjects,
      chrome,
      debug,
    );
  }

  return browsingDataResult;
};

/**
 * Filters incoming objects with the site data to clean.
 * @param siteData The site data type
 * @param cleanReasonObjects Objects returned from isSafeToClean()
 * @param isChrome True if Chrome Browser
 * @param debug True if debug mode.
 */
export const cleanSiteData = async (
  siteData: string,
  cleanReasonObjects: CleanReasonObject[],
  isChrome: boolean,
  debug: boolean,
): Promise<string[] | undefined> => {
  const domains = cleanReasonObjects
    .filter((obj) => {
      return filterSiteData(
        obj,
        `${siteData[0].toUpperCase()}${siteData.slice(1)}`,
        debug,
      );
    })
    .map((o) => o.cookie.domain)
    .filter((domain) => domain.trim() !== '');

  const cleanList: string[] = [];
  for (const domain of domains) {
    cleanList.push(...prepareCleanupDomains(domain, isChrome));
  }

  if (cleanList.length > 0) {
    const r = await removeSiteData(
      `${siteData[0].toLowerCase()}${siteData.slice(1)}`,
      isChrome,
      [...new Set(cleanList)],
      debug,
    );
    if (r) {
      return domains;
    }
  }
  return undefined;
};

/** Setup SiteData cleaning.  Undefined will not be cleaned. */
export const parseCleanSiteData = (bool?: boolean): boolean => {
  return bool === undefined ? false : bool;
};

/** Filter the deleted cookies from site data type */
export const filterSiteData = (
  obj: CleanReasonObject,
  siteData: string,
  debug = false,
): boolean => {
  const notProtectedByOpenTab = obj.reason !== ReasonKeep.OpenTabs;
  const notInAnyLists =
    obj.reason === ReasonClean.NoMatchedExpression ||
    obj.reason === ReasonClean.StartupNoMatchedExpression;
  const nonBlankCookieHostName = obj.cookie.hostname.trim() !== '';
  const canCleanSiteData = parseCleanSiteData(
    obj.expression
      ? (obj.expression[`clean${siteData}` as keyof Expression] as
          | boolean
          | undefined)
      : undefined,
  );
  const cro: CleanReasonObject = {
    ...obj,
    cookie: {
      ...obj.cookie,
      value: debug ? '***' : obj.cookie.value,
    },
  };
  cadLog(
    {
      msg: 'CleanupService.filterSiteData: debug data.',
      x: {
        siteData,
        notProtectedByOpenTab,
        notInAnyLists,
        canCleanSiteData,
        nonBlankCookieHostName,
        clean2: notProtectedByOpenTab && canCleanSiteData,
        CleanReasonObject: cro,
      },
    },
    debug,
  );
  const r =
    (notInAnyLists || (notProtectedByOpenTab && canCleanSiteData)) &&
    nonBlankCookieHostName;
  cadLog(
    {
      msg: `CleanupService.filterSiteData: ${siteData} cleanup returned ${r} for ${cro.cookie.hostname}`,
    },
    debug,
  );
  return r;
};

/**
 * Store all tabs' host domains to prevent cookie deletion from those domains
 * returns empty object if we ignore all open Tabs
 * Tabs now grouped by container e.g. 'default', 'firefox-container-1', '0'
 */
export const returnContainersOfOpenTabDomains = async (
  ignoreOpenTabs: boolean,
  cleanDiscardedTabs: boolean,
): Promise<Record<string, string[]>> => {
  if (ignoreOpenTabs) {
    return {};
  }
  const tabs = await browser.tabs.query({
    windowType: 'normal',
  });
  const openTabs: { [k: string]: Set<string> } = {};
  for (const tab of tabs) {
    if (isAWebpage(tab.url) && (!cleanDiscardedTabs || !tab.discarded)) {
      // Chrome doesn't have tab.cookieStoreId, so rely on tab.incognito
      const cookieStoreId = tab.cookieStoreId || (tab.incognito ? '1' : '0');
      if (!openTabs[cookieStoreId]) {
        openTabs[cookieStoreId] = new Set<string>();
      }
      openTabs[cookieStoreId].add(extractMainDomain(getHostname(tab.url)));
    }
  }
  const openTabsArray: { [k: string]: string[] } = {};
  for (const id of Object.keys(openTabs)) {
    openTabsArray[id] = Array.from(openTabs[id]);
  }
  return openTabsArray;
};

/** Main function for cookie cleanup. Returns a list of domains that cookies were deleted from */
export const cleanCookiesOperation = async (
  state: State,
  cleanupProperties: CleanupProperties = {
    greyCleanup: false,
    ignoreOpenTabs: false,
  },
): Promise<Record<string, any>> => {
  const debug = getSetting(state, 'debugMode') as boolean;
  const setOfDeletedDomainCaches = new Set<string>();
  const setOfDeletedDomainCookies = new Set<string>();
  const setOfDeletedDomainIndexedDB = new Set<string>();
  const setOfDeletedDomainLocalStorage = new Set<string>();
  const setOfDeletedDomainPluginData = new Set<string>();
  const setOfDeletedDomainServiceWorkers = new Set<string>();
  const cachedResults: ActivityLog = {
    dateTime: new Date().toString(),
    recentlyCleaned: 0,
    storeIds: {},
    browsingDataCleanup: {},
  };
  const openTabDomains = await returnContainersOfOpenTabDomains(
    cleanupProperties.ignoreOpenTabs,
    getSetting(state, 'discardedCleanup') as boolean,
  );
  const newCleanupProperties: CleanupPropertiesInternal = {
    ...cleanupProperties,
    openTabDomains,
  };
  const firstPartyIsolate = await isFirstPartyIsolate();

  const cookieStoreIds = new Set<string>();

  // Manually add default containers.
  switch (state.cache.browserDetect) {
    case 'Firefox':
      cookieStoreIds.add('default');
      cookieStoreIds.add('firefox-default');
      if (await browser.extension.isAllowedIncognitoAccess()) {
        cookieStoreIds.add('firefox-private');
        cookieStoreIds.add('private');
      }
      break;
    case 'Chrome':
    case 'Opera':
      cookieStoreIds.add('0');
      if (await browser.extension.isAllowedIncognitoAccess()) {
        cookieStoreIds.add('1');
      }
      break;
    default:
      break;
  }

  // Store cookieStoreIds from the contextualIdentities API
  if (getSetting(state, 'contextualIdentities')) {
    const contextualIdentitiesObjects = await browser.contextualIdentities.query(
      {},
    );

    for (const cio of contextualIdentitiesObjects) {
      cookieStoreIds.add(cio.cookieStoreId);
    }
  }

  // Store cookieStoreIds from the cookies API
  const cookieStores = (await browser.cookies.getAllCookieStores()) || [];
  for (const store of cookieStores) {
    if (
      getSetting(state, 'contextualIdentities') ||
      !store.id.startsWith('firefox-container')
    ) {
      cookieStoreIds.add(store.id);
    }
  }

  // Clean for each cookieStore jar
  for (const id of cookieStoreIds) {
    let cookies: browser.cookies.Cookie[] = [];
    try {
      cookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(
          state,
          {
            storeId: id,
          },
          firstPartyIsolate,
        ),
      );
    } catch (e) {
      cadLog(
        {
          msg: `CleanupService.cleanCookiesOperation:  browser.cookies.getAll for id: ${id} threw an error.`,
          type: 'error',
          x: e.message,
        },
        true,
      );
    }

    // No cookies from specified container.  Skip rest of cleanup.
    if (!cookies || cookies.length === 0) continue;

    const isSafeToCleanObjects = cookies.map((cookie) => {
      return isSafeToClean(
        state,
        prepareCookie(cookie, debug),
        newCleanupProperties,
      );
    });

    if (debug) {
      // We need deep copying object to as to not change actual cookies
      const sanitized: CleanReasonObject[] = isSafeToCleanObjects.map((obj) => {
        return {
          ...obj,
          cookie: {
            ...obj.cookie,
            value: '***',
          },
        };
      });
      cadLog(
        {
          msg:
            'CleanupService.cleanCookiesOperation:  isSafeToCleanObjects Result',
          x: sanitized,
        },
        debug,
      );
    }

    const markedForDeletion = isSafeToCleanObjects.filter((obj) => {
      const r = obj.cleanCookie && obj.cookie.hostname.trim() !== '';
      cadLog(
        {
          msg: `CleanupService.cleanCookiesOperation: Clean Cookies returned ${r} for ${obj.cookie.hostname}`,
        },
        debug,
      );
      return r;
    });

    if (debug) {
      // We need deep copying object to as to not change actual cookies
      const sanitized: CleanReasonObject[] = markedForDeletion.map((obj) => {
        return {
          ...obj,
          cookie: {
            ...obj.cookie,
            value: '***',
          },
        };
      });
      cadLog(
        {
          msg:
            'CleanupService.cleanCookiesOperation:  Cookies markedForDeletion Result',
          x: sanitized,
        },
        debug,
      );
    }

    try {
      await cleanCookies(state, markedForDeletion, firstPartyIsolate);
    } catch (e) {
      cadLog(
        {
          type: 'error',
          x: e,
        },
        true,
      );
      throwErrorNotification(e);
    }

    if (markedForDeletion.length !== 0) {
      cachedResults.storeIds[id] = markedForDeletion;
    }
    cachedResults.recentlyCleaned += markedForDeletion.length;
    markedForDeletion.forEach((obj) => {
      setOfDeletedDomainCookies.add(
        getSetting(state, 'contextualIdentities')
          ? `${obj.cookie.hostname} (${state.cache[obj.cookie.storeId]})`
          : obj.cookie.hostname,
      );
    });

    // Handle all other browsingData cleanups.
    const storeResults = await otherBrowsingDataCleanup(
      state,
      isSafeToCleanObjects,
    );
    if (storeResults.cache) {
      storeResults.cache.forEach((d) => {
        setOfDeletedDomainCaches.add(d);
      });
    }
    if (storeResults.indexedDB) {
      storeResults.indexedDB.forEach((d) => {
        setOfDeletedDomainIndexedDB.add(d);
      });
    }
    if (storeResults.localStorage) {
      storeResults.localStorage.forEach((d) => {
        setOfDeletedDomainLocalStorage.add(d);
      });
    }
    if (storeResults.pluginData) {
      storeResults.pluginData.forEach((d) => {
        setOfDeletedDomainPluginData.add(d);
      });
    }
    if (storeResults.serviceWorkers) {
      storeResults.serviceWorkers.forEach((d) => {
        setOfDeletedDomainServiceWorkers.add(d);
      });
    }
  }
  cachedResults.browsingDataCleanup = {
    cache: Array.from(setOfDeletedDomainCaches),
    indexedDB: Array.from(setOfDeletedDomainIndexedDB),
    localStorage: Array.from(setOfDeletedDomainLocalStorage),
    pluginData: Array.from(setOfDeletedDomainPluginData),
    serviceWorkers: Array.from(setOfDeletedDomainServiceWorkers),
  };

  // Scrub private cookieStores
  const storesIdsToScrub = ['firefox-private', 'private', '1'];
  for (const id of storesIdsToScrub) {
    delete cachedResults.storeIds[id];
  }

  return {
    cachedResults,
    setOfDeletedDomainCookies: Array.from(setOfDeletedDomainCookies),
  };
};
