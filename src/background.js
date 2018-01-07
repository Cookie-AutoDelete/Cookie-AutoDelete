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
import {getSetting, getHostname, isAWebpage, returnOptionalCookieAPIAttributes} from "./services/libs";
import {checkIfProtected, showNumberOfCookiesInIcon} from "./services/BrowserActionService";
import createStore from "./redux/Store";

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
		}, 100);
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

// Create an alarm when a tab is closed
const onTabRemoved = async (tabId, removeInfo) => {
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
				path: "/cookie-for-localstorage-cleanup",
				firstPartyDomain: getHostname(tab.url)
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

export const onTabUpdate = (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		checkIfProtected(store.getState(), tab);
		getAllCookieActions(tab);
	}
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
browser.tabs.onRemoved.addListener(onTabRemoved);

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
