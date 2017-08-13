/* global browserDetect exposedFunctions*/
const UsefulFunctions = require("./services/UsefulFunctions");
const CacheService = require("./services/CacheService");
const CleanupService = require("./services/CleanupService");
const NotificationService = require("./services/NotificationService");
const StatsService = require("./services/StatsService");
const WhiteListService = require("./services/WhiteListService");

const greyPrefix = "-Grey";
const defaultWhiteList = "defaultWhiteList";

let cleanup = new CleanupService();
let notifyCleanup = new NotificationService();
let whiteList;
let statLog;
let cache;
let contextualIdentitiesEnabled = false;
let globalSubdomainEnabled;

// Logs the error
function onError(error) {
	console.error(`Error: ${error}`);
}

// Create an alarm delay before cookie cleanup
function createActiveModeAlarm() {
	return browser.storage.local.get("delayBeforeClean")
	.then((items) => {
		let minutes = parseFloat(items.delayBeforeClean);
		// console.log(minutes);
		// minutes = .1;
		// console.log("Create Active Alarm: " + minutes);
		browser.alarms.create("activeModeAlarm", {delayInMinutes: minutes});
		return Promise.resolve();
	}).catch(onError);
}

// Create an alarm when a tab is closed
function onTabRemoved(tabId, removeInfo) {
	return browser.alarms.get("activeModeAlarm")
	.then((alarm) => {
		// This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
		// in chrome, it returns an array
		if (browserDetect() === "Firefox" && !alarm) {
			return createActiveModeAlarm();
		} else if (alarm.name !== "activeModeAlarm") {
			return createActiveModeAlarm();
		}
		return Promise.resolve();
	});
}

// Set background icon to orange
function setIconOrange(tab) {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_yellow_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "#e6a32e", tabId: tab.id
	});
}

// Set background icon to red
function setIconRed(tab) {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_red_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "red", tabId: tab.id
	});
}

// Set background icon to blue
function setIconDefault(tab) {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "blue", tabId: tab.id
	});
}

// Show the # of cookies in icon
function showNumberOfCookiesInIcon(tab) {
	return browser.cookies.getAll({
		domain: UsefulFunctions.getHostname(tab.url),
		storeId: tab.cookieStoreId
	})
	.then((cookies) => {
		browser.browserAction.setBadgeText({
			text: cookies.length.toString(),
			tabId: tab.id
		});
		return Promise.resolve();
	});
}

// Checks to see if these settings are in storage, if not create and set the default
function setPreferences(items) {
	if (items.delayBeforeClean === undefined) {
		browser.storage.local.set({delayBeforeClean: 1});
	}

	if (items.activeMode === undefined) {
		browser.storage.local.set({activeMode: false});
	}

	if (items.statLoggingSetting === undefined) {
		browser.storage.local.set({statLoggingSetting: true});
	}

	if (items.showNumberOfCookiesInIconSetting === undefined) {
		browser.storage.local.set({showNumberOfCookiesInIconSetting: true});
	}

	if (items.notifyCookieCleanUpSetting === undefined) {
		browser.storage.local.set({notifyCookieCleanUpSetting: true});
	}

	if (items.cookieCleanUpOnStartSetting === undefined) {
		browser.storage.local.set({cookieCleanUpOnStartSetting: false});
	}

	if (items.enableGlobalSubdomainSetting === undefined) {
		browser.storage.local.set({enableGlobalSubdomainSetting: true});
	}
	return Promise.resolve(items);
}

// Disable contextualIdentities features if not Firefox
function contextualCheck(items) {
	if (browserDetect() !== "Firefox" || items.contextualIdentitiesEnabledSetting === undefined) {
		contextualIdentitiesEnabled = false;
		browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
	} else {
		contextualIdentitiesEnabled = items.contextualIdentitiesEnabledSetting;
	}
	return Promise.resolve(items);
}

// Create objects based on settings
function createObjects(items) {
	globalSubdomainEnabled = items.enableGlobalSubdomainSetting;

	if (items.activeMode === true) {
		exposedFunctions.enableActiveMode();
	} else {
		exposedFunctions.disableActiveMode();
	}

	statLog = new StatsService(items);

	if (contextualIdentitiesEnabled) {
		cache = new CacheService();
		return cache.cacheContextualIdentityNamesFromStorage(items)
		.then(() => {
			whiteList = new WhiteListService(items, contextualIdentitiesEnabled, cache);
			return Promise.resolve(items);
		}).catch(onError);
	}
	whiteList = new WhiteListService(items, contextualIdentitiesEnabled);
	return Promise.resolve(items);
}

// Sets up the background page on startup
function onStartUp(cookieCleanup = false) {
	return browser.storage.local.get()
	.then((items) => {
		return contextualCheck(items);
	})
	.then((items) => {
		return setPreferences(items);
	})
	.then((items) => {
		return createObjects(items);
	})
	.then((items) => {
		// Export these so that popup and settings page can access them
		module.exports.whiteList = whiteList;
		module.exports.contextualIdentitiesEnabled = contextualIdentitiesEnabled;
		module.exports.statLog = statLog;
		module.exports.cache = cache;

		// Do a cleanup on startup if active mode is on and if its not been called from the settings page
		if (items.activeMode && cookieCleanup) {
			setTimeout(() => {
				return exposedFunctions.cleanupOperation(items.cookieCleanUpOnStartSetting, true);
			}, 1250);
		}
		return Promise.resolve();
	})
	.catch(onError);
}

onStartUp(true)
.catch(onError);

// Export these in a global variable named exposedFunctions
module.exports = {
	onStartUp() {
		return onStartUp();
	},
	// Set the defaults
	setDefaults() {
		return browser.storage.local.clear()
		.then(() => {
			return onStartUp();
		});
	},

	cleanupOperation(ignoreOpenTabs = false, startUp = false) {
		return cleanup.cleanCookiesOperation({
			ignoreOpenTabs,
			whiteList,
			contextualIdentitiesEnabled,
			cache,
			startUp,
			globalSubdomainEnabled
		})
		.then((setOfDeletedDomainCookies) => {
			statLog.incrementCounter(cleanup.recentlyCleaned);
			return notifyCleanup.notifyCookieCleanUp(cleanup.recentlyCleaned, setOfDeletedDomainCookies);
		});
	},
	// Used in the popup
	getNotifyMessage() {
		return notifyCleanup.notifyMessage;
	},
	// Enable automatic cookie cleanup
	enableActiveMode() {
		browser.tabs.onRemoved.addListener(onTabRemoved);
		// console.log("ActiveMode");
	},

	// Disable automatic cookie cleanup
	disableActiveMode() {
		browser.tabs.onRemoved.removeListener(onTabRemoved);
		return browser.alarms.clear("activeModeAlarm")
		.then((wasCleared) => {
			// console.log(wasCleared);
			return Promise.resolve();
		});
		// console.log("DisabledMode");
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
	// Checks if the host domain is in the whitelist and colors the icon
	checkIfProtected(tab) {
		let domainHost = UsefulFunctions.getHostname(tab.url);
		let baseDomainHost = globalSubdomainEnabled ? UsefulFunctions.extractBaseDomain(domainHost) : domainHost;
		if (contextualIdentitiesEnabled) {
			if (whiteList.hasHostSubdomain(domainHost, baseDomainHost, tab.cookieStoreId)) {
				setIconDefault(tab);
			} else if (whiteList.hasHostSubdomain(domainHost, baseDomainHost, tab.cookieStoreId + greyPrefix)) {
				setIconOrange(tab);
			} else {
				setIconRed(tab);
			}
		} else if (whiteList.hasHostSubdomain(domainHost, baseDomainHost)) {
			setIconDefault(tab);
		} else if (whiteList.hasHostSubdomain(domainHost, baseDomainHost, defaultWhiteList + greyPrefix)) {
			setIconOrange(tab);
		} else {
			setIconRed(tab);
		}
	}

};

// Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		exposedFunctions.checkIfProtected(tab);

		return browser.windows.getCurrent()
		.then((windowInfo) => {
			// Disable the popup in incognito/private mode
			if (windowInfo.incognito) {
				browser.browserAction.disable(tab.id);
				browser.browserAction.setBadgeText({
					text: "X", tabId: tab.id
				});
				browser.browserAction.setBadgeBackgroundColor({
					color: "red", tabId: tab.id
				});
				setIconRed(tab);
				return Promise.resolve();
			}
			// Not incognito mode
			browser.browserAction.enable(tab.id);
			browser.browserAction.setBadgeText({
				text: "", tabId: tab.id
			});

			return browser.storage.local.get("showNumberOfCookiesInIconSetting")
			.then((items) => {
				if (items.showNumberOfCookiesInIconSetting === true) {
					return showNumberOfCookiesInIcon(tab);
				}
				return Promise.resolve();
			});
		}).catch(onError);
	}
	return undefined;
});

// Alarm event handler for Active Mode
browser.alarms.onAlarm.addListener((alarmInfo) => {
	// console.log(alarmInfo.name);
	if (alarmInfo.name === "activeModeAlarm") {
		exposedFunctions.cleanupOperation();
		browser.alarms.clear(alarmInfo.name);
	}
});
