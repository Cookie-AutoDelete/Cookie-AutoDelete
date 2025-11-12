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
import {
  createAction,
  createReducer,
  createSlice,
  isAnyOf,
  type PayloadAction,
} from '@reduxjs/toolkit';
import shortid from 'shortid';
import { ListType } from '../typings/Enums';
import type { Expression, StoreIdToExpressionList } from '../typings/Global';
import { ReduxConstants } from './ReduxConstants';
import { resetAll } from './SharedActions';

const initialState: StoreIdToExpressionList = {};

const actions = {
  addExpression: createAction<Expression>(ReduxConstants.ADD_EXPRESSION),
  removeExpression: createAction<Expression | { id: string; storeId: string }>(
    ReduxConstants.REMOVE_EXPRESSION,
  ),
  updateExpression: createAction<Expression>(ReduxConstants.UPDATE_EXPRESSION),
  removeList: createAction<string>(ReduxConstants.REMOVE_LIST),
  clearExpressions: createAction<StoreIdToExpressionList>(
    ReduxConstants.CLEAR_EXPRESSIONS,
  ),
  resetAll,
} as const;

// Tests if the expression already exists in the list
const hasExpression = (
  list: ReadonlyArray<Expression>,
  action: PayloadAction<Expression>,
) => list.some((expObj) => expObj.expression === action.payload.expression);

// Creates a new Expression object to be stored in the list
const newExpressionObject = (
  state: Expression | Record<string, unknown>,
  action: PayloadAction<Expression>,
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

const initialExpressionState: Expression = {
  cookieNames: [] as string[],
  expression: '',
  id: '1',
  listType: ListType.WHITE,
  storeId: 'default',
};

export const expression = createReducer<Expression>(
  initialExpressionState,
  (builder) => {
    builder.addCase(actions.updateExpression, (state, action) => {
      if (state.id === action.payload.id) {
        return newExpressionObject(state, action);
      }
      return state;
    });
  },
);

export const expressions = createReducer<Array<Expression>>([], (builder) => {
  builder
    .addCase(actions.addExpression, (state, action) => {
      if (hasExpression(state, action)) {
        return state;
      }
      return [...state, newExpressionObject({}, action)].sort(
        sortExpressionAlgorithm,
      );
    })
    .addCase(actions.updateExpression, (state, action) =>
      state.map((e) => expression(e, action)).sort(sortExpressionAlgorithm),
    )
    .addCase(actions.removeExpression, (state, action) =>
      state.filter((expObj) => expObj.id !== action.payload.id),
    )
    .addCase(actions.resetAll, () => [])
    .addDefaultCase((state) => state);
});

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(actions.removeList, (state, { payload }) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state[payload.toString()];
      })
      .addMatcher(
        isAnyOf(
          actions.addExpression,
          actions.removeExpression,
          actions.updateExpression,
        ),
        (state, action) => {
          const {
            payload: { storeId },
          } = action;

          state[storeId] = expressions(state[storeId], action);
          if (state[storeId]?.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state[storeId];
          }
        },
      )
      .addMatcher(
        isAnyOf(actions.resetAll, actions.clearExpressions),
        () => initialState,
      )
      .addDefaultCase((state) => state);
  },
});

export const {
  addExpression,
  clearExpressions,
  removeExpression,
  removeList,
  updateExpression,
} = actions;

export default listsSlice.reducer;
