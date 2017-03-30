
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
		//console.log("Create Active Alarm: " + minutes);
		browser.alarms.create("activeModeAlarm",{
			delayInMinutes: minutes
		});
	}).catch(onError);
}

//Returns an array of domains and subdomains (sub.sub.domain.com becomes [sub.sub.domain.com, sub.domain.com, domain.com])
function splitSubDomain(domain) {
	let relatedDomains = new Array();
	let splited = domain.split(".");
	relatedDomains.push(splited[splited.length - 2] + "." + splited[splited.length - 1])
	let j = 0;
	for(let i = splited.length - 3; i >= 0; i--) {
		let combined = splited[i] + "." +relatedDomains[j];
		relatedDomains.push(combined);
		j++;
	}
  
	return relatedDomains;
}

//extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
function extractMainDomain(domain) {
	//Return the domain if it is an ip address
	let reIP = new RegExp('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+');
	if(reIP.test(domain)) {
		return domain;
	}
	//Delete a '.' if domain contains it at the end
	if(domain.charAt(domain.length - 1) === ".") {
		domain = domain.slice(0, domain.length - 1);
	}
	let re = new RegExp('[a-z0-9|-]+\.[a-z]+$');
	return re.exec(domain)[0];
}


//Puts the domain in the right format for browser.cookies.clean() 
function prepareCookieDomain(cookie) {
	let cookieDomain = cookie.domain;
	if(cookieDomain.charAt(0) === ".") {
		cookieDomain = cookieDomain.slice(1);
	}
	cookieDomain = cookie.secure ? "https://" + cookieDomain : "http://" + cookieDomain;
	return cookieDomain;
}

//Deletes cookies if there is no existing cookie's host main url in an open tab
function cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies) {
	for(let i = 0; i < cookies.length; i++) {
		//https://domain.com or http://domain.com
		let cookieDomain = prepareCookieDomain(cookies[i]);
		//sub.sub.domain.com
		let cookieDomainHost = getHostname(cookieDomain);
		//domain.com
		let cookieMainDomainHost = extractMainDomain(cookieDomainHost);
		
		//hasHost has flexible checking(differentiate between sub.sub.domain.com and domain.com)
		//while setOfTabURLS is not flexible (sub.sub.domain.com will match to domain.com if in host domain in tab)
		let safeToClean;
		if(contextualIdentitiesEnabled) {
			safeToClean = !hasHost(cookieDomainHost, cookies[i].storeId) && !setOfTabURLS.has(cookieMainDomainHost);
		} else {
			safeToClean = !hasHost(cookieDomainHost) && !setOfTabURLS.has(cookieMainDomainHost);
		}
		if(safeToClean) {
			//Append the path to cookie
			cookieDomain = cookieDomain + cookies[i].path;
			//console.log("Original: " + cookies[i].domain + " CookieDomain: " + cookieDomain + " CookieDomainMainHost: " + cookieMainDomainHost);
			//console.log("CookieDomain: " + cookieDomain + " ID: " + cookies[i].storeId);
			if(contextualIdentitiesEnabled) {
				
				//setOfDeletedDomainCookies.add(cookieDomainHost + ": " + cookies[i].storeId);
				let name = getNameFromCookieID(cookies[i].storeId);
				setOfDeletedDomainCookies.add(`${cookieMainDomainHost} (${name})`);
			} else {
				setOfDeletedDomainCookies.add(cookieDomainHost);
			}

			// url: "http://domain.com" + cookies[i].path
			browser.cookies.remove({
				url: cookieDomain,
				name: cookies[i].name,
				storeId: cookies[i].storeId
			});
			incrementCounter();
			recentlyCleaned++;
		}
	}
	return Promise.resolve(setOfDeletedDomainCookies);
}

//Main function for cookie cleanup 
function cleanCookiesOperation() {
	//console.log("Cleaning");
	//Stores all tabs' host domains
	let setOfTabURLS = new Set();
	//Stores the deleted domains (for notification)
	let setOfDeletedDomainCookies = new Set();
	recentlyCleaned = 0;
	//Store all tabs' host domains to prevent cookie deletion from those domains
	browser.tabs.query({
		"windowType": "normal"
	})
	.then(function(tabs) {
		for(let i = 0; i < tabs.length; i++) {
			if (isAWebpage(tabs[i].url)) {
				let hostURL = getHostname(tabs[i].url);
				hostURL = extractMainDomain(hostURL);
				setOfTabURLS.add(hostURL);
			}
		}
		//console.log(setOfTabURLS);

		if(contextualIdentitiesEnabled) {
			//Clean cookies in different cookie ids using the contextual identities api
			let promiseContainers = [];
			browser.contextualIdentities.query({})
			.then(function(containers) {
				containers.forEach(function(currentValue, index, array) {
					browser.cookies.getAll({storeId: currentValue.cookieStoreId})
					.then(function(cookies) {
						promiseContainers.push(cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies));
					});
				});

				return browser.cookies.getAll({});
			})
			.then(function(cookies) {
				//Clean the default cookie id container
				promiseContainers.push(cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies));
				Promise.all(promiseContainers)
				.then(notifyCookieCleanUp(setOfDeletedDomainCookies));
			});

		} else {
			//Clean the default cookie id container
			browser.cookies.getAll({})
			.then(function(cookies) {
				cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies)
				.then(notifyCookieCleanUp(setOfDeletedDomainCookies));
			});
		}
		
		
	});
}

//Creates a notification of what cookies were cleaned and how many
function notifyCookieCleanUp(setOfDeletedDomainCookies) {
	if(setOfDeletedDomainCookies.size > 0) {
		let stringOfDomains = "";
		let commaAppendIndex = 0;
		setOfDeletedDomainCookies.forEach(function(value1, value2, set) {
			stringOfDomains = stringOfDomains + value2;
			commaAppendIndex++;
			if(commaAppendIndex < setOfDeletedDomainCookies.size) {
				stringOfDomains = stringOfDomains + ", ";
			}
			
		}); 
		notifyMessage = recentlyCleaned + " Deleted Cookies from: " + stringOfDomains;
	}
	
	browser.storage.local.get("notifyCookieCleanUpSetting")
	.then(function(items) {
		if(setOfDeletedDomainCookies.size > 0 && items.notifyCookieCleanUpSetting) {
		return browser.notifications.create(cookieNotifyDone, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/icon_48.png"),
				"title": "Cookie AutoDelete: Cookies were Deleted!",
				"message": notifyMessage
			});
		}
	});
	
}

//Logs the error
function onError(error) {
	console.error(`Error: ${error}`);
}


//Returns the host name of the url. Etc. "https://en.wikipedia.org/wiki/Cat" becomes en.wikipedia.org
function getHostname(url) {
    var hostname = new URL(url).hostname;
    // Strip "www." if the URL starts with it.
    hostname = hostname.replace(/^www\./, '');
    return hostname;
}

//Returns true if it is a webpage
function isAWebpage(URL) {
	if(URL.match(/^http:/) || URL.match(/^https:/)) {
		return true;
	}
	return false;
}

//See if the set has the url depending on the cookieStoreId
function hasHost(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return false;
	}
	return cookieWhiteList.get(cookieStoreId).has(url);
}

//Return the Set as an array
function returnList(cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	return Array.from(cookieWhiteList.get(cookieStoreId));
}

//Stores the set in the local storage of the browser as an array depending on the cookieStoreId
function storeLocal(cookieStoreId = defaultWhiteList) {
	browser.storage.local.set({
		[cookieStoreId]: Array.from(cookieWhiteList.get(cookieStoreId))
	});
}

//Add the url to the set depending on the cookieStoreId
function addURL(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	cookieWhiteList.get(cookieStoreId).add(url);
	storeLocal(cookieStoreId);
}

//Remove the url from the set depending on the cookieStoreId
function removeURL(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return;
	}
	cookieWhiteList.get(cookieStoreId).delete(url);
	storeLocal(cookieStoreId);
}

//Clears the set depending on the cookieStoreId
function clearURL(cookieStoreId = defaultWhiteList) {
	cookieWhiteList.get(cookieStoreId).clear();
	storeLocal(cookieStoreId);
}


//Increment the counter and store the counter to local after 1 minute
function incrementCounter() {
	browser.storage.local.get("statLoggingSetting")
	.then(function(items) {
		if(items.statLoggingSetting === true) {
			cookieDeletedCounterTotal++;
			cookieDeletedCounter++;
			browser.alarms.create("storeCounterToLocalAlarm", {
				delayInMinutes: 1
			});
		}
	}).catch(onError);
}

//Resets the counter
function resetCounter() {
	browser.storage.local.set({cookieDeletedCounterTotal: 0});
	cookieDeletedCounterTotal = 0;
	cookieDeletedCounter = 0;
}

//Stores the total cookie entries deleted to local
function storeCounterToLocal() {
	browser.storage.local.set({cookieDeletedCounterTotal: cookieDeletedCounterTotal});
}

var nameCacheMap = new Map();
function getNameFromCookieID(id) {
	if(nameCacheMap.has(id)) {
		return nameCacheMap.get(id);
	} else {
		browser.contextualIdentities.query({})
		.then(function(containers) {
			containers.forEach(function(currentValue, index, array) {
				nameCacheMap.set(currentValue.cookieStoreId, currentValue.name);
			});
			return nameCacheMap.get(id);
		});
	}
}

//Sets up the background page on startup
function onStartUp() {
	browser.storage.local.get()
	.then(function(items) {
		//Disable contextualIdentities features if not Firefox
		//console.log(browserDetect());
		if(browserDetect() !== "Firefox" || browser.contextualIdentities === undefined) {
			contextualIdentitiesEnabled = false;
			browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
		} else if(items.contextualIdentitiesEnabledSetting === undefined) {
			contextualIdentitiesEnabled = false;
			browser.storage.local.set({contextualIdentitiesEnabledSetting: false});
		} else {
			contextualIdentitiesEnabled = items.contextualIdentitiesEnabledSetting;
		}

		//console.log(items);
		cookieWhiteList = new Map();
		//Sets up the whitelist for the map
		if(contextualIdentitiesEnabled) {
			browser.contextualIdentities.query({})
			.then(function(containers) {
				nameCacheMap.set("firefox-default", "Default");
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
		//console.log();
		//Checks to see if these settings are in storage, if not create and set the default
		if(items.delayBeforeClean === undefined) {
			browser.storage.local.set({delayBeforeClean: 1});
		} 	
		
		if(items.cookieDeletedCounterTotal === undefined) {
			resetCounter();
		} else {
			cookieDeletedCounterTotal = items.cookieDeletedCounterTotal;
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

//A map that maps cookieStoreID to a Set of whitelist 
var cookieWhiteList;
//Notification ID
const cookieNotifyDone = "cookieNotifyDone";
var notifyMessage = "";

var contextualIdentitiesEnabled = false;

//Default whitelist when contextualIdentitiesEnabled is false
const defaultWhiteList = "defaultWhiteList";

var cookieDeletedCounterTotal;
var recentlyCleaned = 0;
var cookieDeletedCounter = 0;

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
			if(hasHost(getHostname(tab.url), tab.cookieStoreId)) {
				setIconDefault(tab);
			} else {
				setIconRed(tab);
			}
		} else {
			if(hasHost(getHostname(tab.url))) {
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
		cleanCookiesOperation();
		browser.alarms.clear(alarmInfo.name);

	}
	if(alarmInfo.name === "storeCounterToLocalAlarm") {
		storeCounterToLocal();
	}

});

