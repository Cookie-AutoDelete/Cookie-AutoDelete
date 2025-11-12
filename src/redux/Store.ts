/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
/* istanbul ignore file: Redux stuff.*/

import {
  configureStore,
  type ActionCreator,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import logger from 'redux-logger';
import { alias, createWrapStore } from 'webext-redux';

// slices
import type { ActivityLog } from '../typings/Cleanup';
import type {
  CacheMap,
  MapToSettingObject,
  StoreIdToExpressionList,
} from '../typings/Global';
import activityLog from './ActivityLogSlice';
import {
  addExpression,
  clearExpressions,
  cookieCleanup,
  removeExpression,
  removeList,
  updateExpression,
} from './BackgroundActions';
import cache from './CacheSlice';
import cookieDeletedCounterReducers from './CookieDeletedCounterSlices';
import lists from './ListsSlice';
import settings from './SettingsSlice';
import {
  addExpressionUI,
  clearExpressionsUI,
  cookieCleanupUI,
  removeExpressionUI,
  removeListUI,
  updateExpressionUI,
} from './UIActions';

const wrapStore = createWrapStore();

// The webext-redux will invoke those action creators when the ui actions are dispatched
// to the proxy store. And the payload will be the **action object** that ui created.
// So we need use the wrapper to extract the payload from the action object.
const createPayloadWrapper =
  <P, A extends UnknownAction | ThunkAction<void, State, any, UnknownAction>>(
    actionCreator: ActionCreator<A, [P]>,
  ): ActionCreator<A, [PayloadAction<P>]> =>
  ({ payload }) =>
    actionCreator(payload);

// Corresponds to Action Type in UIActions
const aliases = {
  [addExpressionUI.type]: createPayloadWrapper(addExpression),
  [clearExpressionsUI.type]: createPayloadWrapper(clearExpressions),
  [removeExpressionUI.type]: createPayloadWrapper(removeExpression),
  [updateExpressionUI.type]: createPayloadWrapper(updateExpression),
  [removeListUI.type]: createPayloadWrapper(removeList),
  [cookieCleanupUI.type]: createPayloadWrapper(cookieCleanup),
};

export const configureWrapStore = (state: State) => {
  const store = configureStore({
    preloadedState: state,
    reducer: {
      activityLog,
      cache,
      ...cookieDeletedCounterReducers,
      lists,
      settings,
    },
    middleware: (getDefaultMiddleware) => {
      const middleware = getDefaultMiddleware();

      // Conditionally add another middleware in dev
      if (process.env.NODE_ENV !== 'production') {
        middleware.push(logger);
      }

      return middleware.prepend(alias(aliases));
    },
  });
  wrapStore(store);
  return store;
};

export type State = Readonly<{
  lists: StoreIdToExpressionList;
  cookieDeletedCounterTotal: number;
  cookieDeletedCounterSession: number;
  settings: MapToSettingObject;
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
}>;

export type Dispatch = ReturnType<typeof configureWrapStore>['dispatch'];
export type GetState = ReturnType<typeof configureWrapStore>['getState'];
