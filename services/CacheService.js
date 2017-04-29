class CacheService {
	constructor() {
		this.nameCacheMap = new Map();
		this.cacheContextualIdentityNames();
	}

	cacheContextualIdentityNames() {
		browser.contextualIdentities.query({})
		.then((containers) => {
			containers.forEach(function(currentValue, index, array) {
				this.nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
			});
		});
	}

	getNameFromCookieID(id) {
		if(this.nameCacheMap.has(id)) {
			return this.nameCacheMap.get(id);
		} else {
			this.cacheContextualIdentityNames();
			return this.nameCacheMap.get(id);
		}
	}	

}