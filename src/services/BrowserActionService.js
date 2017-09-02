import {getHostname, returnMatchedExpressionObject} from "./libs";

// Show the # of cookies in icon
export const showNumberOfCookiesInIcon = async (tab) => {
	const cookies = await browser.cookies.getAll({
		domain: getHostname(tab.url),
		storeId: tab.cookieStoreId
	});
	browser.browserAction.setBadgeText({
		text: cookies.length.toString(),
		tabId: tab.id
	});
};

// Set background icon to yellow
const setIconYellow = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id,
		path: {
			48: "icons/icon_yellow_48.png"
		}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "#e6a32e", tabId: tab.id
	});
};

// Set background icon to red
const setIconRed = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id,
		path: {
			48: "icons/icon_red_48.png"
		}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "red", tabId: tab.id
	});
};

// Set background icon to blue
const setIconDefault = (tab) => {
	browser.browserAction.setIcon({
		tabId: tab.id,
		path: {
			48: "icons/icon_48.png"
		}
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "blue", tabId: tab.id
	});
};

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
	const matchedExpression = returnMatchedExpressionObject(state, currentTab.cookieStoreId, hostname);
	if (matchedExpression !== undefined && matchedExpression.listType === "WHITE") {
		setIconDefault(tab);
	} else if (matchedExpression !== undefined && matchedExpression.listType === "GREY") {
		setIconYellow(tab);
	} else {
		setIconRed(tab);
	}
};
