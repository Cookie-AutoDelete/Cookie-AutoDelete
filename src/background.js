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
import {getSetting} from "./services/libs";
import {checkIfProtected, setIconRed, showNumberOfCookiesInIcon} from "./services/BrowserActionService";
import createStore from "./redux/Store";

let store;
let currentSettings;

const saveToStorage = () => browser.storage.local.set({
	state: JSON.stringify(store.getState())
});

const onSettingsChange = () => {
	let previousSettings = currentSettings;
	currentSettings = store.getState().settings;
	if (!previousSettings.contextualIdentities.value && currentSettings.contextualIdentities.value) {
		store.dispatch(
			cacheCookieStoreIdNames()
		);
	}

	if (previousSettings.activeMode.value && !currentSettings.activeMode.value) {
		browser.alarms.clear("activeModeAlarm");
	}
};

// Create an alarm delay before cookie cleanup
const createActiveModeAlarm = () => {
	// console.log("create alarm");
	const minutes = parseFloat(getSetting(store.getState(), "delayBeforeClean"));
	if (minutes === 0) {
		store.dispatch(
			cookieCleanup({
				greyCleanup: false, ignoreOpenTabs: false
			})
		);
	} else {
		browser.alarms.create("activeModeAlarm", {
			delayInMinutes: minutes
		});
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

export const onTabUpdate = (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		checkIfProtected(store.getState(), tab);

		if (getSetting(store.getState(), "showNumOfCookiesInIcon")) {
			showNumberOfCookiesInIcon(tab);
		} else {
			browser.browserAction.setBadgeText({
				text: "", tabId: tab.id
			});
		}
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
	store.dispatch(
		cookieCleanup({
			greyCleanup: true, ignoreOpenTabs: getSetting(store.getState(), "cleanCookiesFromOpenTabsOnStartup")
		})
	);
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
		browser.alarms.clear(alarmInfo.name);
	}
});
