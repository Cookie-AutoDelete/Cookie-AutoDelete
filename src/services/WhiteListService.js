const defaultWhiteList = "defaultWhiteList";
const greyPrefix = "-Grey";
class WhiteListService {
	constructor(items, contextualIdentitiesEnabled = false, cache) {
		this.cookieWhiteList = new Map();
		// Sets up the whitelist for the map
		if (contextualIdentitiesEnabled) {
			cache.nameCacheMap.forEach((value, key, map) => {
				let cookieStoreId = key;
				if (items[cookieStoreId] !== undefined) {
					this.cookieWhiteList.set(cookieStoreId, new Set(items[key]));
				} else {
					this.cookieWhiteList.set(cookieStoreId, new Set());
				}
			});

			// let firefoxDefault = "firefox-default";
			// if (items[firefoxDefault] !== undefined) {
			// 	this.cookieWhiteList.set(firefoxDefault, new Set(items[firefoxDefault]));
			// } else {
			// 	this.cookieWhiteList.set(firefoxDefault, new Set());
			// }

			// contextualIdentitieies disabled
		} else {

			if (items[defaultWhiteList] !== undefined) {
				this.cookieWhiteList.set(defaultWhiteList, new Set(items[defaultWhiteList]));
				
			} else {
				this.cookieWhiteList.set(defaultWhiteList, new Set());
				
			}

			if(items[defaultWhiteList + greyPrefix] !== undefined) {
				this.cookieWhiteList.set(defaultWhiteList + greyPrefix, new Set(items[defaultWhiteList + greyPrefix]));
			} else {
				this.cookieWhiteList.set(defaultWhiteList + greyPrefix, new Set(items[defaultWhiteList + greyPrefix]));
			}
		}
	}

	// See if the set has the url depending on the cookieStoreId
	hasHost(url, cookieStoreId = defaultWhiteList) {
		if (!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
			return false;
		}
		return this.cookieWhiteList.get(cookieStoreId).has(url);
	}

	hasHostSubdomain(cookieDomainHost, cookieBaseDomainHost, cookieStoreId = defaultWhiteList) {
		return this.hasHost(cookieDomainHost, cookieStoreId) || this.hasHost(cookieBaseDomainHost, cookieStoreId);
	}

	hasHostInWhiteOrGrey(cookieDomainHost, cookieBaseDomainHost, cookieStoreId = defaultWhiteList) {
		let otherList = this.returnOtherList(cookieStoreId);
		return this.hasHostSubdomain(cookieDomainHost, cookieBaseDomainHost, cookieStoreId) || this.hasHostSubdomain(cookieDomainHost, cookieBaseDomainHost, otherList);
	}

	// Return the Set as an array
	returnList(cookieStoreId = defaultWhiteList) {
		if (!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
		}
		return Array.from(this.cookieWhiteList.get(cookieStoreId));
	}

	// Stores the set in the local storage of the browser as an array depending on the cookieStoreId
	storeLocal(cookieStoreId = defaultWhiteList) {
		let otherList = this.returnOtherList(cookieStoreId);
		// console.log(cookieStoreId);
		browser.storage.local.set({[cookieStoreId]: Array.from(this.cookieWhiteList.get(cookieStoreId))});
		browser.storage.local.set({[otherList]: Array.from(this.cookieWhiteList.get(otherList))});
	}

	// Add the url to the set depending on the cookieStoreId
	addURL(url, cookieStoreId = defaultWhiteList) {
		if (!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
		}
		this.removeURLFromLists(url, cookieStoreId);
		this.cookieWhiteList.get(cookieStoreId).add(url);
		this.storeLocal(cookieStoreId);
	}

	// Remove the url from the set depending on the cookieStoreId
	removeURL(url, cookieStoreId = defaultWhiteList) {
		if (!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
			return;
		}
		this.cookieWhiteList.get(cookieStoreId).delete(url);
		this.storeLocal(cookieStoreId);
	}

	// Remove the url from the white and grey lists
	removeURLFromLists(url, cookieStoreId = defaultWhiteList) {
		let otherList = this.returnOtherList(cookieStoreId);
		// console.log(this.cookieWhiteList);
		// console.log(url);
		// console.log(cookieStoreId + " " + otherList);
		this.cookieWhiteList.get(cookieStoreId).delete(url);
		this.cookieWhiteList.get(otherList).delete(url);
	}

	// returns the id of the other list depending if it was greylist or whitelist
	returnOtherList(list) {
		if(list.endsWith(greyPrefix)) {
			return list.replace(greyPrefix, "");
		}
		return list + greyPrefix;
	}

	// Clears the set depending on the cookieStoreId
	clearURL(cookieStoreId = defaultWhiteList) {
		let otherList = this.returnOtherList(cookieStoreId);
		this.cookieWhiteList.get(cookieStoreId).clear();
		this.cookieWhiteList.get(otherList).clear();
		this.storeLocal(cookieStoreId);
	}

}

module.exports = WhiteListService;
