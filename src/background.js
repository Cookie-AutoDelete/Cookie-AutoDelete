import {updateSetting, validateSettings, cacheCookieStoreIdNames} from "./redux/Actions";
import {getHostname, isAWebpage, spliceWWW, getSetting} from "./services/libs";
import {checkIfProtected} from "./services/BrowserActionService";
import {cookieCleanup} from "./redux/Actions";
import createStore from "./redux/Store";

let store;
let currentSettings;

const saveToStorage = () => browser.storage.local.set({state: JSON.stringify(store.getState())});

const onSettingsChange = () => {
	let previousSettings = currentSettings;
	currentSettings = store.getState().settings;
	if (!previousSettings["contextualIdentities"].value && currentSettings["contextualIdentities"].value) {
		store.dispatch(
			cacheCookieStoreIdNames()
		);
	}
	if (!previousSettings["activeMode"].value && currentSettings["activeMode"].value) {
		browser.tabs.onRemoved.addListener(onTabRemoved);
	}

	if (previousSettings["activeMode"].value && !currentSettings["activeMode"].value) {
		browser.tabs.onRemoved.removeListener(onTabRemoved);
		browser.alarms.clear("activeModeAlarm");
	}

};


// Create an alarm delay before cookie cleanup
const createActiveModeAlarm = () => {
	console.log("create alarm");
	const minutes = parseFloat(getSetting(store.getState(), "delayBeforeClean"));
	browser.alarms.create("activeModeAlarm", {delayInMinutes: minutes});
};

// Create an alarm when a tab is closed
const onTabRemoved = async (tabId, removeInfo) => {
	const alarm = await browser.alarms.get("activeModeAlarm");
	// This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
	// in chrome, it returns an array
	if (browserDetect() === "Firefox" && !alarm) {
		createActiveModeAlarm();
	} else if (alarm.name !== "activeModeAlarm") {
		createActiveModeAlarm();
	}
};

export const onTabUpdate = async (tabId, changeInfo, tab) => {
	if (tab.status === "complete") {
		checkIfProtected(store.getState(), tab);

		const windowInfo = await browser.windows.getCurrent();

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
		}
		// Not incognito mode
		browser.browserAction.enable(tab.id);
		browser.browserAction.setBadgeText({
			text: "", tabId: tab.id
		});

		if (getSetting(store.getState(), "showNumOfCookiesInIcon")) {
			showNumberOfCookiesInIcon(tab);
		}

	}
};

// Show the # of cookies in icon
const showNumberOfCookiesInIcon = async (tab) => {
	const cookies = await browser.cookies.getAll({
		domain: getHostname(tab.url),
		storeId: tab.cookieStoreId
	})
	browser.browserAction.setBadgeText({
		text: cookies.length.toString(),
		tabId: tab.id
	});

};

const migration = (oldSettings) => {
	if (Object.keys(oldSettings) !== 0 && oldSettings.migration_1 === undefined && oldSettings.keepHistorySetting !== undefined) {
		store.dispatch(
			updateSetting({payload: {
				id: 1, name: "keepHistory", value: oldSettings.keepHistorySetting
			}})
		);
		store.dispatch(
			updateSetting({payload: {
				id: 2, name: "daysToKeep", value: oldSettings.daysToKeep
			}})
		);
		store.dispatch(
			updateSetting({payload: {
				id: 3, name: "statLogging", value: oldSettings.statLoggingSetting
			}})
		);
		store.dispatch(
			updateSetting({payload: {
				id: 4, name: "showVisitsInIcon", value: oldSettings.showVisitsInIconSetting
			}})
		);
		oldSettings.URLS.forEach((domain) => store.dispatch(addExpression({payload: {expression: `${domain}*`}})));
		browser.storage.local.set({migration_1: true});
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
	// migration(storage);
	// store.dispatch(
	// 	validateSettings()
	// );
	store.dispatch({
		type: "ON_STARTUP"
	});

	store.dispatch({
		type: "ADD_EXPRESSION",
		payload: {expression: "*mozilla.org", listType: "WHITE"}
	});
	store.dispatch({
		type: "ADD_CACHE",
		map: {key: "browserDetect", value: browserDetect()}
	});
	console.log(store.getState());
	store.dispatch(
		cookieCleanup({greyCleanup: true, ignoreOpenTabs: getSetting(store.getState(), "cleanCookiesFromOpenTabsOnStartup")})
	);
	currentSettings = store.getState().settings;
	store.subscribe(onSettingsChange);
	//store.subscribe(saveToStorage);

};

onStartUp();

// Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener(onTabUpdate);


// Alarm event handler for Active Mode
browser.alarms.onAlarm.addListener((alarmInfo) => {
	// console.log(alarmInfo.name);
	if (alarmInfo.name === "activeModeAlarm") {
		store.dispatch(
			cookieCleanup({greyCleanup: false, ignoreOpenTabs: false})
		);
		browser.alarms.clear(alarmInfo.name);
	}
});
