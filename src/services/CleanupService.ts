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
  cadLog,
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  isFirstPartyIsolate,
  LSCLEANUPNAME,
  prepareCleanupDomains,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  showNotification,
  throwErrorNotification,
  undefinedIsTrue,
} from './Libs';

/** Prepare a cookie for deletion */
export const prepareCookie = (cookie: browser.cookies.Cookie, debug = false) => {
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
    cookieProperties.hostname = getHostname(cookieProperties.preparedCookieDomain);
    cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
  }
  cadLog({
    msg: 'CleanupService.prepareCookie: results',
    x: {
      domain: cookie.domain,
      path: cookie.path,
      preparedCookieDomain: cookieProperties.preparedCookieDomain,
      mainDomain: cookieProperties.mainDomain,
      hostname: cookieProperties.hostname,
    },
  }, debug);
  return cookieProperties;
};

/** Returns an object representing the cookie with internal flags */
export const isSafeToClean = (
  state: State,
  cookieProperties: CookiePropertiesCleanup,
  cleanupProperties: CleanupPropertiesInternal,
): CleanReasonObject => {
  const debug = getSetting(state, 'debugMode') as boolean;
  const { mainDomain, storeId, hostname, name, expirationDate, firstPartyDomain, session } = cookieProperties;
  const partialCookieInfo = { mainDomain, storeId, hostname, name, expirationDate, firstPartyDomain, session };
  const { greyCleanup, openTabDomains, ignoreOpenTabs } = cleanupProperties;
  const openTabStatus = ignoreOpenTabs
    ? OpenTabStatus.TabsWereIgnored
    : OpenTabStatus.TabsWasNotIgnored;
  cadLog({
    msg: 'CleanupService.isSafeToClean:  Properties Debug',
    x: { partialCookieInfo, cleanupProperties, openTabStatus },
  }, debug);

  // Check if cookie is expired.
  if (getSetting(state, 'cleanExpiredCookies') as boolean) {
    const now = Math.ceil(Date.now() / 1000);
    if (expirationDate && expirationDate < now) {
      cadLog({
        msg: `CleanupService.isSafeToClean:  Cookie Expired since ${expirationDate}.  Date.now is ${now}`,
        x: partialCookieInfo,
      }, debug);
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
    cadLog({
      msg: `CleanupService.isSafeToClean:  mainDomain found in openTabsDomain[${storeId}] - not cleaning.`,
      x: { partialCookieInfo, openTabsInStoreId: openTabDomains[storeId] },
    }, debug);
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
    cadLog({
      msg: 'CleanupService.isSafeToClean:  unmatched and greyCleanup.  Safe to Clean',
      x: partialCookieInfo,
    }, debug);
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
    cadLog({
      msg: 'CleanupService.isSafeToClean:  greyCleanup - matching Expression and cookie name was unchecked.  Safe to Clean.',
      x: { partialCookieInfo, matchedExpression },
    }, debug);
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
    cadLog({
      msg: 'CleanupService.isSafeToClean:  unmatched Expression.  Safe to Clean.',
      x: partialCookieInfo,
    }, debug);
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
    cadLog({
      msg: 'CleanupService.isSafeToClean:  matched Expression but unchecked cookie name.  Safe to Clean.',
      x: { partialCookieInfo, matchedExpression },
    }, debug);
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.MatchedExpressionButNoCookieName,
    };
  }
  cadLog({
    msg: 'CleanupService.isSafeToClean:  Matched Expression and cookie name.  Cookie stays!',
    x: { partialCookieInfo, matchedExpression },
  }, debug);
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
) => {
  const promiseArr: Promise<browser.cookies.Cookie | null>[] = [];
  markedForDeletion.forEach(obj => {
    const cookieProperties = obj.cookie;
    const cookieAPIProperties = returnOptionalCookieAPIAttributes(state, {
      firstPartyDomain: cookieProperties.firstPartyDomain,
      storeId: cookieProperties.storeId,
    }, firstPartyIsolate);
    const cookieRemove = {
      ...cookieAPIProperties,
      name: cookieProperties.name,
      url: cookieProperties.preparedCookieDomain,
    };
    cadLog({
      msg: 'CleanupService.cleanCookies: Cookie being removed through browser.cookies.remove via Promises:',
      x: cookieRemove,
    }, getSetting(state, 'debugMode') as boolean);
    // url: "http://domain.com" + cookies[i].path
    const promise = browser.cookies.remove(cookieRemove);
    promiseArr.push(promise);
  });
  await Promise.all(promiseArr).catch(e => {
    throw e;
  });
};

// Cleanup of all cookies for domain.
export const clearCookiesForThisDomain = async (
  state: State,
  tab: browser.tabs.Tab,
) => {
  const hostname = getHostname(tab.url);
  const firstPartyIsolate = await isFirstPartyIsolate();
  const getCookies = (await browser.cookies.getAll(
    returnOptionalCookieAPIAttributes(state, {
      domain: hostname,
      storeId: tab.cookieStoreId,
    }, firstPartyIsolate),
  ));
  const cookies = getCookies.filter(c => c.name !== LSCLEANUPNAME);

  if (cookies.length > 0) {
    let cookieDeletedCount = 0;
    for (const cookie of cookies) {
      const r = await browser.cookies.remove(returnOptionalCookieAPIAttributes(state, {
        firstPartyDomain: cookie.firstPartyDomain,
        name: cookie.name,
        storeId: cookie.storeId,
        url: prepareCookieDomain(cookie),
      }, firstPartyIsolate) as {
        // This explicit type is required as cookies.remove requires these two
        // parameters, but url is not defined in cookies.Cookie as it is made
        // up of cookie.domain + cookie.path, and neither required parameters
        // can take 'undefined'.  returnOptionalCookieAPIAttributes has the 
        // parameters set to Partial<CookiePropertiesCleanup>, which appends
        // '| undefined' to all parameters.
        name: string;
        url: string;
      });
      if (r) cookieDeletedCount += 1;
    }
    showNotification({
      duration: getSetting(state, 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('manualCleanSuccess', [browser.i18n.getMessage('cookiesText'), hostname])}\n${browser.i18n.getMessage('manualCleanRemoved', [cookieDeletedCount.toString(), cookies.length.toString()])}`,
    });
    return cookieDeletedCount > 0;
  }

  showNotification({
    duration: getSetting(state, 'notificationOnScreen') as number,
    msg: `${browser.i18n.getMessage('manualCleanNothing', [browser.i18n.getMessage('cookiesText'), hostname])}`,
  });

  return cookies.length > 0;
};

export const clearLocalstorageForThisDomain = async (
  state: State,
  tab: browser.tabs.Tab,
) => {
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
      msg: `${browser.i18n.getMessage('manualCleanSuccess', [browser.i18n.getMessage('localStorageText'), getHostname(tab.url)])}\n${browser.i18n.getMessage('removeStorageCount', [local.toString(), browser.i18n.getMessage('localStorageText')])}\n${browser.i18n.getMessage('removeStorageCount', [session.toString(), browser.i18n.getMessage('sessionStorageText')])}`,
    });
    return true;
  } catch (e) {
    throwErrorNotification(e);
    showNotification({
      duration: getSetting(state, 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('manualCleanNothing', [browser.i18n.getMessage('localStorageText'), getHostname(tab.url)])}`,
    });
    return false;
  }
};

/** This will use the browsingData's hostname/origin attribute to delete any extra browsing data */
export const otherBrowsingDataCleanup = async (
  state: State,
  domains: string[],
) => {
  const debug = getSetting(state, 'debugMode') as boolean;
  if (getSetting(state, 'localstorageCleanup')) {
    if (
      state.cache.browserDetect === 'Firefox' &&
      state.cache.browserVersion >= '58' &&
      state.cache.platformOs !== 'android'
    ) {
      const cleanList: string[] = [];
      for (const domain of domains) {
        for (const d of prepareCleanupDomains(domain)) {
          if (d !== '' && d.trim() !== '') cleanList.push(d);
        }
      }
      if (cleanList.length === 0) return false;
      const hostnames = [...new Set(cleanList)];
      cadLog({
        msg: 'CleanupService.otherBrowsingDataCleanup: Hostnames sent to Firefox LocalStorage Cleanup:',
        x: hostnames,
      }, debug);
      await browser.browsingData.removeLocalStorage({
        hostnames,
      }).catch(e => {
        cadLog({
          msg: 'CleanupService.otherBrowsingDataCleanup: removeLocalStorage returned an error:',
          type: 'error',
          x: e,
        }, debug);
        throw e;
      });
      return true;
    }
    if (
      state.cache.browserDetect === 'Chrome'
    ) {
      const cleanList: string[] = [];
      for (const domain of domains) {
        for (const d of prepareCleanupDomains(domain)) {
          if (d !== '' && d.trim() !== '') {
            cleanList.push(`http://${d}`);
            cleanList.push(`https://${d}`);
          }
        }
      }
      if (cleanList.length === 0) return false;
      const origins = [...new Set(cleanList)];
      cadLog({
        msg: `CleanupService.otherBrowsingDataCleanup: Origins sent to Chrome LocalStorage Cleanup`,
        x: origins,
      }, debug);
      await browser.browsingData.removeLocalStorage({
        origins,
      }).catch(e => {
        cadLog({
          msg: 'CleanupService.otherBrowsingDataCleanup: removeLocalStorage returned an error:',
          type: 'error',
          x: e,
        }, debug);
        throw e;
      });
      return true;
    }
  }
  return false;
};

/** Setup Localstorage cleaning */
export const cleanLocalstorage = (bool?: boolean) => {
  return bool === undefined ? false : bool;
};

/** Filter the deleted cookies */
export const filterLocalstorage = (obj: CleanReasonObject, debug = false) => {
  const notProtectedByOpenTab = obj.reason !== ReasonKeep.OpenTabs;
  const notInAnyLists = (obj.reason === ReasonClean.NoMatchedExpression || obj.reason === ReasonClean.StartupNoMatchedExpression);
  const listCleanLocalstorage = cleanLocalstorage(
    obj.expression ? obj.expression.cleanLocalStorage : undefined,
  );
  const nonBlankCookieHostName = obj.cookie.hostname.trim() !== '';
  let cro: CleanReasonObject = obj;
  if (debug) {
    // We need deep copying object to as to not change actual cookies
    const sanitized: CleanReasonObject = JSON.parse(JSON.stringify(obj));
    sanitized.cookie.value = '***';
    cro = sanitized;
  }
  cadLog({
    msg: 'CleanupService.filterLocalstorage: debug data.',
    x: {
      notProtectedByOpenTab,
      notInAnyLists,
      listCleanLocalstorage,
      nonBlankCookieHostName,
      clean1: notInAnyLists,
      clean2: (notProtectedByOpenTab && listCleanLocalstorage),
      CleanReasonObject: cro,
    },
  }, debug);
  return (
    (notInAnyLists || (notProtectedByOpenTab && listCleanLocalstorage)) &&
    nonBlankCookieHostName
  );
};

/**
 * Store all tabs' host domains to prevent cookie deletion from those domains
 * returns empty object if we ignore all open Tabs
 * Tabs now grouped by container e.g. 'default', 'firefox-container-1', '0'
 */
export const returnContainersOfOpenTabDomains = async (
  ignoreOpenTabs: boolean,
  cleanDiscardedTabs: boolean,
) => {
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
) => {
  const debug = getSetting(state, 'debugMode') as boolean;
  let allLocalstorageToClean: CleanReasonObject[] = [];
  const setOfDeletedDomainCookies = new Set();
  const cachedResults: ActivityLog = {
    dateTime: new Date().toString(),
    recentlyCleaned: 0,
    storeIds: {},
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
    const contextualIdentitiesObjects = await browser.contextualIdentities.query({});

    for (const cio of contextualIdentitiesObjects) {
      cookieStoreIds.add(cio.cookieStoreId);
    }
  }

  // Store cookieStoreIds from the cookies API
  const cookieStores = await browser.cookies.getAllCookieStores() || [];
  for (const store of cookieStores) {
    if (getSetting(state, 'contextualIdentities') || !store.id.startsWith('firefox-container')) {
      cookieStoreIds.add(store.id);
    }
  }

  // Clean for each cookieStore jar
  for (const id of cookieStoreIds) {
    let cookies: browser.cookies.Cookie[] = [];
    try {
      cookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(state, {
          storeId: id,
        }, firstPartyIsolate),
      );
    } catch (e) {
      cadLog({
        msg: `CleanupService.cleanCookiesOperation:  browser.cookies.getAll for id: ${id} threw an error.`,
        type: 'error',
        x: e.message,
      }, true);
    }

    // No cookies from specified container.  Skip rest of cleanup.
    if (!cookies || cookies.length === 0) continue;

    const isSafeToCleanObjects = cookies.map(cookie => {
      return isSafeToClean(state, prepareCookie(cookie, debug), newCleanupProperties);
    });

    if (debug) {
      // We need deep copying object to as to not change actual cookies
      const debugObj: CleanReasonObject[] = JSON.parse(JSON.stringify(isSafeToCleanObjects));
      const sanitized = debugObj.map(obj => {
        obj.cookie.value = '***';
        return obj;
      });
      cadLog({
        msg: 'CleanupService.cleanCookiesOperation:  isSafeToCleanObjects Result',
        x: sanitized,
      }, debug);
    }

    const markedForDeletion = isSafeToCleanObjects.filter(obj => {
      const r = obj.cleanCookie && obj.cookie.hostname.trim() !== '';
      cadLog({
        msg: `CleanupService.cleanCookiesOperation: Clean Cookies returned ${r} for ${obj.cookie.hostname}`,
      }, debug);
      return r;
    });

    if (debug) {
      // We need deep copying object to as to not change actual cookies
      const debugObj: CleanReasonObject[] = JSON.parse(JSON.stringify(markedForDeletion));
      const sanitized = debugObj.map(obj => {
        obj.cookie.value = '***';
        return obj;
      });
      cadLog({
        msg: 'CleanupService.cleanCookiesOperation:  Cookies markedForDeletion Result',
        x: sanitized,
      }, debug);
    }

    try {
      await cleanCookies(state, markedForDeletion, firstPartyIsolate);
    } catch (e) {
      cadLog({
        type: 'error',
        x: e,
      }, true);
      throwErrorNotification(e);
      return undefined;
    }

    if (markedForDeletion.length !== 0) {
      cachedResults.storeIds[id] = markedForDeletion;
    }
    cachedResults.recentlyCleaned += markedForDeletion.length;
    markedForDeletion.forEach(obj => {
      setOfDeletedDomainCookies.add(
        getSetting(state, 'contextualIdentities')
          ? `${obj.cookie.hostname} (${state.cache[obj.cookie.storeId]})`
          : obj.cookie.hostname,
      );
    });

    const markedForLocalStorageDeletion = isSafeToCleanObjects.filter(obj => {
      const r = filterLocalstorage(obj, debug);
      cadLog({
        msg: `CleanupService.filterLocalstorage: returned ${r} for ${obj.cookie.hostname}`,
      }, debug);
      return r;
    });

    // Side effects
    allLocalstorageToClean = [
      ...allLocalstorageToClean,
      ...markedForLocalStorageDeletion,
    ];

    // Clean other browsingdata.  Pass in Domain for specific cleanup for LocalStorage.
    const domainsToClean = allLocalstorageToClean.map(
      obj => obj.cookie.domain,
    ).filter(domain => domain.trim() !== '');

    try {
      await otherBrowsingDataCleanup(state, domainsToClean);
    } catch (e) {
      cadLog({
        type: 'error',
        x: { e, domainsToClean },
      }, true);
      // if it reaches this point then cookies were deleted, so don't return undefined
      throwErrorNotification(e);
    }
  }

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
