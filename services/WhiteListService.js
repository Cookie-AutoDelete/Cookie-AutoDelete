const defaultWhiteList = "defaultWhiteList";

function WhiteListService() {
	browser.storage.local.get()
	.then(function(items) {
		this.cookieWhiteList = new Map();
		//Sets up the whitelist for the map
		if(contextualIdentitiesEnabled) {
			browser.contextualIdentities.query({})
			.then(function(containers) {
				containers.forEach(function(currentValue, index, array) {
					nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
					if(items[currentValue.cookieStoreId] !== undefined) {
						cookieWhiteList.set(currentValue.cookieStoreId, new Set(items[currentValue.cookieStoreId]));
					} else {
						cookieWhiteList.set(currentValue.cookieStoreId, new Set());
					}
				});

				let firefoxDefault = "firefox-default";
				if(firefoxDefault !== undefined) {
					cookieWhiteList.set(firefoxDefault, new Set(items[firefoxDefault]));
				} else {
					cookieWhiteList.set(firefoxDefault, new Set());
				}
			});
		} else {
		
			if(items[defaultWhiteList] !== undefined) {
				cookieWhiteList.set(defaultWhiteList, new Set(items[defaultWhiteList]));
			} else {
				cookieWhiteList.set(defaultWhiteList, new Set());
			}

		}

	});
}

//See if the set has the url depending on the cookieStoreId
WhiteListService.prototype.hasHost = function (url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return false;
	}
	return cookieWhiteList.get(cookieStoreId).has(url);
}

//Return the Set as an array
WhiteListService.prototype.returnList = function (cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	return Array.from(cookieWhiteList.get(cookieStoreId));
}

//Stores the set in the local storage of the browser as an array depending on the cookieStoreId
WhiteListService.prototype.storeLocal = function (cookieStoreId = defaultWhiteList) {
	browser.storage.local.set({
		[cookieStoreId]: Array.from(cookieWhiteList.get(cookieStoreId))
	});
}

//Add the url to the set depending on the cookieStoreId
WhiteListService.prototype.addURL = function (url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	cookieWhiteList.get(cookieStoreId).add(url);
	storeLocal(cookieStoreId);
}

//Remove the url from the set depending on the cookieStoreId
WhiteListService.prototype.removeURL = function (url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return;
	}
	cookieWhiteList.get(cookieStoreId).delete(url);
	storeLocal(cookieStoreId);
}

//Clears the set depending on the cookieStoreId
WhiteListService.prototype.clearURL = function (cookieStoreId = defaultWhiteList) {
	cookieWhiteList.get(cookieStoreId).clear();
	storeLocal(cookieStoreId);
}