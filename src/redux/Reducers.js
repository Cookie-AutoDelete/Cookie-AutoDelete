import C from "./Constants";
import {combineReducers} from "redux";
import shortid from "shortid";
import initialState from "./initialState.json";

export const expressionToRegExp = (string) => {
	const normalizedString = string.trim().toLowerCase();
	if (normalizedString === "*") {
		return `^.*$`;
	}
	if (normalizedString.startsWith("*.")) {
		return `${normalizedString.replace("*.", "(^|\.)").replace(/\./g, "\\.")}$`;
	}
	return `^${normalizedString.replace(/\./g, "\\.")}$`;
};

const hasExpression = (state, action) => state.some((expression) => expression.expression === action.payload.expression);

const newExpressionObject = (state, action) => ({
	...state,
	...action.payload,
	id: shortid.generate(),
	regExp: action.payload.expression === undefined ? state.regExp : expressionToRegExp(action.payload.expression),
	listType: action.payload.listType === undefined ? "WHITE" : action.payload.listType,
	cookieNames: action.payload.cookieNames === undefined ? [] : action.payload.cookieNames
});

const sortExpressionAlgorithm = (a,b) => {
	if (a.listType === "WHITE" && b.listType === "GREY") {
		return -1;
	} else if (b.listType === "WHITE" && a.listType === "GREY"){
		return 1;
	}
	return a.expression.localeCompare(b.expression);
}

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
		return [...state, newExpressionObject({}, action)].sort(sortExpressionAlgorithm);
	}

	case C.UPDATE_EXPRESSION:
		if (hasExpression(state, action)) {
			return state;
		}
		return state.map((e) => expression(e, action)).sort(sortExpressionAlgorithm);

	case C.REMOVE_EXPRESSION:
		return state.filter((expression) => expression.id !== action.payload.id);

	case C.RESET_SETTINGS:
		return [];

	default:
		return state;
	}
};

export const lists = (state = {}, action) => {
	if (action.storeId === undefined && state.default === undefined) {
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

const initialSettings = initialState.settings;

export const settings = (state = initialSettings, action) => {
	switch (action.type) {
	case C.UPDATE_SETTING: {
		const {
			name
		} = action.payload;
		let newObject = {
			...state
		};
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
	case C.INCREMENT_COOKIE_DELETED_COUNTER: {
		const incrementBy = action.payload === undefined ? 1 : action.payload;
		return state + incrementBy;
	}
	case C.RESET_SETTINGS:
	case C.RESET_COOKIE_DELETED_COUNTER:
		return 0;
	default:
		return state;
	}
};

export const cookieDeletedCounterSession = (state = 0, action) => {
	switch (action.type) {
	case C.INCREMENT_COOKIE_DELETED_COUNTER: {
		const incrementBy = action.payload === undefined ? 1 : action.payload;
		return state + incrementBy;
	}
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
	case C.ADD_CACHE: {
		let newCacheObject = {
			...state
		};
		newCacheObject[`${action.map.key}`] = action.map.value;
		return newCacheObject;
	}

	case C.RESET_SETTINGS:
		return {};
	default:
		return state;
	}
};

export default combineReducers({
	lists,
	cookieDeletedCounterTotal,
	cookieDeletedCounterSession,
	settings,
	cache
});
