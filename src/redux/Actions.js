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
import C from "./Constants";
import initialState from "./initialState.json";
import {getSetting, getStoreId} from "../services/libs";
import {cleanCookiesOperation} from "../services/CleanupService";
import {checkIfProtected} from "../services/BrowserActionService";

const COOKIE_CLEANUP_NOTIFICATION = "COOKIE_CLEANUP_NOTIFICATION";

export const addExpression = (object) => (dispatch, getState) => {
	const {
		payload
	} = object;
	const storeId = getStoreId(getState(), payload.storeId);
	// Sanitize the payload's storeId
	const newPayload = {
		...payload,
		storeId
	};
	dispatch({
		type: C.ADD_EXPRESSION,
		payload: newPayload,
		storeId
	});
	checkIfProtected(getState());
};

export const removeExpression = (object) => (dispatch, getState) => {
	const {
		payload
	} = object;
	const storeId = getStoreId(getState(), payload.storeId);
	dispatch({
		type: C.REMOVE_EXPRESSION,
		payload,
		storeId
	});
	checkIfProtected(getState());
};

export const updateExpression = (object) => (dispatch, getState) => {
	const {
		payload
	} = object;
	const storeId = getStoreId(getState(), payload.storeId);
	dispatch({
		type: C.UPDATE_EXPRESSION,
		payload,
		storeId
	});
	checkIfProtected(getState());
};

export const addActivity = (payload) => ({
	type: C.ADD_ACTIVITY_LOG, payload
});

export const incrementCookieDeletedCounter = (payload) => ({
	type: C.INCREMENT_COOKIE_DELETED_COUNTER, payload
});

export const resetCookieDeletedCounter = () => ({
	type: C.RESET_COOKIE_DELETED_COUNTER
});

export const updateSetting = (payloadSetting) => {
	const {
		payload
	} = payloadSetting;
    return {
		type: C.UPDATE_SETTING,
		payload
	};
};

export const resetSettings = () => ({
	type: C.RESET_SETTINGS
});

// Validates the setting object and adds missing settings if it doesn't already exist in the initialState.json
export const validateSettings = () => (dispatch, getState) => {
	const {
		settings
	} = getState();
	const initialSettings = initialState.settings;
	const settingKeys = Object.keys(settings);
	const initialSettingKeys = Object.keys(initialSettings);

	const invividalSettingKeysMatch = Object.keys(settings[settingKeys[0]]).length === Object.keys(initialSettings[initialSettingKeys[0]]).length;

	// Missing a property in a individual setting
	if (!invividalSettingKeysMatch) {
		settingKeys.forEach((element) => {
			dispatch({
				type: C.UPDATE_SETTING,
				payload: settings[element]
			});
		});
	}

	// Missing a setting
	if (settingKeys.length !== initialSettingKeys.length) {
		initialSettingKeys.forEach((element) => {
			if (settings[element] === undefined) {
				dispatch({
					type: C.UPDATE_SETTING,
					payload: initialSettings[element]
				});
			}
		});
	}
};

// Cookie Cleanup operation that is to be called from the React UI
export const cookieCleanup = (options) => async (dispatch, getState) => {
	let newOptions;
	// Add in default cleanup settings if payload does not provide any
	if (options.payload !== undefined) {
		newOptions = {
			...options.payload
		};
	} else if (options.payload === undefined && (options.greyCleanup !== undefined || options.ignoreOpenTabs !== undefined)) {
		newOptions = options;
	} else {
		newOptions = {
			greyCleanup: false, ignoreOpenTabs: false
		};
	}

	if (getState().cache.browserVersion === "58" && getState().cache.firstPartyIsolateSetting) {
		browser.notifications.create("FPI_NOTIFICATION", {
			"type": "basic",
			"iconUrl": browser.extension.getURL("icons/icon_48.png"),
			"title": "First Party Isolation Detected",
			"message": "Please turn off privacy.firstparty.isolate and restart the browser as it breaks cookie cleanup"
		});
	}

	const cleanupDoneObject = await cleanCookiesOperation(getState(), newOptions);
	const {
		setOfDeletedDomainCookies, cachedResults
	} = cleanupDoneObject;
	const {
		recentlyCleaned
	} = cachedResults;

	// Increment the count
	if (recentlyCleaned !== 0 && getSetting(getState(), "statLogging")) {
		dispatch(
			incrementCookieDeletedCounter(recentlyCleaned)
		);
	}

	if (recentlyCleaned !== 0 && getSetting(getState(), "statLogging")) {
		dispatch(
			addActivity(cachedResults)
		);
	}

	// Show notifications after cleanup
	if (setOfDeletedDomainCookies.size > 0 && getSetting(getState(), "showNotificationAfterCleanup")) {
		const notifyMessage = browser.i18n.getMessage("notificationContent", [recentlyCleaned, Array.from(setOfDeletedDomainCookies).join(", ")]);
		browser.notifications.create(COOKIE_CLEANUP_NOTIFICATION, {
			"type": "basic",
			"iconUrl": browser.extension.getURL("icons/icon_48.png"),
			"title": browser.i18n.getMessage("notificationTitle"),
			"message": notifyMessage
		});
		const seconds = parseInt(`${getSetting(getState(), "notificationOnScreen")}000`, 10);
		setTimeout(() => {
			browser.notifications.clear(COOKIE_CLEANUP_NOTIFICATION);
		}, seconds);
	}
};

// Map the cookieStoreId to their actual names and store in cache
export const cacheCookieStoreIdNames = () => async (dispatch, getState) => {
	const contextualIdentitiesObjects = await browser.contextualIdentities.query({});
	dispatch(
		{
			type: C.ADD_CACHE,
			map: {
				key: "default", value: "Default"
			}
		}
	);
	dispatch(
		{
			type: C.ADD_CACHE,
			map: {
				key: "firefox-default", value: "Default"
			}
		}
	);
	dispatch(
		{
			type: C.ADD_CACHE,
			map: {
				key: "firefox-private", value: "Private"
			}
		}
	);
	contextualIdentitiesObjects.forEach((object) => dispatch({
		type: C.ADD_CACHE,
		map: {
			key: object.cookieStoreId, value: object.name
		}
	}));
};
