const greyPrefix = "-Grey";

class CacheService {
	constructor() {
		this.nameCacheMap = new Map();
		this.nameCacheMap.set("firefox-default", "Default");
		this.nameCacheMap.set("firefox-default" + greyPrefix, "Default" + greyPrefix);
	}

	// Store contenxtual identity names in storage
	cacheContextualIdentityNames() {
		return browser.contextualIdentities.query({})
		.then((containers) => {
			containers.forEach((currentValue, index, array) => {
				this.nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
				this.nameCacheMap.set(currentValue.cookieStoreId + greyPrefix, currentValue.name  + greyPrefix);
			});
			return browser.storage.local.set({containerCache: containers});
		});
	}

	// Populate the map from storage
	cacheContextualIdentityNamesFromStorage(items) {
		if (items.containerCache === undefined) {
			return this.cacheContextualIdentityNames();
		}
		items.containerCache.forEach((currentValue, index, array) => {
			this.nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
			this.nameCacheMap.set(currentValue.cookieStoreId + greyPrefix, currentValue.name  + greyPrefix);
		});
		return Promise.resolve();
	}

	// Returns the name of the contexual identity name from the cookie store id
	getNameFromCookieID(id) {
		if (!this.nameCacheMap.has(id)) {
			return this.cacheContextualIdentityNames()
			.then(() => {
				return this.nameCacheMap.get(id);
			});
		}
		return this.nameCacheMap.get(id);
	}

}

module.exports = CacheService;
