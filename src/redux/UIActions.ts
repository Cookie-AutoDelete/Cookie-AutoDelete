/**
 * Copyright (c) 2020-2022 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { createAction } from '@reduxjs/toolkit';
import type { Expression, StoreIdToExpressionList } from '../typings/Global';
import { ReduxConstants } from './ReduxConstants';
import type { CleanupProperties } from '../typings/Cleanup';

// Those actions are specific to the UI and should not be used in background scripts.

// The name cannot be the same as the background action. Otherwise, it will cause a dispatch loop.
const UIActionSuffix = '_UI';

export const addExpressionUI = createAction<Expression>(
  ReduxConstants.ADD_EXPRESSION + UIActionSuffix,
);

export const clearExpressionsUI = createAction<StoreIdToExpressionList>(
  ReduxConstants.CLEAR_EXPRESSIONS + UIActionSuffix,
);

export const removeExpressionUI = createAction<Expression>(
  ReduxConstants.REMOVE_EXPRESSION + UIActionSuffix,
);

export const updateExpressionUI = createAction<Expression>(
  ReduxConstants.UPDATE_EXPRESSION + UIActionSuffix,
);

export const removeListUI = createAction<string>(
  ReduxConstants.REMOVE_LIST + UIActionSuffix,
);

export const cookieCleanupUI = createAction<CleanupProperties>(
  ReduxConstants.COOKIE_CLEANUP + UIActionSuffix,
);
