class CacheService {
	constructor() {
		this.nameCacheMap = new Map();
		this.nameCacheMap.set("firefox-default", "Default");
	}

	cacheContextualIdentityNames() {
		return browser.contextualIdentities.query({})
		.then((containers) => {
			browser.storage.local.set({containerCache: containers});
			containers.forEach((currentValue, index, array) => {
				this.nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
			});

		});
		
	}

	cacheContextualIdentityNamesFromStorage(items) {
		if(items.containerCache === undefined) {
			return this.cacheContextualIdentityNames();
		} else {
			items.containerCache.forEach((currentValue, index, array) => {
				this.nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
			});
			return Promise.resolve();
		}
	}

	getNameFromCookieID(id) {
		if(this.nameCacheMap.has(id)) {
			return this.nameCacheMap.get(id);
		} else {
			this.cacheContextualIdentityNames()
			.then(() => {
				return this.nameCacheMap.get(id);
			});
			
		}
	}	

}