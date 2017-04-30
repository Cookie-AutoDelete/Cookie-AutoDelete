const defaultWhiteList = "defaultWhiteList";

class WhiteListService {
	constructor(items, contextualIdentitiesEnabled = false) {
		this.cookieWhiteList = new Map();
		//Sets up the whitelist for the map
		if(contextualIdentitiesEnabled) {
			browser.contextualIdentities.query({})
			.then((containers) => {
				containers.forEach(function(currentValue, index, array) {
					//nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
					if(items[currentValue.cookieStoreId] !== undefined) {
						this.cookieWhiteList.set(currentValue.cookieStoreId, new Set(items[currentValue.cookieStoreId]));
					} else {
						this.cookieWhiteList.set(currentValue.cookieStoreId, new Set());
					}
				});

				let firefoxDefault = "firefox-default";
				if(firefoxDefault !== undefined) {
					this.cookieWhiteList.set(firefoxDefault, new Set(items[firefoxDefault]));
				} else {
					this.cookieWhiteList.set(firefoxDefault, new Set());
				}
			});
		} else {
		
			if(items[defaultWhiteList] !== undefined) {
				this.cookieWhiteList.set(defaultWhiteList, new Set(items[defaultWhiteList]));
			} else {
				this.cookieWhiteList.set(defaultWhiteList, new Set());
			}

		}
	
	}

	//See if the set has the url depending on the cookieStoreId
	hasHost (url, cookieStoreId = defaultWhiteList) {
		if(!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
			return false;
		}
		return this.cookieWhiteList.get(cookieStoreId).has(url);
	}

	//Return the Set as an array
	returnList (cookieStoreId = defaultWhiteList) {
		if(!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
		}
		return Array.from(this.cookieWhiteList.get(cookieStoreId));
	}

	//Stores the set in the local storage of the browser as an array depending on the cookieStoreId
	storeLocal (cookieStoreId = defaultWhiteList) {
		browser.storage.local.set({
			[cookieStoreId]: Array.from(this.cookieWhiteList.get(cookieStoreId))
		});
	}

	//Add the url to the set depending on the cookieStoreId
	addURL (url, cookieStoreId = defaultWhiteList) {
		if(!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
		}
		this.cookieWhiteList.get(cookieStoreId).add(url);
		this.storeLocal(cookieStoreId);
	}

	//Remove the url from the set depending on the cookieStoreId
	removeURL (url, cookieStoreId = defaultWhiteList) {
		if(!this.cookieWhiteList.has(cookieStoreId)) {
			this.cookieWhiteList.set(cookieStoreId, new Set());
			return;
		}
		this.cookieWhiteList.get(cookieStoreId).delete(url);
		this.storeLocal(cookieStoreId);
	}

	//Clears the set depending on the cookieStoreId
	clearURL (cookieStoreId = defaultWhiteList) {
		this.cookieWhiteList.get(cookieStoreId).clear();
		this.storeLocal(cookieStoreId);
	}

}