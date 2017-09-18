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

export const isSafeToClean = (state, cookieProperties, cleanupProperties) => {
	const {
		mainDomain, storeId, hostname
	} = cookieProperties;
	const {
		cachedResults, greyCleanup, openTabDomains
	} = cleanupProperties;
	const newStoreId = getStoreId(state, storeId);
	if (cachedResults[newStoreId] === undefined) {
		cachedResults[newStoreId] = {};
	}
	if (cachedResults[newStoreId][hostname] !== undefined) {
		// console.log("used cached result", newStoreId, hostname);
		return cachedResults[newStoreId][hostname];
	}
	if (openTabDomains.has(mainDomain)) {
		return (cachedResults[newStoreId][hostname] = false);
	}
	const matchedExpression = returnMatchedExpressionObject(state, storeId, hostname);
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
