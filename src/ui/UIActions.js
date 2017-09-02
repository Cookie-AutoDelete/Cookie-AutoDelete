import C from "../redux/Constants";

export const updateSettingUI = (payload) => ({
	type: C.UPDATE_SETTING,
	payload
});

export const resetSettingsUI = () => ({
	type: C.RESET_SETTINGS
});
export const resetCookieDeletedCounterUI = () => ({
	type: C.RESET_COOKIE_DELETED_COUNTER
});

export const addExpressionUI = (payload) => ({
	type: C.ADD_EXPRESSION,
	payload
});

export const removeExpressionUI = (payload) => ({
	type: C.REMOVE_EXPRESSION,
	payload
});

export const updateExpressionUI = (payload) => ({
	type: C.UPDATE_EXPRESSION,
	payload
});

export const cookieCleanupUI = (payload) => ({
	type: C.COOKIE_CLEANUP,
	payload
});
