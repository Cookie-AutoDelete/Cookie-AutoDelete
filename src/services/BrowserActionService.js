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

import {getHostname, returnMatchedExpressionObject} from "./libs";

// Show the # of cookies in icon
export const showNumberOfCookiesInIcon = async (tab) => {
	const cookies = await browser.cookies.getAll({
		domain: getHostname(tab.url),
		storeId: tab.cookieStoreId
	});

	if (cookies.length === 0) {
		browser.browserAction.setBadgeText({
			text: "",
			tabId: tab.id
		});
	} else {
		browser.browserAction.setBadgeText({
			text: cookies.length.toString(),
			tabId: tab.id
		});
	}
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
export const setIconRed = (tab) => {
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

// Check if the site is protected and adjust the icon appropriately
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
		setIconDefault(currentTab);
	} else if (matchedExpression !== undefined && matchedExpression.listType === "GREY") {
		setIconYellow(currentTab);
	} else {
		setIconRed(currentTab);
	}
};
