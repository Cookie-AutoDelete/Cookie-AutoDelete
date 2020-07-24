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

export const enum ReduxConstants {
  ADD_EXPRESSION = 'ADD_EXPRESSION',
  CLEAR_EXPRESSIONS = 'CLEAR_EXPRESSIONS',
  REMOVE_EXPRESSION = 'REMOVE_EXPRESSION',
  UPDATE_EXPRESSION = 'UPDATE_EXPRESSION',
  REMOVE_LIST = 'REMOVE_LIST',
  COOKIE_CLEANUP = 'COOKIE_CLEANUP',
  ON_STARTUP = 'ON_STARTUP',
  ADD_CACHE = 'ADD_CACHE',
  INCREMENT_COOKIE_DELETED_COUNTER = 'INCREMENT_COOKIE_DELETED_COUNTER',
  RESET_COOKIE_DELETED_COUNTER = 'RESET_COOKIE_DELETED_COUNTER',
  UPDATE_SETTING = 'UPDATE_SETTING',
  RESET_SETTINGS = 'RESET_SETTINGS',
  ADD_ACTIVITY_LOG = 'ADD_ACTIVITY_LOG',
  CLEAR_ACTIVITY_LOG = 'CLEAR_ACTIVITY_LOG',
  REMOVE_ACTIVITY_LOG = 'REMOVE_ACTIVITY_LOG',
  RESET_ALL = 'RESET_ALL',
}

export type ReduxAction =
  | ADD_EXPRESSION
  | CLEAR_EXPRESSIONS
  | REMOVE_EXPRESSION
  | UPDATE_EXPRESSION
  | REMOVE_LIST
  | COOKIE_CLEANUP
  | ON_STARTUP
  | ADD_CACHE
  | INCREMENT_COOKIE_DELETED_COUNTER
  | RESET_COOKIE_DELETED_COUNTER
  | UPDATE_SETTING
  | RESET_SETTINGS
  | ADD_ACTIVITY_LOG
  | CLEAR_ACTIVITY_LOG
  | REMOVE_ACTIVITY_LOG
  | RESET_ALL;

export type ADD_EXPRESSION = Readonly<{
  type: ReduxConstants.ADD_EXPRESSION;
  payload: Expression;
}>;
export type CLEAR_EXPRESSIONS = Readonly<{
  type: ReduxConstants.CLEAR_EXPRESSIONS;
  payload: StoreIdToExpressionList;
}>;
export type REMOVE_EXPRESSION = Readonly<{
  type: ReduxConstants.REMOVE_EXPRESSION;
  payload: Expression | { id: string; storeId: string };
}>;
export type UPDATE_EXPRESSION = Readonly<{
  type: ReduxConstants.UPDATE_EXPRESSION;
  payload: Expression;
}>;
export type REMOVE_LIST = Readonly<{
  type: ReduxConstants.REMOVE_LIST;
  payload: keyof StoreIdToExpressionList;
}>;
export type COOKIE_CLEANUP = Readonly<{
  type: ReduxConstants.COOKIE_CLEANUP;
  payload: CleanupProperties;
}>;
export type ON_STARTUP = Readonly<{
  type: ReduxConstants.ON_STARTUP;
}>;
export type ADD_CACHE = Readonly<{
  type: ReduxConstants.ADD_CACHE;
  payload: { [k: string]: any };
}>;
export type INCREMENT_COOKIE_DELETED_COUNTER = Readonly<{
  type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER;
  payload?: number;
}>;
export type RESET_COOKIE_DELETED_COUNTER = Readonly<{
  type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER;
}>;
export type UPDATE_SETTING = Readonly<{
  type: ReduxConstants.UPDATE_SETTING;
  payload: Setting;
}>;
export type RESET_SETTINGS = Readonly<{
  type: ReduxConstants.RESET_SETTINGS;
}>;
export type RESET_ALL = Readonly<{
  type: ReduxConstants.RESET_ALL;
}>;
export type ADD_ACTIVITY_LOG = Readonly<{
  type: ReduxConstants.ADD_ACTIVITY_LOG;
  payload: ActivityLog;
}>;
export type REMOVE_ACTIVITY_LOG = Readonly<{
  type: ReduxConstants.REMOVE_ACTIVITY_LOG;
  payload: ActivityLog;
}>;
export type CLEAR_ACTIVITY_LOG = Readonly<{
  type: ReduxConstants.CLEAR_ACTIVITY_LOG;
}>;
