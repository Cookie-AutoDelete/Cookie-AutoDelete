/**
 * Copyright (c) 2017 Kenny Do
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
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  throwErrorNotification,
  undefinedIsTrue,
} from './Libs';

/** Prepare a cookie for deletion */
const prepareCookie = (cookie: browser.cookies.CookieProperties) => {
  const cookieProperties = {
    ...cookie,
    hostname: '',
    mainDomain: '',
    preparedCookieDomain: prepareCookieDomain(cookie),
  };
  cookieProperties.hostname = getHostname(
    cookieProperties.preparedCookieDomain,
  );
  cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
  return cookieProperties;
};

/** Returns an object representing the cookie with internal flags */
export const isSafeToClean = (
  state: State,
  cookieProperties: CookiePropertiesCleanup,
  cleanupProperties: CleanupPropertiesInternal,
): CleanReasonObject => {
  const { mainDomain, storeId, hostname } = cookieProperties;
  const { greyCleanup, openTabDomains, ignoreOpenTabs } = cleanupProperties;
  const openTabStatus = ignoreOpenTabs
    ? OpenTabStatus.TabsWereIgnored
    : OpenTabStatus.TabsWasNotIgnored;

  // Tests if the main domain is open
  if (openTabDomains.has(mainDomain)) {
    return {
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
    return {
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
    return {
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.StartupCleanupAndGreyList,
    };
  }

  // Normal cleanup checks
  if (!matchedExpression) {
    return {
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
    return {
      cleanCookie: true,
      cookie: cookieProperties,
      expression: matchedExpression,
      openTabStatus,
      reason: ReasonClean.MatchedExpressionButNoCookieName,
    };
  }
  return {
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
  const promiseArr: Promise<browser.cookies.Cookie | null>[] = [];
  markedForDeletion.forEach(obj => {
    const cookieProperties = obj.cookie;
    const cookieAPIProperties = returnOptionalCookieAPIAttributes(state, {
      firstPartyDomain: cookieProperties.firstPartyDomain,
      storeId: cookieProperties.storeId,
    });
    // url: "http://domain.com" + cookies[i].path
    const promise = browser.cookies.remove({
      ...cookieAPIProperties,
      name: cookieProperties.name,
      url: cookieProperties.preparedCookieDomain,
    });
    promiseArr.push(promise);
  });
  await Promise.all(promiseArr).catch(e => {
    throw e;
  });
};

/** This will use the browsingData's hostname attribute to delete any extra browsing data */
export const otherBrowsingDataCleanup = async (
  state: State,
  hostnames: string[],
) => {
  if (
    state.cache.browserDetect === 'Firefox' &&
    getSetting(state, 'localstorageCleanup')
  ) {
    await browser.browsingData
      .removeLocalStorage({
        hostnames,
      })
      .catch(e => {
        throw e;
      });
  }
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

  const cookieStoreIds = new Set();
  // Store cookieStoreIds from the contextualIdentities API
  if (getSetting(state, 'contextualIdentities')) {
    const contextualIdentitiesObjects = await browser.contextualIdentities.query(
      {},
    );

    for (const object of contextualIdentitiesObjects) {
      cookieStoreIds.add(object.cookieStoreId);
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
      return isSafeToClean(state, prepareCookie(cookie), newCleanupProperties);
    });
    const markedForDeletion = isSafeToCleanObjects.filter(
      obj => obj.cleanCookie,
    );

    try {
      await cleanCookies(state, markedForDeletion);
    } catch (e) {
      console.error(e);
      throwErrorNotification(e);
      return undefined;
    }

    // Setup Localstorage cleaning
    const cleanLocalstorage = (bool?: boolean) => {
      if (bool === undefined) return false;
      return bool;
    };
    const markedForLocalStorageDeletion = isSafeToCleanObjects.filter(obj => {
      const notProtectedByOpenTab = obj.reason !== ReasonKeep.OpenTabs;
      const notInAnyLists = obj.reason === ReasonClean.NoMatchedExpression;
      const listCleanLocalstorage = cleanLocalstorage(
        obj.expression ? obj.expression.cleanLocalStorage : undefined,
      );
      return notInAnyLists || (notProtectedByOpenTab && listCleanLocalstorage);
    });

    // Side effects
    allLocalstorageToClean = [
      ...allLocalstorageToClean,
      ...markedForLocalStorageDeletion,
    ];
    cachedResults.storeIds[id] = markedForDeletion;
    cachedResults.recentlyCleaned += markedForDeletion.length;
    markedForDeletion.forEach(obj => {
      setOfDeletedDomainCookies.add(
        getSetting(state, 'contextualIdentities')
          ? `${obj.cookie.hostname} (${state.cache[obj.cookie.storeId]})`
          : obj.cookie.hostname,
      );
    });
  }

  try {
    await otherBrowsingDataCleanup(
      state,
      allLocalstorageToClean.map(obj => obj.cookie.hostname),
    );
  } catch (e) {
    console.error(e);
    // if it reaches this point then cookies were deleted, so don't return undefined
    throwErrorNotification(e);
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
