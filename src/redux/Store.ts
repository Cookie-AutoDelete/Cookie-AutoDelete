/**
 * Copyright (c) 2017 Kenny Do
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { applyMiddleware, createStore } from 'redux';
// tslint:disable-next-line:import-name
import thunk from 'redux-thunk';
import { createBackgroundStore } from 'redux-webext';
import { ReduxConstants } from '../typings/ReduxConstants';
import {
  addExpression,
  cookieCleanup,
  removeActivity,
  removeExpression,
  resetCookieDeletedCounter,
  resetSettings,
  updateExpression,
  updateSetting,
} from './Actions';
// tslint:disable-next-line:import-name
import reducer from './Reducers';
const consoleMessages = (store: any) => (next: any) => (action: any) => {
  let result;

  // console.log(
  //   `dispatching action => ${action.type}
  // payload => ${JSON.stringify(action.payload)}`,
  // );

  result = next(action);

  return result;
};

const actions: { [key in ReduxConstants]?: any } = {
  ADD_EXPRESSION: addExpression,
  COOKIE_CLEANUP: cookieCleanup,
  REMOVE_ACTIVITY_LOG: removeActivity,
  REMOVE_EXPRESSION: removeExpression,
  RESET_COOKIE_DELETED_COUNTER: resetCookieDeletedCounter,
  RESET_SETTINGS: resetSettings,
  UPDATE_EXPRESSION: updateExpression,
  UPDATE_SETTING: updateSetting,
};

export default (state = {}) => {
  return createBackgroundStore({
    actions,
    store: createStore(reducer, state, applyMiddleware(thunk, consoleMessages)),
  });
};
