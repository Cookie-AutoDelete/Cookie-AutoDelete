import C from "./Constants";
import {combineReducers} from "redux";
import shortid from "shortid";
import initialState from "./initialState.json";

// http://kevin.vanzonneveld.net
// +   original by: booeyOH
// +   improved by: Ates Goral (http://magnetiq.com)
// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Onno Marsman
// +   improved by: Brett Zamir (http://brett-zamir.me)
// *     example 1: preg_quote("$40");
// *     returns 1: '\$40'
// *     example 2: preg_quote("*RRRING* Hello?");
// *     returns 2: '\*RRRING\* Hello\?'
// *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
// *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
const preg_quote = (str, delimiter) => (`${str}`).replace(new RegExp(`[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\${delimiter || ""}-]`, "g"), "\\$&");

const globStringToRegex = (str) => `^${preg_quote(str).replace(/\\\*/g, ".*").replace(/\\\?/g, ".")}$`;

const hasExpression = (state, action) => state.some((expression) => expression.expression === action.payload.expression);

const newExpressionObject = (state, action) => {
	return {
		...state,
		...action.payload,
		id: shortid.generate(),
		regExp: action.payload.expression === undefined ? state.regExp : globStringToRegex(action.payload.expression),
		listType: action.payload.listType === undefined ? "WHITE" : action.payload.listType,
		cookieNames: action.payload.cookieNames === undefined ? [] : action.payload.cookieNames
	};
};

export const lists = (state = {}, action) => {
	if(action.storeId === undefined && state["default"] === undefined) {
		return {
			default: expressions([], action)
		};
	}

	const storeId = action.storeId === undefined ? "default" : action.storeId;
	let newListObject = {
		...state
	};
	newListObject[storeId] = expressions(state[storeId], action);
	return newListObject;
};

export const expression = (state = {}, action) => {
	switch (action.type) {
	case C.UPDATE_EXPRESSION:
		if (state.id === action.payload.id) {
			return newExpressionObject(state, action);
		}

		return state;

	default:
		return state;
	}
};

export const expressions = (state = [], action) => {
	switch (action.type) {
	case C.ADD_EXPRESSION: {
		if (hasExpression(state, action)) {
			return state;
		}
		return [...state, newExpressionObject({}, action)].sort((a, b) => a.expression.localeCompare(b.expression));
	}

	case C.UPDATE_EXPRESSION:
		if (hasExpression(state, action)) {
			return state;
		}
		return state.map((e) => expression(e, action)).sort((a, b) => a.expression.localeCompare(b.expression));

	case C.REMOVE_EXPRESSION:
		return state.filter((expression) => expression.id !== action.payload.id);

	case C.RESET_SETTINGS:
		return [];

	default:
		return state;
	}
};

const initialSettings = initialState.settings;

export const settings = (state = initialSettings, action) => {
	switch (action.type) {
	case C.UPDATE_SETTING: {
		const {name} = action.payload;
		let newObject = {...state};
		newObject[name] = {
			...action.payload,
			id: shortid.generate()
		};
		return newObject;
	}
	case C.RESET_SETTINGS:
		return initialSettings;
	default:
		return state;
	}
};

export const cookieDeletedCounterTotal = (state = 0, action) => {
	switch (action.type) {
	case C.INCREMENT_COOKIE_DELETED_COUNTER:
		const incrementBy = action.payload === undefined ? 1 : action.payload;
		return state + incrementBy;

	case C.RESET_SETTINGS:
	case C.RESET_COOKIE_DELETED_COUNTER:
		return 0;
	default:
		return state;
	}
};

export const cookieDeletedCounterSession = (state = 0, action) => {
	switch (action.type) {
	case C.INCREMENT_COOKIE_DELETED_COUNTER:
		const incrementBy = action.payload === undefined ? 1 : action.payload;
		return state + incrementBy;

	case C.ON_STARTUP:
	case C.RESET_SETTINGS:
	case C.RESET_COOKIE_DELETED_COUNTER:
		return 0;
	default:
		return state;
	}
};

export const cache = (state = {}, action) => {
	switch (action.type) {
	case C.ADD_CACHE:
		let newCacheObject = {
			...state,
		};
		newCacheObject[`${action.map.key}`] = action.map.value;
		return newCacheObject;

	case C.RESET_SETTINGS:
		return {};
	default:
		return state;
	}
}

export default combineReducers({
	lists,
	cookieDeletedCounterTotal,
	cookieDeletedCounterSession,
	settings,
	cache
});
