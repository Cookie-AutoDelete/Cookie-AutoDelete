import {getHostname, isAWebpage, extractMainDomain, getSetting, prepareCookieDomain, returnMatchedExpressionObject} from "./libs";

let recentlyCleaned;

export const isSafeToClean = (state, cookieProperties, cleanupProperties) => {
	if (cleanupProperties.openTabDomains.has(cookieProperties.mainDomain)) {
		return false;
	}
	const matchedExpression = returnMatchedExpressionObject(state, cookieProperties.storeId, cookieProperties.hostname);
	if (cleanupProperties.greyCleanup) {
		return matchedExpression === undefined || matchedExpression.listType === "GREY";
	}
	return matchedExpression === undefined;
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
		// console.log(cookieProperties);

		if (isSafeToClean(state, cookieProperties, cleanupProperties)) {
			// console.log("clean", cookieProperties);
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
	recentlyCleaned = 0;
	if (!cleanupProperties.ignoreOpenTabs) {
		openTabDomains = await returnSetOfOpenTabDomains();
	}
	if (getSetting(state, "contextualIdentities")) {
		const contextualIdentitiesObjects = await browser.contextualIdentities.query({});
		console.log(contextualIdentitiesObjects);
		contextualIdentitiesObjects.forEach(async (object) => {
			const cookies = await browser.cookies.getAll({
				storeId: object.cookieStoreId
			});
			promiseContainers.push(cleanCookies(state, cookies, {
				...cleanupProperties, openTabDomains
			}));
		});
		await Promise.all(promiseContainers);
	}

	const cookies = await browser.cookies.getAll({});
	cleanCookies(state, cookies, {
		...cleanupProperties, openTabDomains, setOfDeletedDomainCookies
	});
	return {
		setOfDeletedDomainCookies, recentlyCleaned
	};
};
