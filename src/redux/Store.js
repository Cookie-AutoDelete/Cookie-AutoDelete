import {applyMiddleware, createStore} from "redux";
import {createBackgroundStore} from "redux-webext";
import reducer from "./Reducers";
import thunk from "redux-thunk";
import {
	addExpression,
	removeExpression,
	resetCookieDeletedCounter,
	resetSettings,
	updateExpression,
	updateSetting,
	cookieCleanup
} from "./Actions";
const consoleMessages = (store) => (next) => (action) => {
	let result;

	console.log(
		`dispatching action => ${action.type}
	payload => ${JSON.stringify(action.payload)}`);

	result = next(action);

	return result;
};

const actions = {
	UPDATE_SETTING: updateSetting,
	RESET_SETTINGS: resetSettings,
	ADD_EXPRESSION: addExpression,
	COOKIE_CLEANUP: cookieCleanup,
	REMOVE_EXPRESSION: removeExpression,
	UPDATE_EXPRESSION: updateExpression,
	RESET_COOKIE_DELETED_COUNTER: resetCookieDeletedCounter,
};

export default (state = {}) => createBackgroundStore({
	store: createStore(reducer, state, applyMiddleware(thunk, consoleMessages)),
	actions
});
