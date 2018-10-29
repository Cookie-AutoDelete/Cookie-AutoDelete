/**
 Copyright (c) 2017 Kenny Do

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 **/
/* global browserDetect */
import {updateSetting, validateSettings, cacheCookieStoreIdNames, addExpression, incrementCookieDeletedCounter, cookieCleanup} from "./redux/Actions";
import {getSetting, getHostname, isAWebpage, returnOptionalCookieAPIAttributes, extractMainDomain} from "./services/libs";
import {checkIfProtected, showNumberOfCookiesInIcon} from "./services/BrowserActionService";
import createStore from "./redux/Store";
import shortid from "shortid";

let store;
let currentSettings;

// Delay saving to disk to queue up actions
let delaySave = false;
const saveToStorage = () => {
	if (!delaySave) {
		delaySave = true;
		setTimeout(() => {
			delaySave = false;
			return browser.storage.local.set({
				state: JSON.stringify(store.getState())
			});
		}, 1000);
	}
};

/**
 * Called when settings are changed.
 *
 * Called when settings are changed to update the cached settings, call depending functions and if necessary change more settings.
 *
 * @author Kenny Do, Christian Zei
 */
const onSettingsChange = () => {
	let previousSettings = currentSettings;
	currentSettings = store.getState().settings;
	// Container Mode enabled
	if (!previousSettings.contextualIdentities.value && currentSettings.contextualIdentities.value) {
		store.dispatch(
			cacheCookieStoreIdNames()
		);
	}

	// Localstorage support enabled
	if (!previousSettings.localstorageCleanup.value && currentSettings.localstorageCleanup.value) {
		browser.browsingData.removeLocalStorage({
			since: 0
		});
	}

	if (previousSettings.activeMode.value && !currentSettings.activeMode.value) {
		browser.alarms.clear("activeModeAlarm");
	}

	// activate HSTS prevention if HSTS alarm is enabled
	if ((!previousSettings.hstsAlarm.value && currentSettings.hstsAlarm.value) ||
        (previousSettings.hstsAlarm.value && !currentSettings.hstsAlarm.value)) {
		store.dispatch(
			updateSetting({
				payload: {
					id: 12, name: "hstsPrevent", value: currentSettings.hstsAlarm.value
				}
			})
		);
	}
};

// Create an alarm delay or use setTimeout before cookie cleanup
let alarmFlag = false;
const createActiveModeAlarm = () => {
	let seconds;
	if ((getSetting(store.getState(), "ecClearOnTabClose")) &&
        (getSetting(store.getState(), "ecHTTPcookieDelete"))) {
		seconds = 0;
	} else {
		seconds = parseInt(getSetting(store.getState(), "delayBeforeClean"), 10);
	}
	const minutes = seconds / 60;
	const milliseconds = seconds * 1000;
	if (alarmFlag) {
		return;
	}
	alarmFlag = true;
	if (seconds < 1) {
		setTimeout(() => {
			store.dispatch(
				cookieCleanup({
					greyCleanup: false, ignoreOpenTabs: false
				})
			);
			alarmFlag = false;
		}, 500);
	} else if (browserDetect() === "Firefox" || (browserDetect() === "Chrome" && seconds >= 60)) {
		browser.alarms.create("activeModeAlarm", {
			delayInMinutes: minutes
		});
	} else {
		setTimeout(() => {
			// only if activeMode is enabled - or Evercookie automatic Mode and HTTP Cookies should be cleared
			if ((getSetting(store.getState(), "activeMode")) ||
                ((getSetting(store.getState(), "ecClearOnTabClose")) &&
                    (getSetting(store.getState(), "ecHTTPcookieDelete")))) {
				store.dispatch(
					cookieCleanup({
						greyCleanup: false, ignoreOpenTabs: false
					})
				);
			}
			alarmFlag = false;
		}, milliseconds);
	}
};

const cleanFromFromTabEvents = async () => {
	// only if activeMode is enabled - or Evercookie automatic Mode and HTTP Cookies should be cleared
	if ((getSetting(store.getState(), "activeMode")) ||
        ((getSetting(store.getState(), "ecClearOnTabClose")) &&
            (getSetting(store.getState(), "ecHTTPcookieDelete")))) {
		const alarm = await browser.alarms.get("activeModeAlarm");
		// This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
		// in chrome, it returns an array
		if (store.getState().cache.browserDetect === "Firefox" && !alarm) {
			createActiveModeAlarm();
		} else if (alarm.name !== "activeModeAlarm") {
			createActiveModeAlarm();
		}
	}
};

const getAllCookieActions = async (tab) => {
	const hostname = getHostname(tab.url);
	const cookies = await browser.cookies.getAll(
		returnOptionalCookieAPIAttributes(store.getState(), {
			domain: hostname,
			storeId: tab.cookieStoreId,
			firstPartyDomain: extractMainDomain(hostname)
		})
	);
	let cookieLength = cookies.length;
	if (cookies.length === 0 && getSetting(store.getState(), "localstorageCleanup") && isAWebpage(tab.url)) {
		browser.cookies.set(
			returnOptionalCookieAPIAttributes(store.getState(), {
				url: tab.url,
				name: "CookieAutoDelete",
				value: "cookieForLocalstorageCleanup",
				path: `/${shortid.generate()}`,
				storeId: tab.cookieStoreId,
				firstPartyDomain: extractMainDomain(getHostname(tab.url)),
				expirationDate: Math.floor(Date.now() / 1000 + 31557600)
			})
		);
		cookieLength = 1;
	}
	if (getSetting(store.getState(), "showNumOfCookiesInIcon")) {
		showNumberOfCookiesInIcon(tab, cookieLength);
	} else {
		browser.browserAction.setBadgeText({
			text: "", tabId: tab.id
		});
	}
};

// Add a delay to prevent multiple spawns of the localstorage cookie
let onTabUpdateDelay = false;
export const onTabUpdate = (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		checkIfProtected(store.getState(), tab);
		if (!onTabUpdateDelay) {
			onTabUpdateDelay = true;
			setTimeout(() => {
				getAllCookieActions(tab);
				onTabUpdateDelay = false;
			}, 750);
		}
	}
};

let tabToDomain = {};
let tabToURL = {};

// some parameters for the HSTS prevention and alarm
let targetPage = "<all_urls>";
let	hstsCount = 0;
let	cachedHSTS = [];
let	hstsCacheLength = 200;

// suffix for iFrame (see below)
// create a URL suffix to make it unique and make nearly impossible to hit the existing page
let suffix = `evercookies-will-be-killed-in-browser-${browser.runtime.id}`;

// the iframe which is added for clearing the sessionStorage
let iframes = [];

let alertedHSTSHosts = [];

/**
 * Adds an iFrame to the background page.
 *
 * Adds an iFrame to the background page, in which then a content script is inserted (see manifest.json), which clears the localStorage.
 *
 * @param {string} protocol - The protocol of the iFrame to insert.
 * @param {string} domain - The domain of the iFrame to insert.
 * @since 3.0.0
 * @author Christian Zei
 */
function injectScript(protocol, domain) {
	// finally the function which does the job: it adds an iFrame to the background page
	// the content-script will does the rest - it clears the iFrames localStorage
	if (((typeof domain !== "undefined") && (domain !== "newtab") && (domain !== "")) &&
		((typeof protocol !== "undefined") && (protocol !== "") && ((protocol.toLowerCase() === "http") || (protocol.toLowerCase() === "https")))) {
		let iframe = document.createElement("iframe");

		iframe.id = "localStorageDeletionFrame";

		iframe.src = `${protocol}://${domain}/${suffix}`;

		iframes.push(iframe);

		document.body.appendChild(iframe);
	}
}

/**
 * Method for clearing Evercookies after closing a browser tab and after changing a domain.
 *
 * All browsingData is cleared. HTTP cookies are cleared by classic method from Kenny (excluded from here).
 *
 * @param {string} url - The URL from which the Evercookies should be cleared.
 * @param {boolean} domainChange - Indicates if it is a domain change call or a tab close call.
 * @returns {Promise<void>} - An empty Promise if everything cleared correctly, else the Promise contains the respective errors.
 * @since 3.0.0
 * @author Christian Zei
 */
async function deleteEvercookiesOnDomainChange(url, domainChange) {
	if ((typeof url !== "undefined") && (url !== "newtab") && (url !== "")) {
		if ((url.split("://")[0].toLowerCase() === "http") ||
            (url.split("://")[0].toLowerCase() === "https")) {
			let protocol = url.split("://")[0];
			let	baseDomain = extractMainDomain(getHostname(url));
			let	domain = url.split("/")[2];

			// check if enabled
			if (getSetting(store.getState(), "ecLocalStorageClear")) {
				// clear sessionStorage by API (only possible for Firefox)
				if (browserDetect() === "Firefox") {
					browser.browsingData.remove({
						"hostnames": [baseDomain, domain],
						"since": 0
					}, {
						"localStorage": true
					});
				} else if (!domainChange) {
					// inject iFrame for clearing the localStorage and sessionStorage
					// if domain is changed, then localStorage is cleared by clearSessionStorageOnDomainChange()
					injectScript(protocol, domain);
				}
			}
		}
	}

	// if windowName must be cleared and is enabled (only needed if domain is changed)
	if (getSetting(store.getState(), "ecWindowNameClear") && domainChange) {
		if ((url.split("://")[0].toLowerCase() === "http") ||
            (url.split("://")[0].toLowerCase() === "https")) {
			browser.tabs.executeScript({
				code: "window.name=''",
				allFrames: true
			});
		}
	}

	// try WebSQL if possible (not supported in Firefox)
	if (browserDetect() !== "Firefox") {
		if (getSetting(store.getState(), "ecSQLiteClear")) {
			browser.browsingData.removeWebSQL({
				"since": 0
			});
		}
	}

	// clear the remaining browsingData
	browser.browsingData.remove({
		"since": 0
	}, {
		// "appcache": true,				//maybe only works with chrome, we'll see
		"cache": getSetting(store.getState(), "ecCacheClear"),			// unfortunately clears the whole browser cache, but essentially for preventing tracking
		"cookies": false,				// disabled because cleared in a separate method
		"downloads": false,				// not needed
		// "fileSystems": false,			//not needed and only compatible with Chrome --> commented out
		// "formData": false,			//not needed and only compatible with Chrome --> commented out
		"history": getSetting(store.getState(), "ecWebHistoryClear"),	// for clearing Web History storage tracking
		"indexedDB": getSetting(store.getState(), "ecIndexedDBclear"),	// yes we want it
		"localStorage": false,			// disabled because cleared in a separate method
		"pluginData": getSetting(store.getState(), "ecLSOdelete"),		// for deleting lso (flash) cookies
		"passwords": false				// not needed
	});
}

/**
 * Called when a tab is updated to delete Evercookies in AutoMode.
 *
 * When a tab is closed oder its domain is changed, this method is called to delete Evercookies in AutoMode.
 *
 * @param tabId - The ID of the tab, what has been updated.
 * @param oldDomain - The domain of the updated Tab, before it was updated.
 */
function clearEvercookiesInAutoMode(tabId, oldDomain) {
	// if domain changed and no other tab from that domain is open --> delete Evercookie (only in Auto-Mode)
	if (((getSetting(store.getState(), "ecClearOnTabClose")) && (getSetting(store.getState(), "ecClearOnDomainChange"))) &&
        (tabToURL[tabId] !== "")) {
		deleteEvercookiesOnDomainChange(tabToURL[tabId], true);
	}

	if (typeof oldDomain !== "undefined" && oldDomain !== "") {
		// also drop HSTS notification for oldDomain from cached notifications
		let idx = alertedHSTSHosts.indexOf(oldDomain);
		if (idx !== -1) {
			alertedHSTSHosts.splice(idx, 1);
		}

		// drop all cached HSTS values for oldDomain
		let toDelete = [];
		for (let hsts of cachedHSTS) {
			if (hsts.split("#")[0] === oldDomain) {
				toDelete.push(cachedHSTS.indexOf(hsts));
			}
		}
		for (let i of toDelete) {
			cachedHSTS.splice(i, 1);
		}
		hstsCount -= toDelete.length;
	}
}

/**
 * Called when domain is changed, so that deletion process can be started.
 *
 * Called when domain is changed, caches the corresponding URLs to the TabIds and calls further methods for cookie and Evercookie cleaning.
 *
 * @param {int} tabId - The TabId, whose domain is changed.
 * @param {object} changeInfo - Contains properties for the tab properties that have changed.
 * @param {tabs.tab} tab - The new state of the tab.
 * @author Kenny Do, Christian Zei
 */
export const onDomainChange = (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		const mainDomain = extractMainDomain(getHostname(tab.url));
		// save URL for tabID for deleting the browsingData after tabClose
		if ((typeof tabToDomain[tabId] === "undefined" || tabToDomain[tabId] === "newtab") && tab.url !== "") {
			tabToURL[tabId] = tab.url;
		}
		if ((typeof tabToDomain[tabId] === "undefined" || tabToDomain[tabId] === "newtab") && mainDomain !== "") {
			tabToDomain[tabId] = mainDomain;
		} else if (tabToDomain[tabId] !== mainDomain && mainDomain !== "") {
			let oldDomain = tabToDomain[tabId];
			tabToDomain[tabId] = mainDomain;

			// check if domain is still open in another tab
			let domainStillOpen = false;
			for (let key in tabToDomain) {
				if (Object.prototype.hasOwnProperty.call(tabToDomain, key)) {
					domainStillOpen = (tabToDomain === oldDomain);
				}

				if (domainStillOpen) {
					break;
				}
			}

			if (!domainStillOpen) {
				clearEvercookiesInAutoMode(tabId, oldDomain);
			}
			tabToURL[tabId] = tab.url;
			if ((getSetting(store.getState(), "domainChangeCleanup")) ||
                ((getSetting(store.getState(), "ecClearOnDomainChange")) &&
                    (getSetting(store.getState(), "ecClearOnTabClose")) &&
                    (getSetting(store.getState(), "ecHTTPcookieDelete")))) {
				cleanFromFromTabEvents();
			}
		}
	}
};

/**
 * Called after a tab is closed to manage further cleanups.
 *
 * Called after a tab is closed to update the cached domains to corresponding tabs and call further methods for evercookie cleanup.
 *
 * @param {int} tabId - ID of the tab that was removed.
 * @author Kenny Do, Christian Zei
 */
export const onDomainChangeRemove = (tabId) => {
	let oldDomain = tabToDomain[tabId];
	delete tabToDomain[tabId];

	// check if domain is still open in another tab
	let domainStillOpen = false;
	for (let key in tabToDomain) {
		if (Object.prototype.hasOwnProperty.call(tabToDomain, key)) {
			domainStillOpen = (tabToDomain[key] === oldDomain);
			if (domainStillOpen) {
				break;
			}
		}
	}

	if (!domainStillOpen) {
		// if tab closed and no other tab from that domain is open --> delete Evercookie
		if (getSetting(store.getState(), "ecClearOnTabClose")) {
			if (typeof oldDomain !== "undefined" && oldDomain !== "newtab" && oldDomain !== "") {
				deleteEvercookiesOnDomainChange(tabToURL[tabId], false);
			}
		}

		if (typeof oldDomain !== "undefined" && oldDomain !== "") {
			// also drop HSTS notification for oldDomain from cached notifications
			let idx = alertedHSTSHosts.indexOf(oldDomain);
			if (idx !== -1) {
				alertedHSTSHosts.splice(idx, 1);
			}

			// drop all cached HSTS values for oldDomain
			let toDelete = [];
			for (let hsts of cachedHSTS) {
				if (hsts.split("#")[0] === oldDomain) {
					toDelete.push(cachedHSTS.indexOf(hsts));
				}
			}
			for (let i of toDelete) {
				cachedHSTS.splice(i, 1);
			}
			hstsCount -= toDelete.length;
		}

		/*      //drop all cached request values for oldDomain
        toDelete = [];
        for (let request of requestsSent) {
            if (request.split("#")[0] === oldDomain) {
                toDelete.push(requestsSent.indexOf(request));
            }
        }
        for(var i of toDelete) {
            requestsSent.splice(i, 1);
        }
        requestCount -= toDelete.length;
        */
	}
	delete tabToURL[tabId];
};

const migration = (oldSettings) => {
	if (Object.keys(oldSettings) !== 0 && oldSettings.migration_1 === undefined && oldSettings.activeMode !== undefined) {
		store.dispatch(
			incrementCookieDeletedCounter(oldSettings.cookieDeletedCounterTotal)
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 1, name: "activeMode", value: oldSettings.activeMode
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 2, name: "delayBeforeClean", value: oldSettings.delayBeforeClean
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 3, name: "statLogging", value: oldSettings.statLoggingSetting
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 4, name: "showNumOfCookiesInIcon", value: oldSettings.showNumberOfCookiesInIconSetting
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 5, name: "showNotificationAfterCleanup", value: oldSettings.notifyCookieCleanUpSetting
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 6, name: "cleanCookiesFromOpenTabsOnStartup", value: oldSettings.cookieCleanUpOnStartSetting
				}
			})
		);
		store.dispatch(
			updateSetting({
				payload: {
					id: 7, name: "contextualIdentities", value: oldSettings.contextualIdentitiesEnabledSetting
				}
			})
		);
		if (oldSettings.contextualIdentitiesEnabledSetting) {
			store.dispatch(
				cacheCookieStoreIdNames()
			);
			const newContainerCache = [
				...oldSettings.containerCache,
				{
					cookieStoreId: "firefox-default"
				}
			];
			newContainerCache.forEach((container) => {
				const {
					cookieStoreId
				} = container;
				const greyPrefixed = `${cookieStoreId}-Grey`;
				if (oldSettings[cookieStoreId] !== undefined) {
					oldSettings[cookieStoreId].forEach((domain) => {
						const expression = oldSettings.enableGlobalSubdomainSetting ? `*.${domain}` : domain;
						store.dispatch(
							addExpression({
								payload: {
									expression,
									listType: "WHITE",
									storeId: cookieStoreId
								}
							})
						);
					});
				}
				if (oldSettings[greyPrefixed] !== undefined) {
					oldSettings[greyPrefixed].forEach((domain) => {
						const expression = oldSettings.enableGlobalSubdomainSetting ? `*.${domain}` : domain;
						store.dispatch(
							addExpression({
								payload: {
									expression,
									listType: "GREY",
									storeId: cookieStoreId
								}
							})
						);
					});
				}
			});
		} else {
			const cookieStoreId = "defaultWhiteList";
			const greyPrefixed = `${cookieStoreId}-Grey`;
			if (oldSettings[cookieStoreId] !== undefined) {
				oldSettings[cookieStoreId].forEach((domain) => {
					const expression = oldSettings.enableGlobalSubdomainSetting ? `*.${domain}` : domain;
					store.dispatch(
						addExpression({
							payload: {
								expression,
								listType: "WHITE",
								storeId: cookieStoreId
							}
						})
					);
				});
			}
			if (oldSettings[greyPrefixed] !== undefined) {
				oldSettings[greyPrefixed].forEach((domain) => {
					const expression = oldSettings.enableGlobalSubdomainSetting ? `*.${domain}` : domain;
					store.dispatch(
						addExpression({
							payload: {
								expression,
								listType: "GREY",
								storeId: cookieStoreId
							}
						})
					);
				});
			}
		}
		saveToStorage();
		browser.storage.local.set({
			migration_1: true
		});
	}
};

/**
 * Clears all data on startup.
 *
 * Clears all browsingData on startup of the extension (and therefore especially when the browser starts).
 *
 * @since 3.0.0
 * @author Christian Zei
 */
function clearAtBrowserStartup() {
	// try WebSQL if possible (not supported in Firefox)
	if (browserDetect() !== "Firefox") {
		if (getSetting(store.getState(), "ecSQLiteClear")) {
			browser.browsingData.removeWebSQL({
				"since": 0
			});
		}
	}

	browser.browsingData.remove({
		"since": 0
	}, {
		// "appcache": true,				//maybe only works with chrome, we'll see
		"cache": getSetting(store.getState(), "ecCacheClear"),			// unfortunately clears the whole browser cache, but essentially for preventing tracking
		"cookies": false,				// disabled because cleared in a separate method
		"downloads": false,				// not needed
		// "fileSystems": false,			//not needed and only compatible with Chrome --> commented out
		// "formData": false,			//not needed and only compatible with Chrome --> commented out
		"history": getSetting(store.getState(), "ecWebHistoryClear"),	// for clearing Web History storage tracking
		"indexedDB": getSetting(store.getState(), "ecIndexedDBclear"),	// yes we want it
		"localStorage": getSetting(store.getState(), "ecLocalStorageClear"),			// disabled because cleared in a separate method
		"pluginData": getSetting(store.getState(), "ecLSOdelete"),		// for deleting lso (flash) cookies
		"passwords": false				// not needed
	});
}

let activeTabId = browser.tabs.query({
	currentWindow: true, active: true
})[0];

/**
 * Called to update the activeTab.
 *
 * Saves the active tabId to compare it in the clearSessionStorageOnDomainChange function. Called by browser.tabs.onActivated event.
 *
 * @param {object} activeInfo - the info about the newly activated tab.
 * @since 3.0.0
 * @author Christian Zei
 */
function changeActiveTab(activeInfo) {
	activeTabId = activeInfo.tabId;
}

/**
 * Called on startup of the extension.
 *
 * Called on startup to initialize the needed vars and attributes and perform cookie and evercookie cleanup on browser startup.
 *
 * @returns {Promise<void>} - A empty Promise after a correct startup and with errors inside, if the startup failed.
 * @author Kenny Do, Christian Zei (just the small Evercookie part at the end)
 */
const onStartUp = async () => {
	const storage = await browser.storage.local.get();
	let stateFromStorage;
	try {
		if (storage.state !== undefined) {
			stateFromStorage = JSON.parse(storage.state);
		} else {
			stateFromStorage = {};
		}
	} catch (err) {
		stateFromStorage = {};
	}
	store = createStore(stateFromStorage);
	migration(storage);
	store.dispatch(
		validateSettings()
	);
	store.dispatch({
		type: "ON_STARTUP"
	});
	// Store the FF version in cache
	if (browserDetect() === "Firefox") {
		const browserInfo = await browser.runtime.getBrowserInfo();
		const browserVersion = browserInfo.version.split(".")[0];
		store.dispatch({
			type: "ADD_CACHE",
			map: {
				key: "browserVersion", value: browserVersion
			}
		});

		// Store whether firstPartyIsolate is true or false
		if (browserVersion >= 58) {
			const setting = await browser.privacy.websites.firstPartyIsolate.get({});
			store.dispatch({
				type: "ADD_CACHE",
				map: {
					key: "firstPartyIsolateSetting", value: setting.value
				}
			});
			if (browserVersion === "58" && setting.value) {
				browser.notifications.create("FPI_NOTIFICATION", {
					"type": "basic",
					"iconUrl": browser.extension.getURL("icons/icon_48.png"),
					"title": "First Party Isolation Detected",
					"message": "Please turn off privacy.firstparty.isolate and restart the browser as it breaks cookie cleanup"
				});
			}
		}
	}
	// Store which browser environment in cache
	store.dispatch({
		type: "ADD_CACHE",
		map: {
			key: "browserDetect", value: browserDetect()
		}
	});

	// Temporary fix until contextualIdentities events land
	if (getSetting(store.getState(), "contextualIdentities")) {
		store.dispatch(
			cacheCookieStoreIdNames()
		);
	}
	if (getSetting(store.getState(), "activeMode")) {
		store.dispatch(
			cookieCleanup({
				greyCleanup: true, ignoreOpenTabs: getSetting(store.getState(), "cleanCookiesFromOpenTabsOnStartup")
			})
		);
	} else if ((getSetting(store.getState(), "ecClearOnTabClose")) && (getSetting(store.getState(), "ecClearOnStartup")) && (getSetting(store.getState(), "ecHTTPcookieDelete"))) {
		// if active mode is disabled (if active mode is enabled they are cleared anyway)
		// and evercookies should be cleared on startup, delete them (only in Auto-Mode)
		store.dispatch(
			cookieCleanup({
				greyCleanup: true, ignoreOpenTabs: true
			})
		);
	}

	// clear Evercookies on startup if enabled (only in Auto-Mode)
	if ((getSetting(store.getState(), "ecClearOnTabClose")) && (getSetting(store.getState(), "ecClearOnStartup"))) {
		clearAtBrowserStartup();
	}

	currentSettings = store.getState().settings;
	store.subscribe(onSettingsChange);
	store.subscribe(saveToStorage);
};

/**
 * Clears the webStorage when the domain is changed.
 *
 * Clears the sessionStorage before a domain is changed and the localStorage when a domain is changed, but not when it's a Firefox browser. Called by browser.webNavigation.onBeforeNavigate event.
 *
 * @param {object} details - the details about the ongoing webNavigation.
 * @since 3.0.0
 * @author Christian Zei
 */
function clearSessionStorageOnDomainChange(details) {
	// check if tab is activated and it's not a frame
	if (details.tabId === activeTabId && details.frameId === 0) {
		const mainDomain = extractMainDomain(getHostname(details.url));
		const oldDomain = tabToDomain[activeTabId];
		const oldURL = tabToURL[activeTabId];
		if ((mainDomain !== oldDomain) && (typeof oldDomain !== "undefined") && (oldDomain !== "newtab") && (oldDomain !== "")) {
			// sessionStorage clear only needed if domain is changed

			if ((getSetting(store.getState(), "ecLocalStorageClear")) &&
				((oldURL.split("://")[0].toLowerCase() === "http") ||
                (oldURL.split("://")[0].toLowerCase() === "https"))) {
				if (browserDetect() === "Firefox") {
					// if it is a Firefox browser, only sessionStorage needs to be cleared (localStorage is cleared by browsingData API)
					browser.tabs.executeScript({
						code: "sessionStorage.clear();",
						allFrames: true
					});
				} else {
					// else we also clear the localStorage
					browser.tabs.executeScript({
						code: "sessionStorage.clear();localStorage.clear();",
						allFrames: true
					});
				}
			}
		}
	}
}

// Alarm event handler for Active Mode
browser.alarms.onAlarm.addListener((alarmInfo) => {
	// console.log(alarmInfo.name);
	if ((alarmInfo.name === "activeModeAlarm") ||
        ((getSetting(store.getState(), "ecClearOnTabClose")) &&
            (getSetting(store.getState(), "ecHTTPcookieDelete")))) {
		store.dispatch(
			cookieCleanup({
				greyCleanup: false, ignoreOpenTabs: false
			})
		);
		alarmFlag = false;
		browser.alarms.clear(alarmInfo.name);
	}
});

/**
 * Called to send a HSTS tracking browser notification.
 *
 * Sends a browser notification to the user when HSTS tracking is found.
 *
 * @param {string} host - The host, for which the HSTS tracking should be notified.
 * @returns {Promise<void>} - An empty Promise when everything worked fine and else with the errors inside.
 * @since 3.0.0
 * @author Christian Zei
 */
async function alertHSTS(host) {
	let messagePrevented = browser.i18n.getMessage("hstsPreventNotificationText");
	let messageNotPrevented = browser.i18n.getMessage("hstsNotPreventNotificationText");
	let messageAppendix = getSetting(store.getState(), "hstsPrevent") ? messagePrevented : messageNotPrevented;

	const notifyMessage = `${browser.i18n.getMessage("hstsTrackingFoundText") + host}. ${messageAppendix}`;
	browser.notifications.create("HSTS_TRACKING_NOTIFICATION", {
		"type": "basic",
		"iconUrl": browser.extension.getURL("icons/icon_48.png"),
		"title": browser.i18n.getMessage("hstsTrackingNotificationTitleText"),
		"message": notifyMessage
	});
	const seconds = parseInt(`${getSetting(store.getState(), "notificationOnScreen")}000`, 10);
	setTimeout(() => {
		browser.notifications.clear("HSTS_TRACKING_NOTIFICATION");
	}, seconds);
}

/**
 * Counts the cached HSTS header for the specified host.
 *
 * Counts the activated and deactivated cached HSTS header for the specified host.
 *
 * @param {string} host - The host for which the HSTS header should be counted,
 * @returns {{a: number, d: number}} - The number of activated and deactivated HSTS headers for that host.
 */
function countHSTSHeader(host) {
	let a = 0;
	let	d = 0;

	if (getSetting(store.getState(), "hstsAlarm")) {
		// iterate over all cached HSTS header and count the activated and deactivated ones
		for (let hsts of cachedHSTS) {
			let headerHost = hsts.split("#")[0];
			let	headerHSTS = hsts.split("#")[1]; // hsts.split() returns e.g. ["google.de", "3600"]
			if (host === headerHost) {
				if (headerHSTS === 0) {
					d++;
				} else {
					a++;
				}
			}
		}
	} else if (getSetting(store.getState(), "hstsPrevent")) {
		// else only check if HSTS is set anywhere for this host
		for (let hsts of cachedHSTS) {
			let headerHost = hsts.split("#")[0];
			let	headerHSTS = hsts.split("#")[1]; // hsts.split() returns e.g. ["google.de", "3600"]

			if ((host === headerHost) &&
                (headerHSTS !== 0)) {
				a++;
				break;
			}
		}
	}

	return {
		a,
		d
	};
}

/**
 * Inspects the receiving HTTP responses for HSTS tracking.
 *
 * Cache the last hstsCacheLength (default: 200) HSTS header values and compare them to prevent HSTS tracking and notify the user if wanted.
 *
 * @param {object} e - Details of the request.
 * @returns {{responseHeaders: *}} - The new (modified) responseHeaders.
 * @since 3.0.0
 * @author Christian Zei
 */
function inspectHstsHeader(e) {
	if ((typeof store !== "undefined") &&
		((getSetting(store.getState(), "hstsAlarm")) ||
        (getSetting(store.getState(), "hstsPrevent")))) {
		for (let header of e.responseHeaders) {
			if (header.name.toLowerCase() === "strict-transport-security") {
				let host = extractMainDomain(getHostname(e.url)); // returns e.g. "google.de"
				let	hstsValue = ((typeof header.value !== "undefined") ? header.value : header.binaryValue).split("=")[1]; // .split() returns e.g. ["max-age", "3600"]
				cachedHSTS[hstsCount] = `${host}#${hstsValue}`; // e.g. cachedHSTS[0]="www.google.de#3600"
				hstsCount = ++hstsCount % hstsCacheLength;

				let countedHSTSHeader = countHSTSHeader(host);
				let a = countedHSTSHeader.a;
				let d = countedHSTSHeader.d;

				// if notification is wanted --> send one
				if ((getSetting(store.getState(), "hstsAlarm")) &&
					(!alertedHSTSHosts.includes(host)) &&
					(a > 0 && d > 0)) {
					alertHSTS(host);

					alertedHSTSHosts.push(host);
				}
				// if prevention of HSTS tracking is enabled, try to activate HSTS for all hosts
				// where it is activated before
				if ((getSetting(store.getState(), "hstsPrevent")) &&
					(hstsValue === 0 && a > 0)) {
					// set HSTS value to 5 minutes
					header.value = "max-age=3600";
				}
			}
		}
	}

	// return modified headers
	return {
		responseHeaders: e.responseHeaders
	};
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders" so it can be modified.
browser.webRequest.onHeadersReceived.addListener(
	inspectHstsHeader,
	{
		urls: [targetPage]
	},
	["responseHeaders", "blocking"]
);

/**
 * Redirects HTTP requests to HTTPS to prevent HSTS tracking.
 *
 * With this method HTTP requests are redirected to HTTPS if HSTS tracking prevention is enabled and HSTS is enabled in any subdomain of the given host.
 *
 * @param {object} e - Details of the request.
 * @returns {{redirectUrl: string}} - The URL where the request should be redirected to.
 * @since 3.0.0
 * @author Christian Zei
 */
function redirectHSTSRequest(e) {
	let host = extractMainDomain(getHostname(e.url));

	// only relevant if request goes over HTTP (and not HTTPS)
	if ((e.url.split("://")[0].toLowerCase() === "http") && (host !== "")) {
		if (getSetting(store.getState(), "hstsPrevent")) {
			let a = 0;

			// check if HSTS is set anywhere for this host
			for (let hsts of cachedHSTS) {
				let headerHost = hsts.split("#")[0];
				let	headerHSTS = hsts.split("#")[1]; // hsts.split() returns e.g. ["google.de", "3600"]

				if ((host === headerHost) &&
					(headerHSTS !== 0)) {
					a++;
					break;
				}
			}

			// if HSTS is activated anywhere, redirect the request to HTTPS
			if (a > 0) {
				let newURL = `https://${e.url.split("://")[1]}`;
				return {
					redirectUrl: newURL
				};
			}
		}
	}
	return {};
}

// add a listener to redirect all HSTS = 0 requests to prevent HSTS tracking
browser.webRequest.onBeforeRequest.addListener(
	redirectHSTSRequest,
	{
		urls: [targetPage]
	},
	["blocking"]
);

// var requestsSent = [], requestCacheLength = 200, requestCount = 0;

/**
 * Modifies the HTTP headers of sending HTTP requests.
 *
 * Adds a DNT header if wanted.
 *
 * @param {object} e - Details of the request.
 * @returns {{requestHeaders: *}} - The modified requestHeaders.
 * @since 3.0.0
 * @author Christian Zei
 */
function inspectHeaderSend(e) {
	if ((typeof store !== "undefined") &&
		(getSetting(store.getState(), "dntHeaderSend"))) {
		// if user wants DNT to be sent
		// check if DNT header is already inside of the request
		let dntInHeader = false;
		for (let header of e.requestHeaders) {
			if (header.name.toUpperCase() === "DNT") {
				if (header.value !== "1") {
					header.value = "1";
				}

				dntInHeader = true;
			}
		}

		// if not, add it
		if (!dntInHeader) {
			let dntHeader = {
				name: "DNT",
				value: "1"
			};

			e.requestHeaders.push(dntHeader);
		}
	}

	// send request with DNT header
	return {
		requestHeaders: e.requestHeaders
	};
}

// Add inspectHeaderSend to the listener so that it is called before a header is sent
// Make it "blocking" so we can modify the headers.
browser.webRequest.onBeforeSendHeaders.addListener(
	inspectHeaderSend,
	{
		urls: [targetPage]
	},
	["requestHeaders", "blocking"]
);

// when a browser redirects on HTTP status code 404, our workaround fails and we need to remove the iframe to prevent errors
browser.webRequest.onBeforeRedirect.addListener((details) => {
	// remove iframe from body to prevent error because of uncaught error thrown by x-frame-options
	if (iframes.length !== 0) {
		let iframeToDelete;
		let	removeFrame = false;

		// first check if iframe is added into document.body
		for (let child of document.body.children) {
			for (let iframe of iframes) {
				if (child.id === iframe.id) {
					removeFrame = true;
					iframeToDelete = iframe;
					break;
				}
			}

			if (removeFrame) {
				break;
			}
		}

		// remove it to prevent possible errors
		if (removeFrame) {
			document.body.removeChild(iframeToDelete);
			iframes.splice(iframes.indexOf(iframeToDelete), 1);
		}
	}
},
{
	urls: [`*://*/${suffix}`]
}
);

// if the domain is blocking displaying pages in iFrame (X-Frame-Options), remove the restriction
browser.webRequest.onHeadersReceived.addListener((details) => {
	for (let i = 0; i < details.responseHeaders.length; i++) {
		if (details.responseHeaders[i].name.toUpperCase() === "X-FRAME-OPTIONS") {
			details.responseHeaders.splice(i, 1);
		}
	}
	return {
		responseHeaders: details.responseHeaders
	};
}, {
	urls: [`*://*/${suffix}`]
}, ["blocking", "responseHeaders"]);

onStartUp();

// Logic that controls when to disable the browser action

browser.tabs.onUpdated.addListener(onTabUpdate);
browser.tabs.onUpdated.addListener(onDomainChange);
browser.tabs.onRemoved.addListener(onDomainChangeRemove);
browser.tabs.onRemoved.addListener(cleanFromFromTabEvents);

// log the active tab when it's changed
browser.tabs.onActivated.addListener(changeActiveTab);

// clear the sessionStorage when the domain is changed
browser.webNavigation.onBeforeNavigate.addListener(clearSessionStorageOnDomainChange);
