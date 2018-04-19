/**
Copyright (c) 2017 Kenny Do

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/
import {getHostname, isAWebpage, extractMainDomain, getSetting, prepareCookieDomain, returnMatchedExpressionObject, getStoreId, returnOptionalCookieAPIAttributes} from "./libs";

// Returns true if the cookie can be cleaned
export const isSafeToClean = (state, cookieProperties, cleanupProperties) => {
	const {
		mainDomain, storeId, hostname
	} = cookieProperties;
	const {
		cachedResults, greyCleanup, openTabDomains, ignoreOpenTabs
	} = cleanupProperties;
	const newStoreId = getStoreId(state, storeId);

	// Adds in the storeId as a key to an object else it would be undefined
	if (cachedResults[newStoreId] === undefined) {
		cachedResults[newStoreId] = {};
	}
	cachedResults[newStoreId][hostname] = {};

	// Tests if the storeId has the result in the cache
	if (cachedResults[newStoreId][hostname].decision !== undefined) {
		// console.log("used cached result", newStoreId, hostname);
		return cachedResults[newStoreId][hostname].decision;
	}

	// Tests if the main domain is open
	if (openTabDomains.has(mainDomain)) {
		cachedResults[newStoreId][hostname].reason = browser.i18n.getMessage("reasonKeepOpenTab", [mainDomain]);
		return (cachedResults[newStoreId][hostname].decision = false);
	}

	// Checks the list for the first available match
	const matchedExpression = returnMatchedExpressionObject(state, storeId, hostname);

	// Store the results in cache for future lookups to cookieStoreId.hostname
	if (greyCleanup && (matchedExpression === undefined || matchedExpression.listType === "GREY")) {
		if (matchedExpression === undefined) {
			cachedResults[newStoreId][hostname].reason = `${browser.i18n.getMessage("reasonCleanStartupNoList", [hostname])} ${!ignoreOpenTabs ? browser.i18n.getMessage("reasonTabsWereNotIgnored") : browser.i18n.getMessage("reasonTabsWereIgnored")}`;
			return (cachedResults[newStoreId][hostname].decision = true);
		} else if (matchedExpression.listType === "GREY") {
			cachedResults[newStoreId][hostname].reason = browser.i18n.getMessage("reasonCleanGreyList", [matchedExpression.expression]);
			return (cachedResults[newStoreId][hostname].decision = true);
		}
	}

	if (matchedExpression === undefined) {
		cachedResults[newStoreId][hostname].reason = `${browser.i18n.getMessage("reasonCleanNoList", [hostname])} ${!ignoreOpenTabs ? browser.i18n.getMessage("reasonTabsWereNotIgnored") : browser.i18n.getMessage("reasonTabsWereIgnored")}`;
	} else {
		cachedResults[newStoreId][hostname].reason = browser.i18n.getMessage("reasonKeep", [matchedExpression.expression, (matchedExpression.listType === "GREY" ? browser.i18n.getMessage("greyListWordText") : browser.i18n.getMessage("whiteListWordText"))]);
	}
	return (cachedResults[newStoreId][hostname].decision = matchedExpression === undefined);
};

// Goes through all the cookies to see if its safe to clean
export const cleanCookies = (state, cookies, cleanupProperties) => {
	for (let cookie of cookies) {
		let cookieProperties = {
			...cookie,
			preparedCookieDomain: prepareCookieDomain(cookie)
		};
		cookieProperties.hostname = getHostname(cookieProperties.preparedCookieDomain);
		cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
		if (isSafeToClean(state, cookieProperties, cleanupProperties)) {
			cleanupProperties.cachedResults.recentlyCleaned++;
			cleanupProperties.setOfDeletedDomainCookies.add(getSetting(state, "contextualIdentities") ? `${cookieProperties.hostname} (${state.cache[cookieProperties.storeId]})` : cookieProperties.hostname);
			cleanupProperties.hostnamesDeleted.add(cookieProperties.hostname);
			// url: "http://domain.com" + cookies[i].path
			browser.cookies.remove(
				returnOptionalCookieAPIAttributes(state, {
					url: cookieProperties.preparedCookieDomain,
					name: cookieProperties.name,
					storeId: cookieProperties.storeId,
					firstPartyDomain: cookieProperties.firstPartyDomain
				})
			);
		}
	}
	return Promise.resolve();
};

// This will use the browsingData's hostname attribute to delete any extra browsing data
export const otherBrowsingDataCleanup = (state, hostnamesDeleted) => {
	if (state.cache.browserDetect === "Firefox") {
		if (getSetting(state, "localstorageCleanup")) {
			browser.browsingData.removeLocalStorage({
				hostnames: Array.from(hostnamesDeleted)
			});
		}
	}
};

// Store all tabs' host domains to prevent cookie deletion from those domains
export const returnSetOfOpenTabDomains = async () => {
	const tabs = await browser.tabs.query({
		"windowType": "normal"
	});
	let setOfTabURLS = new Set();
	tabs.forEach((currentValue, index, array) => {
		if (isAWebpage(currentValue.url)) {
			let hostURL = getHostname(currentValue.url);
			hostURL = extractMainDomain(hostURL);
			setOfTabURLS.add(hostURL);
		}
	});
	return setOfTabURLS;
};

// Main function for cookie cleanup. Returns a list of domains that cookies were deleted from
export const cleanCookiesOperation = async (state, cleanupProperties = {
	greyCleanup: false, ignoreOpenTabs: false
}) => {
	let openTabDomains = new Set();
	let promiseContainers = [];
	let setOfDeletedDomainCookies = new Set();
	let hostnamesDeleted = new Set();
	let cachedResults = {
		dateTime: new Date().toString(),
		recentlyCleaned: 0
	};
	if (!cleanupProperties.ignoreOpenTabs) {
		openTabDomains = await returnSetOfOpenTabDomains();
	}
	let newCleanupProperties = {
		...cleanupProperties,
		openTabDomains,
		setOfDeletedDomainCookies,
		hostnamesDeleted,
		cachedResults
	};

	let cookieStoreIds = new Set();
	// Store cookieStoreIds from the contextualIdentities API
	if (getSetting(state, "contextualIdentities")) {
		const contextualIdentitiesObjects = await browser.contextualIdentities.query({});

		for (let object of contextualIdentitiesObjects) {
			cookieStoreIds.add(object.cookieStoreId);
		}
	}

	// Store cookieStoreIds from the cookies API
	const cookieStores = await browser.cookies.getAllCookieStores();
	for (let store of cookieStores) {
		cookieStoreIds.add(store.id);
	}

	// Clean for each cookieStore jar
	for (let id of cookieStoreIds) {
		const cookies = await browser.cookies.getAll(
			returnOptionalCookieAPIAttributes(state, {
				storeId: id
			})
		);
		promiseContainers.push(cleanCookies(state, cookies, newCleanupProperties));
	}

	await Promise.all(promiseContainers);

	// Scrub private cookieStores
	const storesIdsToScrub = ["firefox-private", "private"];
	for (let id of storesIdsToScrub) {
		delete cachedResults[id];
	}

	otherBrowsingDataCleanup(state, hostnamesDeleted);
	return {
		setOfDeletedDomainCookies, cachedResults
	};
};
