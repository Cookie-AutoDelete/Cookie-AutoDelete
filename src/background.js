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
};

// Create an alarm delay or use setTimeout before cookie cleanup
let alarmFlag = false;
const createActiveModeAlarm = () => {
	const seconds = parseInt(getSetting(store.getState(), "delayBeforeClean"), 10);
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
			if (getSetting(store.getState(), "activeMode")) {
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
	if (getSetting(store.getState(), "activeMode")) {
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
	const cookies = await browser.cookies.getAll(
		returnOptionalCookieAPIAttributes(store.getState(), {
			domain: getHostname(tab.url),
			storeId: tab.cookieStoreId,
			firstPartyDomain: getHostname(tab.url)
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
export const onDomainChange = (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		const mainDomain = extractMainDomain(getHostname(tab.url));
		if (tabToDomain[tabId] === undefined && mainDomain !== "") {
			tabToDomain[tabId] = mainDomain;
		} else if (tabToDomain[tabId] !== mainDomain && mainDomain !== "") {
			tabToDomain[tabId] = mainDomain;
			if (getSetting(store.getState(), "domainChangeCleanup")) {
				cleanFromFromTabEvents();
			}
		}
	}
};

export const onDomainChangeRemove = (tabId) => {
	delete tabToDomain[tabId];
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
	}
	currentSettings = store.getState().settings;
	store.subscribe(onSettingsChange);
	store.subscribe(saveToStorage);
};

onStartUp();

// Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener(onTabUpdate);
browser.tabs.onUpdated.addListener(onDomainChange);
browser.tabs.onRemoved.addListener(onDomainChangeRemove);
browser.tabs.onRemoved.addListener(cleanFromFromTabEvents);

// Alarm event handler for Active Mode
browser.alarms.onAlarm.addListener((alarmInfo) => {
	// console.log(alarmInfo.name);
	if (alarmInfo.name === "activeModeAlarm") {
		store.dispatch(
			cookieCleanup({
				greyCleanup: false, ignoreOpenTabs: false
			})
		);
		alarmFlag = false;
		browser.alarms.clear(alarmInfo.name);
	}
});
