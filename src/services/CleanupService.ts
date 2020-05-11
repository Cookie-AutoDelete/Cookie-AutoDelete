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
  prepareCleanupDomains,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  throwErrorNotification,
  undefinedIsTrue,
} from './Libs';

/** Prepare a cookie for deletion */
export const prepareCookie = (cookie: browser.cookies.Cookie, debug: boolean = false) => {
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
    cookieProperties.hostname =  getHostname(cookieProperties.preparedCookieDomain);
    cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
  }
  if (debug) {
    cadLog({
      msg: 'CleanupService.prepareCookie: results',
      x: { domain: cookie.domain, path: cookie.path, preparedCookieDomain: cookieProperties.preparedCookieDomain, mainDomain: cookieProperties.mainDomain, hostname: cookieProperties.hostname},
    });
  }
  return cookieProperties;
};

/** Returns an object representing the cookie with internal flags */
export const isSafeToClean = (
  state: State,
  cookieProperties: CookiePropertiesCleanup,
  cleanupProperties: CleanupPropertiesInternal,
): CleanReasonObject => {
  const debug = getSetting(state, 'debugMode');
  const { mainDomain, storeId, hostname, name, expirationDate, firstPartyDomain, session} = cookieProperties;
  const partialCookieInfo = { mainDomain, storeId, hostname, name, expirationDate, firstPartyDomain, session};
  const { greyCleanup, openTabDomains, ignoreOpenTabs } = cleanupProperties;
  const openTabStatus = ignoreOpenTabs
    ? OpenTabStatus.TabsWereIgnored
    : OpenTabStatus.TabsWasNotIgnored;
  if (debug) {
    cadLog({
      msg: 'CleanupService.isSafeToClean:  Properties Debug',
      x: {mainDomain, storeId, hostname, greyCleanup, openTabDomains: [...openTabDomains], ignoreOpenTabs, openTabStatus},
    });
  }
  // Tests if the main domain is open
  if (openTabDomains.has(mainDomain)) {
    if (debug) {
      cadLog({
        msg: 'CleanupService.isSafeToClean:  mainDomain found in openTabsDomain - not cleaning.',
        x: {partialCookieInfo},
      });
    }
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
    if (debug) {
      cadLog({
        msg: 'CleanupService.isSafeToClean:  unmatched and greyCleanup.  Safe to Clean',
        x: partialCookieInfo,
      });
    }
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
    if (debug) {
      cadLog({
        msg: 'CleanupService.isSafeToClean:  greyCleanup - matching Expression and cookie name was unchecked.  Safe to Clean.',
        x: {partialCookieInfo, matchedExpression,},
      });
    }
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
    if (debug) {
      cadLog({
        msg: 'CleanupService.isSafeToClean:  unmatched Expression.  Safe to Clean.',
        x: partialCookieInfo,
      });
    }
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
    if (debug) {
      cadLog({
        msg: 'CleanupService.isSafeToClean:  matched Expression but unchecked cookie name.  Safe to Clean.',
        x: {partialCookieInfo, matchedExpression,},
      });
    }
    return {
      cached: false,
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.MatchedExpressionButNoCookieName,
    };
  }
  if (debug) {
    cadLog({
      msg: 'CleanupService.isSafeToClean:  Matched Expression and cookie name.  Cookie stays!',
      x: {partialCookieInfo, matchedExpression,},
    });
  }
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
) => {
  const debug = getSetting(state, 'debugMode');
  const promiseArr: Promise<browser.cookies.Cookie | null>[] = [];
  markedForDeletion.forEach(obj => {
    const cookieProperties = obj.cookie;
    const cookieAPIProperties = returnOptionalCookieAPIAttributes(state, {
      firstPartyDomain: cookieProperties.firstPartyDomain,
      storeId: cookieProperties.storeId,
    });
    const cookieRemove = {
      ...cookieAPIProperties,
      name: cookieProperties.name,
      url: cookieProperties.preparedCookieDomain,
    };
    if (debug) {
      cadLog({
        msg: 'CleanupService.cleanCookies: Cookie being removed through browser.cookies.remove via Promises:',
        x: cookieRemove,
      });
    }
    // url: "http://domain.com" + cookies[i].path
    const promise = browser.cookies.remove(cookieRemove);
    promiseArr.push(promise);
  });
  await Promise.all(promiseArr).catch(e => {
    throw e;
  });
};

/** This will use the browsingData's hostname attribute to delete any extra browsing data */
export const otherBrowsingDataCleanup = async (
  state: State,
  domains: string[],
) => {
  const debug = getSetting(state, 'debugMode');
  if (getSetting(state, 'localstorageCleanup')) {
    if (
      state.cache.browserDetect === 'Firefox' &&
      state.cache.browserVersion >= '58' &&
      state.cache.platformOs !== 'android'
    ) {
      const cleanList: string[] = [];
      domains.forEach(domain => prepareCleanupDomains(domain).forEach(d => {
        if (d !== '' && d.trim() !== '') cleanList.push(d);
      }));
      const hostnames = [...new Set(cleanList)];
      if (debug) {
        cadLog({
          msg: 'CleanupService.otherBrowsingDataCleanup: Hostnames sent to Firefox LocalStorage Cleanup:',
          x: hostnames
        });
      }
      browser.browsingData.removeLocalStorage({
          hostnames,
        })
        .catch(e => {
          if (debug) {
            cadLog({
              msg: 'CleanupService.otherBrowsingDataCleanup: removeLocalStorage returned an error:',
              type: 'error',
              x: e
            });
          }
          throw e;
        });
    } else if (
      state.cache.browserDetect === 'Chrome'
    ) {
      const cleanList: string[] = [];
      domains.forEach(domain => prepareCleanupDomains(domain).forEach(d => {
        if (d !== '' && d.trim() !== '') {
          cleanList.push(`http://${d}`);
          cleanList.push(`https://${d}`);
        }
      }));
      const origins = [...new Set(cleanList)];
      if (debug) {
        cadLog({
          msg: `CleanupService.otherBrowsingDataCleanup: Origins sent to Chrome LocalStorage Cleanup`,
          x: origins
        });
      }
      browser.browsingData.removeLocalStorage({
          origins,
        }).catch(e => {
          if (debug) {
            cadLog({
              msg: 'CleanupService.otherBrowsingDataCleanup: removeLocalStorage returned an error:',
              type: 'error',
              x: e
            });
          }
          throw e;
        });
    }
  }
};

/** Setup Localstorage cleaning */
export const cleanLocalstorage = (bool?: boolean) => {
  if (bool === undefined) return false;
  return bool;
};

/** Filter the deleted cookies */
export const filterLocalstorage = (obj: CleanReasonObject, debug: boolean = false) => {
  const notProtectedByOpenTab = obj.reason !== ReasonKeep.OpenTabs;
  const notInAnyLists = (obj.reason === ReasonClean.NoMatchedExpression || obj.reason === ReasonClean.StartupNoMatchedExpression);
  const listCleanLocalstorage = cleanLocalstorage(
    obj.expression ? obj.expression.cleanLocalStorage : undefined,
  );
  const nonBlankCookieHostName = obj.cookie.hostname.trim() !== '';
  if (debug) {
    cadLog({
      msg: 'CleanupService.filterLocalstorage results.',
      x: {notProtectedByOpenTab, notInAnyLists, listCleanLocalstorage, nonBlankCookieHostName, clean1: notInAnyLists, clean2: (notProtectedByOpenTab && listCleanLocalstorage) , CleanReasonObject: obj},
    });
  }
  return (
    (notInAnyLists || (notProtectedByOpenTab && listCleanLocalstorage)) &&
    nonBlankCookieHostName
  );
};

/** Store all tabs' host domains to prevent cookie deletion from those domains */
export const returnSetOfOpenTabDomains = async (ignoreOpenTabs: boolean) => {
  if (ignoreOpenTabs) {
    return new Set<string>();
  }
  const tabs = await browser.tabs.query({
    windowType: 'normal',
  });
  const setOfTabURLS = new Set<string>();
  tabs.forEach((currentValue, index, array) => {
    if (isAWebpage(currentValue.url)) {
      let hostURL = getHostname(currentValue.url);
      hostURL = extractMainDomain(hostURL);
      setOfTabURLS.add(hostURL);
    }
  });
  return setOfTabURLS;
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
  const openTabDomains = await returnSetOfOpenTabDomains(
    cleanupProperties.ignoreOpenTabs,
  );
  const newCleanupProperties: CleanupPropertiesInternal = {
    ...cleanupProperties,
    openTabDomains,
  };

  const cookieStoreIds = new Set<string>();

  // Manually add default containers.
  cookieStoreIds.add('default');
  cookieStoreIds.add('firefox-default');
  if (await browser.extension.isAllowedIncognitoAccess()) {
    cookieStoreIds.add('firefox-private');
    cookieStoreIds.add('private');
  }

  // Store cookieStoreIds from the contextualIdentities API
  if (getSetting(state, 'contextualIdentities')) {
    const contextualIdentitiesObjects = await browser.contextualIdentities.query({});

    for (const cio of contextualIdentitiesObjects) {
      cookieStoreIds.add(cio.cookieStoreId);
    }
  }

  // Store cookieStoreIds from the cookies API
  const cookieStores = await browser.cookies.getAllCookieStores();
  for (const store of cookieStores) {
    cookieStoreIds.add(store.id);
  }

  // Clean for each cookieStore jar
  for (const id of cookieStoreIds) {
    const cookies = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        storeId: id,
      }),
    );
    const isSafeToCleanObjects = cookies.map(cookie => {
      return isSafeToClean(state, prepareCookie(cookie, debug), newCleanupProperties);
    });
    const markedForDeletion = isSafeToCleanObjects.filter(
      obj => obj.cleanCookie && obj.cookie.hostname.trim() !== '',
    );

    if (debug) {
      cadLog({
        msg: 'CleanupService.cleanCookiesOperation:  isSafeToCleanObjects Result',
        x: isSafeToCleanObjects,
      });
    }

    try {
      await cleanCookies(state, markedForDeletion);
    } catch (e) {
      cadLog({
        type: 'error',
        x: e,
      });
      cadLog({
        type: 'error',
        x: markedForDeletion
      });
      console.error(e, markedForDeletion);
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
      if (debug) {
        cadLog({
          msg: `CleanupService.filterLocalstorage returned: ${r} for ${obj.cookie.hostname}`
        });
      }
      return r;
    });

    // Side effects
    allLocalstorageToClean = [
      ...allLocalstorageToClean,
      ...markedForLocalStorageDeletion,
    ];

    // Clean other browsingdata.  Pass in Domain for specific cleanup for LocalStorage.
    const domainsToClean = allLocalstorageToClean.map(
      obj => obj.cookie.domain
    ).filter(domain => domain.trim() !== '');

    try {
      await otherBrowsingDataCleanup(state, domainsToClean);
    } catch (e) {
      cadLog({
        type: 'error',
        x: {e, domainsToClean,},
      });
      // if it reaches this point then cookies were deleted, so don't return undefined
      throwErrorNotification(e);
    }
  }

  // Scrub private cookieStores
  const storesIdsToScrub = ['firefox-private', 'private'];
  for (const id of storesIdsToScrub) {
    delete cachedResults.storeIds[id];
  }

  return {
    cachedResults,
    setOfDeletedDomainCookies,
  };
};
