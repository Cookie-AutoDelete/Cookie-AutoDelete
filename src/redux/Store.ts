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
/* istanbul ignore file: Redux stuff.*/

import { applyMiddleware, createStore } from 'redux';
// tslint:disable-next-line:import-name
import thunk from 'redux-thunk';
import { createBackgroundStore } from 'redux-webext';
import { ReduxConstants } from '../typings/ReduxConstants';
import {
  addExpression,
  clearActivities,
  clearExpressions,
  cookieCleanup,
  removeActivity,
  removeExpression,
  removeList,
  resetAll,
  resetCookieDeletedCounter,
  resetSettings,
  updateExpression,
  updateSetting,
} from './Actions';
import reducer from './Reducers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const consoleMessages = (store: any) => (next: any) => (action: any) => {
  // console.log(
  //   `dispatching action => ${action.type}
  // payload => ${JSON.stringify(action.payload)}`,
  // );

  return next(action);
};

const actions: { [key in ReduxConstants]?: any } = {
  ADD_EXPRESSION: addExpression,
  CLEAR_ACTIVITY_LOG: clearActivities,
  CLEAR_EXPRESSIONS: clearExpressions,
  COOKIE_CLEANUP: cookieCleanup,
  REMOVE_ACTIVITY_LOG: removeActivity,
  REMOVE_EXPRESSION: removeExpression,
  REMOVE_LIST: removeList,
  RESET_ALL: resetAll,
  RESET_COOKIE_DELETED_COUNTER: resetCookieDeletedCounter,
  RESET_SETTINGS: resetSettings,
  UPDATE_EXPRESSION: updateExpression,
  UPDATE_SETTING: updateSetting,
};

export default (state = {}): any => {
  return createBackgroundStore({
    actions,
    store: createStore(reducer, state, applyMiddleware(thunk, consoleMessages)),
  });
};
