import C from "./Constants";
import initialState from "./initialState.json";
import {getSetting, getHostname} from '../services/libs';
import {cleanCookiesOperation} from '../services/CleanupService';
import {checkIfProtected} from '../services/BrowserActionService';

export const addExpression = (object) => (dispatch, getState) => {
	const {payload} = object;
	const storeId = !getSetting(getState(), "contextualIdentities") || payload.storeId === "firefox-default" ? "default" : payload.storeId;
	dispatch({
		type: C.ADD_EXPRESSION,
		payload,
		storeId
	});
	checkIfProtected(getState());
};

export const removeExpression = (object) => (dispatch, getState) => {
	const {payload} = object;
	const storeId = !getSetting(getState(), "contextualIdentities") || payload.storeId === "firefox-default" ? "default" : payload.storeId;
	dispatch({
		type: C.REMOVE_EXPRESSION,
		payload,
		storeId
	});
	checkIfProtected(getState());
};

export const updateExpression = (object) => (dispatch, getState) => {
	const {payload} = object;
	const storeId = !getSetting(getState(), "contextualIdentities") || payload.storeId === "firefox-default" ? "default" : payload.storeId;
	dispatch({
		type: C.UPDATE_EXPRESSION,
		payload,
		storeId
	});
	checkIfProtected(getState());
};

export const incrementCookieDeletedCounter = (payload) => ({type: C.INCREMENT_COOKIE_DELETED_COUNTER, payload});

export const resetCookieDeletedCounter = () => ({type: C.RESET_COOKIE_DELETED_COUNTER});

export const updateSetting = (payloadSetting) => {
	const {payload} = payloadSetting;
	return {
		type: C.UPDATE_SETTING,
		payload
	};
};

export const resetSettings = () => ({type: C.RESET_SETTINGS});

export const validateSettings = () => (dispatch, getState) => {
	const {settings} = getState();
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
export const cookieCleanup = (options) => async (dispatch, getState) => {
	let newOptions;
	if (options.payload !== undefined) {
		newOptions = {...options.payload};
	} else if(options.payload === undefined && (options.greyCleanup !== undefined || options.ignoreOpenTabs !== undefined)) {
		newOptions = options;
	} else {
		newOptions = {greyCleanup: false, ignoreOpenTabs: false};
	}
	const cleanupDoneObject = await cleanCookiesOperation(getState(), newOptions);
	const { recentlyCleaned, setOfDeletedDomainCookies } = cleanupDoneObject;
	let notifyMessage;
	// Format the string
	if (setOfDeletedDomainCookies.size > 0) {
		let stringOfDomains = "";
		let commaAppendIndex = 0;
		setOfDeletedDomainCookies.forEach((value1, value2, set) => {
			stringOfDomains += value2;
			commaAppendIndex++;
			if (commaAppendIndex < setOfDeletedDomainCookies.size) {
				stringOfDomains += ", ";
			}
		});
		// this.notifyMessage = recentlyCleaned + " Deleted Cookies from: " + stringOfDomains;
		notifyMessage = browser.i18n.getMessage("notificationContent", [recentlyCleaned, stringOfDomains]);
	}

	if (getSetting(getState(), "statLogging")) {
		dispatch(
			incrementCookieDeletedCounter(recentlyCleaned)
		);
	}

	if (setOfDeletedDomainCookies.size > 0 && getSetting(getState(), "showNotificationAfterCleanup")) {
		browser.notifications.create("COOKIE_CLEANUP_NOTIFICATION", {
			"type": "basic",
			"iconUrl": browser.extension.getURL("icons/icon_48.png"),
			"title": browser.i18n.getMessage("notificationTitle"),
			"message": notifyMessage
		});
	}

};

export const cacheCookieStoreIdNames = () => async (dispatch, getState) => {
	const contextualIdentitiesObjects = await browser.contextualIdentities.query({});
	dispatch(
		{type: C.ADD_CACHE, map: {key: "default", value: "Default"}}
	);
	dispatch(
		{type: C.ADD_CACHE, map: {key: "firefox-default", value: "Default"}}
	);
	contextualIdentitiesObjects.forEach(object => dispatch({type: C.ADD_CACHE, map: {key: object.cookieStoreId, value: object.name}}));
}
