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
import {getHostname, isAWebpage, extractMainDomain, getSetting, prepareCookieDomain, returnMatchedExpressionObject, getStoreId} from "./libs";

let recentlyCleaned;

// Returns true if the cookie can be cleaned
export const isSafeToClean = (state, cookieProperties, cleanupProperties) => {
	const {
		mainDomain, storeId, hostname
	} = cookieProperties;
	const {
		cachedResults, greyCleanup, openTabDomains
	} = cleanupProperties;
	const newStoreId = getStoreId(state, storeId);

	// Adds in the storeId as a key to an object else it would be undefined
	if (cachedResults[newStoreId] === undefined) {
		cachedResults[newStoreId] = {};
	}

	// Tests if the storeId has the result in the cache
	if (cachedResults[newStoreId][hostname] !== undefined) {
		// console.log("used cached result", newStoreId, hostname);
		return cachedResults[newStoreId][hostname];
	}

	// Tests if the main domain is open
	if (openTabDomains.has(mainDomain)) {
		return (cachedResults[newStoreId][hostname] = false);
	}

	// Checks the list for the first available match
	const matchedExpression = returnMatchedExpressionObject(state, storeId, hostname);

	// Store the results in cache for future lookups to cookieStoreId.hostname
	if (greyCleanup) {
		return (cachedResults[newStoreId][hostname] = matchedExpression === undefined || matchedExpression.listType === "GREY");
	}
	return (cachedResults[newStoreId][hostname] = matchedExpression === undefined);
};

// Goes through all the cookies to see if its safe to clean
export const cleanCookies = (state, cookies, cleanupProperties) => {
	for (let i = 0; i < cookies.length; i++) {
		let cookieProperties = {
			...cookies[i],
			preparedCookieDomain: prepareCookieDomain(cookies[i])
		};
		cookieProperties.hostname = getHostname(cookieProperties.preparedCookieDomain);
		cookieProperties.mainDomain = extractMainDomain(cookieProperties.hostname);
		if (isSafeToClean(state, cookieProperties, cleanupProperties)) {
			recentlyCleaned++;
			cleanupProperties.setOfDeletedDomainCookies.add(getSetting(state, "contextualIdentities") ? `${cookieProperties.hostname} (${state.cache[cookieProperties.storeId]})` : cookieProperties.hostname);
			// url: "http://domain.com" + cookies[i].path
			browser.cookies.remove({
				url: cookieProperties.preparedCookieDomain,
				name: cookieProperties.name,
				storeId: cookieProperties.storeId
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
	let cachedResults = {};
	recentlyCleaned = 0;
	if (!cleanupProperties.ignoreOpenTabs) {
		openTabDomains = await returnSetOfOpenTabDomains();
	}
	let newCleanupProperties = {
		...cleanupProperties,
		openTabDomains,
		setOfDeletedDomainCookies,
		cachedResults
	};
	if (getSetting(state, "contextualIdentities")) {
		const contextualIdentitiesObjects = await browser.contextualIdentities.query({});
		contextualIdentitiesObjects.forEach(async (object) => {
			const cookies = await browser.cookies.getAll({
				storeId: object.cookieStoreId
			});
			promiseContainers.push(cleanCookies(state, cookies, newCleanupProperties));
		});
		await Promise.all(promiseContainers);
	}

	const cookies = await browser.cookies.getAll({});
	cleanCookies(state, cookies, newCleanupProperties);
	return {
		setOfDeletedDomainCookies, recentlyCleaned
	};
};
