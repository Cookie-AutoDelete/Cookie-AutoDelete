var cleanup = new CleanupService();
var notifyCleanup = new NotificationService();
var whiteList;
var statLog;
var cache;
var contextualIdentitiesEnabled = false;

//Create an alarm when a tab is closed
function onTabRemoved(tabId, removeInfo) {
	browser.alarms.get("activeModeAlarm")
	.then(function(alarm) {
		//This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
		//in chrome, it returns an array
		if(browserDetect() === "Firefox" && !alarm) {
			createActiveModeAlarm();
		} else if(alarm.name !== "activeModeAlarm") {
			createActiveModeAlarm();
		}
	});
}

//Enable automatic cookie cleanup
function enableActiveMode() {
	browser.tabs.onRemoved.addListener(onTabRemoved);
	//console.log("ActiveMode");
}

//Disable automatic cookie cleanup
function disableActiveMode() {
	browser.tabs.onRemoved.removeListener(onTabRemoved);
	//console.log("DisabledMode");
}

//Create an alarm delay before cookie cleanup
function createActiveModeAlarm() {
	browser.storage.local.get("delayBeforeClean")
	.then(function(items) {
		let minutes = parseInt(items.delayBeforeClean, 10);
		//let minutes = .1;
		//console.log("Create Active Alarm: " + minutes);
		browser.alarms.create("activeModeAlarm",{
			delayInMinutes: minutes
		});
	}).catch(onError);
}


//Sets up the background page on startup
function onStartUp() {
	browser.storage.local.get()
	.then(function(items) {
		//Disable contextualIdentities features if not Firefox
		//console.log(browserDetect());
		if(browserDetect() !== "Firefox") {
			contextualIdentitiesEnabled = false;
			browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
		} else if(items.contextualIdentitiesEnabledSetting === undefined) {
			contextualIdentitiesEnabled = false;
			browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
		} else {
			contextualIdentitiesEnabled = items.contextualIdentitiesEnabledSetting;
		}

		if(contextualIdentitiesEnabled) {
			cache = new CacheService();
		}

		whiteList = new WhiteListService(items, contextualIdentitiesEnabled);
		statLog = new StatsService(items);
		

		//Checks to see if these settings are in storage, if not create and set the default
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

		//Create objects based on settings
		if(items.activeMode === true) {
			enableActiveMode();
		} else {
			disableActiveMode();
		}

	}).catch(onError);
}


//Set the defaults 
function setDefaults() {
	browser.storage.local.clear()
	.then(function() {
		onStartUp();
	});
}

//setDefaults();
onStartUp();

//Show the # of cookies in icon
function showNumberOfCookiesInIcon(tabURL,tabID) {
	browser.cookies.getAll({
		domain: getHostname(tabURL)
	})
	.then(function(cookies) {
		browser.browserAction.setBadgeText({text: cookies.length.toString(), tabId: tabID});
		
	});
	
}
 
//Set background icon to red
function setIconRed(tab) {
	browser.browserAction.setIcon({
	    tabId: tab.id, path: {48:"icons/icon_red_48.png"}
	  });
	browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: tab.id});
}

//Set background icon to blue
function setIconDefault(tab) {
	browser.browserAction.setIcon({
	    tabId: tab.id, path: {48:"icons/icon_48.png"}
	  });
	browser.browserAction.setBadgeBackgroundColor({color: "blue", tabId: tab.id});
}

//Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.status === "complete") {
		browser.windows.getCurrent()
		.then(function(windowInfo) {
			if (windowInfo.incognito) {
				browser.browserAction.disable(tab.id);
				browser.browserAction.setBadgeText({text: "X", tabId: tab.id});
				browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: tab.id});
				setIconRed(tab);
			} else {
				browser.browserAction.enable(tab.id);
				browser.browserAction.setBadgeText({text: "", tabId: tab.id});
				browser.storage.local.get("showNumberOfCookiesInIconSetting")
				.then(function(items) {
					if(items.showNumberOfCookiesInIconSetting === true) {
						showNumberOfCookiesInIcon(tab.url, tab.id);
					} 
				});
			}
		}).catch(onError);

		if(contextualIdentitiesEnabled) {
			if(whiteList.hasHost(getHostname(tab.url), tab.cookieStoreId)) {
				setIconDefault(tab);
			} else {
				setIconRed(tab);
			}
		} else {
			if(whiteList.hasHost(getHostname(tab.url))) {
				setIconDefault(tab);
			} else {
				setIconRed(tab);
			}
		}
	}


});

//Alarm event handler
browser.alarms.onAlarm.addListener(function (alarmInfo) {
	//console.log(alarmInfo.name);
	if(alarmInfo.name === "activeModeAlarm") {
		cleanup.cleanCookiesOperation();
		browser.alarms.clear(alarmInfo.name);

	}

});

