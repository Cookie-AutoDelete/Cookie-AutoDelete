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
import {
  addExpression,
  cookieCleanup,
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

const actions = {
  UPDATE_SETTING: updateSetting,
  // tslint:disable-next-line:object-literal-sort-keys
  RESET_SETTINGS: resetSettings,
  ADD_EXPRESSION: addExpression,
  COOKIE_CLEANUP: cookieCleanup,
  REMOVE_EXPRESSION: removeExpression,
  UPDATE_EXPRESSION: updateExpression,
  RESET_COOKIE_DELETED_COUNTER: resetCookieDeletedCounter,
};

export default (state = {}) => {
  return createBackgroundStore({
    actions,
    store: createStore(reducer, state, applyMiddleware(thunk, consoleMessages)),
  });
};
