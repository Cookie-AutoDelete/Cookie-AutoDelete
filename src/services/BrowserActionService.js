import {getHostname, getSetting} from "./libs";

export const checkIfProtected = async (state, tab = "UNDEFINED") => {
	let currentTab;
	if (tab === "UNDEFINED") {
		const tabAwait = await browser.tabs.query({
			currentWindow: true, active: true
		});
		currentTab = tabAwait[0];
	} else {
		currentTab = tab;
	}
	const hostname = getHostname(currentTab.url);
	const storeId = !getSetting(state, "contextualIdentities") || currentTab.cookieStoreId === "firefox-default" ? "default" : currentTab.cookieStoreId;
	const index = state.lists[storeId].find((expression) => {
		const regExpObj = new RegExp(expression.regExp);
		return regExpObj.test(hostname);
	});
	if (index !== undefined && index.listType === "WHITE") {
		setIconDefault(tab);
	} else if (index !== undefined && index.listType === "GREY") {
		setIconYellow(tab);
	} else {
		setIconRed(tab);
	}
};

// Set background icon to yellow
const setIconYellow = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_yellow_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "#e6a32e", tabId: tab.id
	});
};

// Set background icon to red
const setIconRed = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_red_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "red", tabId: tab.id
	});
};

// Set background icon to blue
const setIconDefault = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id, path: {48: "icons/icon_48.png"}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "blue", tabId: tab.id
	});
};
