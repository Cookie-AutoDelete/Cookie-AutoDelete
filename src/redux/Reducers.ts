/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { combineReducers } from 'redux';
import shortid from 'shortid';
import { ReduxAction, ReduxConstants } from '../typings/ReduxConstants';
import { initialState } from './State';

// Tests if the expression already exists in the list
const hasExpression = (
  list: ReadonlyArray<Expression>,
  action: { payload: Expression },
) => list.some((expObj) => expObj.expression === action.payload.expression);

// Creates a new Expression object to be stored in the list
const newExpressionObject = (
  state: Expression | Record<string, unknown>,
  action: { payload: Expression },
) => ({
  ...action.payload,
  cookieNames: !action.payload.cookieNames ? [] : action.payload.cookieNames,
  cleanSiteData: !action.payload.cleanSiteData
    ? []
    : action.payload.cleanSiteData,
  id: shortid.generate(),
  listType: !action.payload.listType ? ListType.WHITE : action.payload.listType,
});

// Sorting algorithm for the expression list.
// Order is WHITE -> GREY -> Alphanumeric
const sortExpressionAlgorithm = (a: Expression, b: Expression) => {
  if (a.listType === ListType.WHITE && b.listType === ListType.GREY) {
    return -1;
  }
  if (b.listType === ListType.WHITE && a.listType === ListType.GREY) {
    return 1;
  }
  return a.expression.localeCompare(b.expression);
};

export const expression = (
  state: Expression = {
    cookieNames: [],
    expression: '',
    id: '1',
    listType: ListType.WHITE,
    storeId: 'default',
  },
  action: ReduxAction,
): Expression => {
  switch (action.type) {
    case ReduxConstants.UPDATE_EXPRESSION: {
      if (state.id === action.payload.id) {
        return newExpressionObject(state, action);
      }
      return state;
    }
    default:
      return state;
  }
};

export const expressions = (
  state: ReadonlyArray<Expression> = [],
  action: ReduxAction,
): ReadonlyArray<Expression> => {
  switch (action.type) {
    case ReduxConstants.ADD_EXPRESSION: {
      if (hasExpression(state, action)) {
        return state;
      }
      return [...state, newExpressionObject({}, action)].sort(
        sortExpressionAlgorithm,
      );
    }

    case ReduxConstants.UPDATE_EXPRESSION:
      return state
        .map((e) => expression(e, action))
        .sort(sortExpressionAlgorithm);

    case ReduxConstants.REMOVE_EXPRESSION:
      return state.filter((expObj) => expObj.id !== action.payload.id);

    case ReduxConstants.RESET_ALL:
      return [];

    default:
      return state;
  }
};

export const lists = (
  state: StoreIdToExpressionList = {},
  action: ReduxAction,
): StoreIdToExpressionList => {
  switch (action.type) {
    case ReduxConstants.ADD_EXPRESSION:
    case ReduxConstants.REMOVE_EXPRESSION:
    case ReduxConstants.UPDATE_EXPRESSION: {
      const newListObject = { ...state };
      newListObject[action.payload.storeId] = expressions(
        state[action.payload.storeId],
        action,
      );
      if (newListObject[action.payload.storeId].length === 0) {
        delete newListObject[action.payload.storeId];
      }
      return newListObject;
    }
    case ReduxConstants.REMOVE_LIST: {
      const newListObject = { ...state };
      delete newListObject[action.payload.toString()];
      return newListObject;
    }

    case ReduxConstants.CLEAR_EXPRESSIONS:
    case ReduxConstants.RESET_ALL:
      return {};

    default:
      return state;
  }
};

export const settings = (
  state = initialState.settings,
  action: ReduxAction,
): MapToSettingObject => {
  switch (action.type) {
    case ReduxConstants.UPDATE_SETTING: {
      const newObject = {
        ...state,
      };
      newObject[action.payload.name] = {
        ...action.payload,
      };
      return newObject;
    }

    case ReduxConstants.RESET_ALL:
    case ReduxConstants.RESET_SETTINGS:
      return initialState.settings;

    default:
      return state;
  }
};

export const cookieDeletedCounterTotal = (
  state = 0,
  action: ReduxAction,
): number => {
  switch (action.type) {
    case ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER:
      return state + (action.payload === undefined ? 1 : action.payload);
    case ReduxConstants.RESET_ALL:
    case ReduxConstants.RESET_COOKIE_DELETED_COUNTER:
      return 0;
    default:
      return state;
  }
};

export const cookieDeletedCounterSession = (
  state = 0,
  action: ReduxAction,
): number => {
  switch (action.type) {
    case ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER: {
      const incrementBy = action.payload === undefined ? 1 : action.payload;
      return state + incrementBy;
    }

    case ReduxConstants.RESET_ALL:
    case ReduxConstants.ON_STARTUP:
    case ReduxConstants.RESET_COOKIE_DELETED_COUNTER:
      return 0;
    default:
      return state;
  }
};

export const activityLog = (
  state: ReadonlyArray<ActivityLog> = [],
  action: ReduxAction,
): ReadonlyArray<ActivityLog> => {
  switch (action.type) {
    case ReduxConstants.ADD_ACTIVITY_LOG: {
      if (
        Object.keys(action.payload.storeIds).length > 0 ||
        action.payload.siteDataCleaned
      ) {
        return [action.payload, ...state].slice(0, 10);
      }
      return state;
    }
    case ReduxConstants.REMOVE_ACTIVITY_LOG: {
      return state.filter((log) => log.dateTime !== action.payload.dateTime);
    }

    case ReduxConstants.RESET_ALL:
    case ReduxConstants.CLEAR_ACTIVITY_LOG:
      return [];
    default:
      return state;
  }
};

export const cache = (
  state: CacheMap = {},
  action: ReduxAction,
): Record<string, any> => {
  switch (action.type) {
    case ReduxConstants.ADD_CACHE: {
      const newCacheObject = {
        ...state,
      };
      newCacheObject[`${action.payload.key}`] = action.payload.value;
      return newCacheObject;
    }

    case ReduxConstants.RESET_ALL:
      return {};

    default:
      return state;
  }
};

export default combineReducers<State, ReduxAction>({
  activityLog,
  cache,
  cookieDeletedCounterSession,
  cookieDeletedCounterTotal,
  lists,
  settings,
});
