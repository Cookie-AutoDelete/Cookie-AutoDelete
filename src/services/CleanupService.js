const UsefulFunctions = require("./UsefulFunctions.js");

class CleanupService {

	constructor() {
		this.recentlyCleaned = 0;
		this.setOfDeletedDomainCookies = new Set();
	}

	// Puts the domain in the right format for browser.cookies.clean()
	prepareCookieDomain(cookie) {
		let cookieDomain = cookie.domain;
		if (cookieDomain.charAt(0) === ".") {
			cookieDomain = cookieDomain.slice(1);
		}
		cookieDomain = cookie.secure ? `https://${cookieDomain}` : `http://${cookieDomain}`;
		return cookieDomain;
	}

	// This checks whether or not it's safe to delete a cookie depending on user settings (globalSubdomainEnabled, contextualIdentitiesEnabled), whitelist, and whether cookies cleanup was called at startup
	isSafeToClean(cleanupProperties, cookieProperties) {
		// This was a quick and easy way of avoiding another long if/else blocks (2*2=4 if/else rather that 2*2*2=8 if/else)
		// Basically hasHostInWhiteOrGrey and hasHostSubdomain takes in cookieDomainHost ie. drive.google.com and cookiesBaseDomainHost ie. google.com
		// If globalSubdomainEnabled is false, then cookiesDomainHost = cookiesBaseDomainHost
		let cookieBaseDomainHost = cleanupProperties.globalSubdomainEnabled ? cookieProperties.cookieBaseDomainHost : cookieProperties.cookieDomainHost;

		// Regular Cleanup (!startUp) uses hasHostInWhiteOrGrey() because it doesn't clean from those lists
		// StartUp Cleanup (startUp) uses hasHostSubdomain() only checking the whitelist
		if (cleanupProperties.contextualIdentitiesEnabled && !cleanupProperties.startUp) {
			return !cleanupProperties.whiteList.hasHostInWhiteOrGrey(cookieProperties.cookieDomainHost, cookieBaseDomainHost, cookieProperties.storeId) && !cleanupProperties.setOfTabURLS.has(cookieProperties.cookieMainDomainHost);
		} else if (!cleanupProperties.contextualIdentitiesEnabled && !cleanupProperties.startUp) {
			return 	!cleanupProperties.whiteList.hasHostInWhiteOrGrey(cookieProperties.cookieDomainHost, cookieBaseDomainHost) && !cleanupProperties.setOfTabURLS.has(cookieProperties.cookieMainDomainHost);
		} else if (cleanupProperties.contextualIdentitiesEnabled && cleanupProperties.startUp) {
			return !cleanupProperties.whiteList.hasHostSubdomain(cookieProperties.cookieDomainHost, cookieBaseDomainHost, cookieProperties.storeId) && !cleanupProperties.setOfTabURLS.has(cookieProperties.cookieMainDomainHost);
		}
		// !cleanupProperties.contextualIdentitiesEnabled && cleanupProperties.startUp
		return 	!cleanupProperties.whiteList.hasHostSubdomain(cookieProperties.cookieDomainHost, cookieBaseDomainHost) && !cleanupProperties.setOfTabURLS.has(cookieProperties.cookieMainDomainHost);
	}

	// Goes through all the cookies to see if its safe to clean
	cleanCookies(cookies, cleanupProperties) {
		for (let i = 0; i < cookies.length; i++) {
			let cookieProperties = cookies[i];
			cookieProperties.cookieDomain = this.prepareCookieDomain(cookies[i]);
			cookieProperties.cookieDomainHost = UsefulFunctions.getHostname(cookieProperties.cookieDomain);
			cookieProperties.cookieBaseDomainHost = UsefulFunctions.extractBaseDomain(cookieProperties.cookieDomainHost);
			cookieProperties.cookieMainDomainHost = UsefulFunctions.extractMainDomain(cookieProperties.cookieDomainHost);
			cookieProperties.preparedCookieDomain = cookieProperties.cookieDomain + cookies[i].path;

			if (this.isSafeToClean(cleanupProperties, cookieProperties)) {
				if (cleanupProperties.contextualIdentitiesEnabled) {
					// setOfDeletedDomainCookies.add(cookieDomainHost + ": " + cookies[i].storeId);
					let name = cleanupProperties.cache.getNameFromCookieID(cookieProperties.storeId);
					this.setOfDeletedDomainCookies.add(`${cookieProperties.cookieDomainHost} (${name})`);
				} else {
					this.setOfDeletedDomainCookies.add(cookieProperties.cookieDomainHost);
				}
				// url: "http://domain.com" + cookies[i].path
				browser.cookies.remove({
					url: cookieProperties.preparedCookieDomain,
					name: cookieProperties.name,
					storeId: cookieProperties.storeId
				});
				this.recentlyCleaned++;
			}
		}
		return Promise.resolve(this.setOfDeletedDomainCookies);
	}

	// Store all tabs' host domains to prevent cookie deletion from those domains
	returnSetOfOpenTabDomains() {
		return browser.tabs.query({"windowType": "normal"})
		.then((tabs) => {
			let setOfTabURLS = new Set();
			tabs.forEach((currentValue, index, array) => {
				if (UsefulFunctions.isAWebpage(currentValue.url)) {
					let hostURL = UsefulFunctions.getHostname(currentValue.url);
					hostURL = UsefulFunctions.extractMainDomain(hostURL);
					setOfTabURLS.add(hostURL);
				}
			});
			return Promise.resolve(setOfTabURLS);
		});
	}

	// Main function for cookie cleanup. Returns a list of domains that cookies were deleted from
	cleanCookiesOperation(cleanupPropertiesIn) {
		// Stores the deleted domains (for notification)
		this.setOfDeletedDomainCookies = new Set();
		this.recentlyCleaned = 0;

		return this.returnSetOfOpenTabDomains()
		.then((setOfTabURLSIn) => {
			let cleanupProperties = cleanupPropertiesIn;

			if (cleanupProperties.ignoreOpenTabs) {
				cleanupProperties.setOfTabURLS = new Set();
			} else {
				cleanupProperties.setOfTabURLS = setOfTabURLSIn;
			}

			// console.log(cleanupProperties);

			if (cleanupProperties.contextualIdentitiesEnabled) {
				// Clean cookies in different cookie ids using the contextual identities api
				let promiseContainers = [];
				cleanupProperties.cache.nameCacheMap.forEach((value, key, map) => {
					let promise = browser.cookies.getAll({storeId: key})
					.then((cookies) => {
						return this.cleanCookies(cookies, cleanupProperties);
					});
					promiseContainers.push(promise);
				});

				return Promise.all(promiseContainers)
				.then((values) => {
					return Promise.resolve(values[0]);
				});
			}
			// Clean the default cookie id container (Contextual identity off)
			return browser.cookies.getAll({})
			.then((cookies) => {
				return this.cleanCookies(cookies, cleanupProperties);
			});
		});
	}

}

module.exports = CleanupService;
