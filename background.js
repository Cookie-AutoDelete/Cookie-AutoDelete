const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function onTabRemoved(tabId, removeInfo) {
	browser.alarms.get("activeModeAlarm")
	.then(function(alarm) {
		//console.log(layoutEngine.vendor);
		//This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
		//in chrome, it returns an array
		if(layoutEngine.vendor === "mozilla" && !alarm) {
			createActiveModeAlarm();
		} else if(alarm.name !== "activeModeAlarm") {
			createActiveModeAlarm();
		}
	});
}


function enableActiveMode() {
	browser.tabs.onRemoved.addListener(onTabRemoved);
	console.log("ActiveMode");
}

function disableActiveMode() {
	browser.tabs.onRemoved.removeListener(onTabRemoved);
	console.log("DisabledMode");
}

function createActiveModeAlarm() {
	browser.storage.local.get("delayBeforeClean")
	.then(function(items) {
		let minutes = parseInt(items.delayBeforeClean, 10);
		console.log("Create Active Alarm: " + minutes);
		browser.alarms.create("activeModeAlarm",{
			delayInMinutes: minutes
		});
	}).catch(onError);
}
// ([a-z0-9]+[.])*example.com

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

function extractMainDomain(domain) {
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

function cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies) {
	for(let i = 0; i < cookies.length; i++) {
		//https://domain.com or http://domain.com
		let cookieDomain = prepareCookieDomain(cookies[i]);
		//sub.sub.domain.com
		let cookieDomainHost = getHostname(cookieDomain);
		//domain.com
		let cookieMainDomainHost = extractMainDomain(cookieDomainHost);
		
		//hasHost has flexible checking(differentiate between sub.sub.domain.com and domain.com)
		//while setOfTabURLS is not (sub.sub.domain.com will match to domain.com if in host url in tab)
		if(!hasHost(cookieDomainHost, cookies[i].storeId) && !setOfTabURLS.has(cookieMainDomainHost)) {
			//Append the path to cookie
			cookieDomain = cookieDomain + cookies[i].path;
			//console.log("Original: " + cookies[i].domain + " CookieDomain: " + cookieDomain + " CookieDomainMainHost: " + cookieMainDomainHost);
			console.log("CookieDomain: " + cookieDomain + " ID: " + cookies[i].storeId);
			if(contextualIdentitiesEnabled) {
				setOfDeletedDomainCookies.add(cookieDomainHost + ": " + cookies[i].storeId);
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

function cleanCookiesOperation() {
	console.log("Cleaning");
	let setOfTabURLS = new Set();
	let setOfDeletedDomainCookies = new Set();
	recentlyCleaned = 0;
	browser.tabs.query({})
	.then(function(tabs) {
		for(let i = 0; i < tabs.length; i++) {
			if (isAWebpage(tabs[i].url)) {
				let hostURL = getHostname(tabs[i].url);
				hostURL = extractMainDomain(hostURL);
				setOfTabURLS.add(hostURL);
			}
		}
		console.log(setOfTabURLS);

		if(contextualIdentitiesEnabled) {
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
				promiseContainers.push(cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies));
				Promise.all(promiseContainers)
				.then(notifyCookieCleanUp(setOfDeletedDomainCookies));
			});

		} else {
			browser.cookies.getAll({})
			.then(function(cookies) {
				console.log("1");
				cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies)
				.then(notifyCookieCleanUp(setOfDeletedDomainCookies));
			});
		}
		
		
	});
}

function notifyCookieCleanUp(setOfDeletedDomainCookies) {
	console.log("2");
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
		return browser.notifications.create(cookieNotifyDone, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/icon_48.png"),
				"title": "Cookie AutoDelete: Cookies were Deleted!",
				"message": notifyMessage
			});
	}

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

function isAWebpage(URL) {
	if(URL.match(/^http:/) || URL.match(/^https:/)) {
		return true;
	}
	return false;
}

//See if the set has the url
function hasHost(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return false;
	}
	return cookieWhiteList.get(cookieStoreId).has(url);
}

function returnList(cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	return Array.from(cookieWhiteList.get(cookieStoreId));
}

//Stores the set in the local storage of the browser as an array
function storeLocal(cookieStoreId = defaultWhiteList) {
	browser.storage.local.set({
		[cookieStoreId]: Array.from(cookieWhiteList.get(cookieStoreId))
	});
	browser.storage.local.get(cookieStoreId)
	.then(function(items) {
		
		console.log(items[cookieStoreId]);
	});
}

//Add the url to the set
function addURL(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
	}
	cookieWhiteList.get(cookieStoreId).add(url);
	storeLocal(cookieStoreId);
}

//Remove the url from the set
function removeURL(url, cookieStoreId = defaultWhiteList) {
	if(!cookieWhiteList.has(cookieStoreId)) {
		cookieWhiteList.set(cookieStoreId, new Set());
		return;
	}
	cookieWhiteList.get(cookieStoreId).delete(url);
	storeLocal(cookieStoreId);
}

//Clears the set
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

//Sets up the background page on startup
function onStartUp() {
	browser.storage.local.get()
	.then(function(items) {
		console.log(items);
		cookieWhiteList = new Map();

		if(contextualIdentitiesEnabled) {
			browser.contextualIdentities.query({})
			.then(function(containers) {
				containers.forEach(function(currentValue, index, array) {
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
	browser.storage.local.clear();
	onStartUp();
}

//The set of urls
var cookieWhiteList;
var cookieNotifyDone = "cookieNotifyDone";
var notifyMessage = "";

var contextualIdentitiesEnabled = true;
const defaultWhiteList = "defaultWhiteList";
var cookieDeletedCounterTotal;
var recentlyCleaned = 0;
var cookieDeletedCounter = 0;

//setDefaults();
onStartUp();


function showNumberOfCookiesInIcon(tabURL,tabID) {
	browser.cookies.getAll({
		domain: getHostname(tabURL)
	})
	.then(function(cookies) {
		browser.browserAction.setBadgeText({text: cookies.length.toString(), tabId: tabID});
		browser.browserAction.setBadgeBackgroundColor({color: "blue", tabId: tabID});
	});
	
} 

//Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.status === "complete") {
		browser.windows.getCurrent()
		.then(function(windowInfo) {
			if (!isAWebpage(tab.url) || windowInfo.incognito) {
				browser.browserAction.disable(tab.id);
				browser.browserAction.setBadgeText({text: "X", tabId: tab.id});
				browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: tab.id});
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
	}


});

//Alarm event handler
browser.alarms.onAlarm.addListener(function (alarmInfo) {
	console.log(alarmInfo.name);
	if(alarmInfo.name === "activeModeAlarm") {
		cleanCookiesOperation();
		browser.alarms.clear(alarmInfo.name);

	}
	if(alarmInfo.name === "storeCounterToLocalAlarm") {
		storeCounterToLocal();
	}

});

