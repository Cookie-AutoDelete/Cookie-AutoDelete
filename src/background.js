const UsefulFunctions = require("./services/UsefulFunctions");

const CacheService = require("./services/CacheService");
const CleanupService = require("./services/CleanupService");
const NotificationService = require("./services/NotificationService");
const StatsService = require("./services/StatsService");
const WhiteListService = require("./services/WhiteListService");

var cleanup = new CleanupService();
var notifyCleanup = new NotificationService();
var whiteList;
var statLog;
var cache;
var contextualIdentitiesEnabled = false;

//Create an alarm when a tab is closed
function onTabRemoved(tabId, removeInfo) {
	browser.alarms.get("activeModeAlarm")
	.then((alarm) => {
		//This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
		//in chrome, it returns an array
		if(browserDetect() === "Firefox" && !alarm) {
			createActiveModeAlarm();
		} else if(alarm.name !== "activeModeAlarm") {
			createActiveModeAlarm();
		}
	});
}



//Create an alarm delay before cookie cleanup
function createActiveModeAlarm() {
	browser.storage.local.get("delayBeforeClean")
	.then((items) => {
		let minutes = parseFloat(items.delayBeforeClean);
		//console.log(minutes);
		//minutes = .1;
		//console.log("Create Active Alarm: " + minutes);
		browser.alarms.create("activeModeAlarm",{
			delayInMinutes: minutes
		});
	}).catch(onError);
}

//Checks to see if these settings are in storage, if not create and set the default
function setPreferences(items) {
	if(items.delayBeforeClean === undefined) {
		browser.storage.local.set({delayBeforeClean: 1});
	} 	
	
	
	if(items.activeMode === undefined) {
		browser.storage.local.set({activeMode: false});
	} 	
	
	if(items.statLoggingSetting === undefined) {
		browser.storage.local.set({statLoggingSetting: true});
	}

	if(items.showNumberOfCookiesInIconSetting === undefined) {
		browser.storage.local.set({showNumberOfCookiesInIconSetting: true});
	}

	if(items.notifyCookieCleanUpSetting === undefined) {
		browser.storage.local.set({notifyCookieCleanUpSetting: true});
	}

	if(items.cookieCleanUpOnStartSetting === undefined) {
		browser.storage.local.set({cookieCleanUpOnStartSetting: false});
	}
	return Promise.resolve(items);
}

//Disable contextualIdentities features if not Firefox
function contextualCheck(items) {
	if(browserDetect() !== "Firefox") {
		contextualIdentitiesEnabled = false;
		browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
	} else if(items.contextualIdentitiesEnabledSetting === undefined) {
		contextualIdentitiesEnabled = false;
		browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
	} else {
		contextualIdentitiesEnabled = items.contextualIdentitiesEnabledSetting;
	}
	return Promise.resolve(items);
}

//Create objects based on settings
function createObjects(items) {
	if(items.activeMode === true) {
		exposedFunctions.enableActiveMode();
	} else {
		exposedFunctions.disableActiveMode();
	}
	
	if(contextualIdentitiesEnabled) {
		cache = new CacheService();
		cache.cacheContextualIdentityNamesFromStorage(items)
		.then(() => {
			whiteList = new WhiteListService(items, contextualIdentitiesEnabled, cache);
		});
		
	} else {
		whiteList = new WhiteListService(items, contextualIdentitiesEnabled);
	}

	statLog = new StatsService(items);

	
	return Promise.resolve(items);
}

//Sets up the background page on startup
function onStartUp() {
	return browser.storage.local.get()
	.then((items) => {
		return contextualCheck(items);
	}).then((items) =>{
		return setPreferences(items);
	}).then((items) =>{
		return createObjects(items);
	}).then((items) =>{
		module.exports.whiteList = whiteList;
		module.exports.contextualIdentitiesEnabled = contextualIdentitiesEnabled;
		module.exports.statLog = statLog;
		module.exports.cache = cache;
	}).catch(onError);
}

//Logs the error
function onError(error) {
	console.error(`Error: ${error}`);
}

//Does a cookie cleanup on startup if the user chooses
function cookieCleanUpOnStart(items) {
	return browser.storage.local.get()
	.then((items) => {
		if(items.cookieCleanUpOnStartSetting === true) {
			console.log("Startup Cleanup");
			exposedFunctions.cleanupOperation(true);
		}
	});
}

onStartUp()
.then(cookieCleanUpOnStart);

module.exports = {
	onStartUp() {
		return onStartUp();
	},
	//Set the defaults 
	setDefaults() {
		return browser.storage.local.clear()
		.then(() => {
			return onStartUp();
		});
	},

	cleanupOperation(ignoreOpenTabs = false) {
		cleanup.cleanCookiesOperation(ignoreOpenTabs, whiteList, contextualIdentitiesEnabled, cache)
		.then((setOfDeletedDomainCookies) => {
			return notifyCleanup.notifyCookieCleanUp(cleanup.recentlyCleaned, setOfDeletedDomainCookies)
		});
	},
	getNotifyMessage() {
		return notifyCleanup.notifyMessage;
	},
	//Enable automatic cookie cleanup
	enableActiveMode() {
		browser.tabs.onRemoved.addListener(onTabRemoved);
		//console.log("ActiveMode");
	},

	//Disable automatic cookie cleanup
	disableActiveMode() {
		browser.tabs.onRemoved.removeListener(onTabRemoved);
		browser.alarms.clear("activeModeAlarm")
		.then((wasCleared) => {
			//console.log(wasCleared);
		});
		//console.log("DisabledMode");
	},
	splitSubDomain(domain) {
		return UsefulFunctions.splitSubDomain(domain);
	},

	extractMainDomain(domain) {
		return UsefulFunctions.extractMainDomain(domain);
	},

	getHostname(urlToGetHostName) {
		return UsefulFunctions.getHostname(urlToGetHostName);
	},

	isAWebpage(URL) {
		return UsefulFunctions.isAWebpage(URL);
	},
	prepareCookieDomain(cookie) {
		return cleanup.prepareCookieDomain(cookie);
	},
	//Set background icon to red
	setIconRed(tab) {
		browser.browserAction.setIcon({
		    tabId: tab.id, path: {48:"icons/icon_red_48.png"}
		  });
		browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: tab.id});
	},

	//Set background icon to blue
	setIconDefault(tab) {
		browser.browserAction.setIcon({
		    tabId: tab.id, path: {48:"icons/icon_48.png"}
		  });
		browser.browserAction.setBadgeBackgroundColor({color: "blue", tabId: tab.id});
	}
	
}





//Show the # of cookies in icon
function showNumberOfCookiesInIcon(tabURL,tabID) {
	browser.cookies.getAll({
		domain: UsefulFunctions.getHostname(tabURL)
	})
	.then((cookies) => {
		browser.browserAction.setBadgeText({text: cookies.length.toString(), tabId: tabID});
		
	});
	
}
 


//Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		browser.windows.getCurrent()
		.then((windowInfo) => {
			if (windowInfo.incognito) {
				browser.browserAction.disable(tab.id);
				browser.browserAction.setBadgeText({text: "X", tabId: tab.id});
				browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: tab.id});
				setIconRed(tab);
			} else {
				browser.browserAction.enable(tab.id);
				browser.browserAction.setBadgeText({text: "", tabId: tab.id});
				browser.storage.local.get("showNumberOfCookiesInIconSetting")
				.then((items) => {
					if(items.showNumberOfCookiesInIconSetting === true) {
						showNumberOfCookiesInIcon(tab.url, tab.id);
					} 
				});
			}
		}).catch(onError);

		if(contextualIdentitiesEnabled) {
			if(whiteList.hasHost(UsefulFunctions.getHostname(tab.url), tab.cookieStoreId)) {
				exposedFunctions.setIconDefault(tab);
			} else {
				exposedFunctions.setIconRed(tab);
			}
		} else {
			if(whiteList.hasHost(UsefulFunctions.getHostname(tab.url))) {
				exposedFunctions.setIconDefault(tab);
			} else {
				exposedFunctions.setIconRed(tab);
			}
		}
	}


});

//Alarm event handler
browser.alarms.onAlarm.addListener((alarmInfo) => {
	//console.log(alarmInfo.name);
	if(alarmInfo.name === "activeModeAlarm") {
		exposedFunctions.cleanupOperation();
		browser.alarms.clear(alarmInfo.name);

	}

});

