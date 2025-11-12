/**
 * Copyright (c) 2022 CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { ActivityLog } from '../../src/typings/Cleanup';
import {
  BrowserName,
  ListType,
  SettingID,
  SiteDataType,
} from '../../src/typings/Enums';
import { Expression, StoreIdToExpressionList } from '../../src/typings/Global';

import activityLog, { addActivity, removeActivity, clearActivities } from '../../src/redux/ActivityLogSlice';
import cache from '../../src/redux/CacheSlice';
import cookieDeletedCounterReducers, {
  incrementCookieDeletedCounter,
  resetCookieDeletedCounter,
} from '../../src/redux/CookieDeletedCounterSlices';
import lists, {
  expression,
  expressions,
  addExpression,
  removeExpression,
  updateExpression,
  removeList,
  clearExpressions,
} from '../../src/redux/ListsSlice';
import settings, {
  initialState as initialSettings,
  updateSetting,
  resetSettings,
} from '../../src/redux/SettingsSlice';

import { resetAll } from '../../src/redux/SharedActions';
import { handleStartUp } from '../../src/redux/BackgroundActions';

const { cookieDeletedCounterSession, cookieDeletedCounterTotal } =
  cookieDeletedCounterReducers;

const mockExpression: Expression = {
  expression: '',
  listType: ListType.WHITE,
  storeId: 'default',
};

describe('Reducer', () => {
  describe('activityLog', () => {
    const log1 = {
      dateTime: 'Thu Jan 10 2019 08:00:00 GMT-0800 (Pacific Standard Time)',
      recentlyCleaned: 0,
      storeIds: {
        test: [],
      },
      browsingDataCleanup: {},
      siteDataCleaned: false,
    };
    const log2 = {
      dateTime: 'Thu Jan 11 2019 08:00:00 GMT-0800 (Pacific Standard Time)',
      recentlyCleaned: 0,
      storeIds: {
        test: [],
      },
      browsingDataCleanup: {},
      siteDataCleaned: false,
    };
    const state: ActivityLog[] = [log1];

    it('should be removed', () => {
      const result = activityLog(state, removeActivity(log1));
      expect(result.length).toBe(0);
    });

    it('should be removed when clearing logs', () => {
      const result = activityLog(state, clearActivities());
      expect(result).toHaveLength(0);
    });

    it('should be added to the front', () => {
      const result = activityLog(state, addActivity(log2));
      expect(result).toEqual([log2, log1]);
    });

    it('should not be added because no storeIds', () => {
      const result = activityLog(state, addActivity({
        ...log2,
        storeIds: {},
      }));
      expect(result).toEqual([log1]);
    });
    it('should return empty array on RESET_ALL', () => {
      const result = activityLog(state, resetAll());
      expect(result).toHaveLength(0);
    });
  });
  describe('cookieDeletedCounterTotal', () => {
    const state = 5;

    it('should return 0 through RESET_COOKIE_DELETED_COUNTER', () => {
      const newState = cookieDeletedCounterTotal(state, resetCookieDeletedCounter());
      expect(newState).toBe(0);
    });
    it('should return 0 through RESET_ALL', () => {
      const newState = cookieDeletedCounterTotal(state, resetAll());
      expect(newState).toBe(0);
    });
    it('should return 6', () => {
      const newState = cookieDeletedCounterTotal(state, incrementCookieDeletedCounter());
      expect(newState).toBe(6);
    });
    it('should return 10', () => {
      const newState = cookieDeletedCounterTotal(state, incrementCookieDeletedCounter(5));
      expect(newState).toBe(10);
    });
    it('should return 1 if nothing was given', () => {
      const newState = cookieDeletedCounterTotal(undefined, incrementCookieDeletedCounter());
      expect(newState).toBe(1);
    });
  });

  describe('cookieDeletedCounterSession', () => {
    const state = 5;

    it('should return 0 on RESET_COOKIE_DELETED_COUNTER', () => {
      const newState = cookieDeletedCounterSession(state, resetCookieDeletedCounter());
      expect(newState).toBe(0);
    });
    it('should return 0 on RESET_ALL', () => {
      const newState = cookieDeletedCounterSession(state, resetAll());
      expect(newState).toBe(0);
    });
    it('should return 0 on start up', () => {
      const newState = cookieDeletedCounterSession(state, handleStartUp());
      expect(newState).toBe(0);
    });
    it('should return 6', () => {
      const newState = cookieDeletedCounterSession(state, incrementCookieDeletedCounter());
      expect(newState).toBe(6);
    });
    it('should return 10', () => {
      const newState = cookieDeletedCounterSession(state, incrementCookieDeletedCounter(5));
      expect(newState).toBe(10);
    });
  });

  describe('lists with no stuff', () => {
    const state = {};

    it('should return google.com', () => {
      const newState = lists(state, addExpression({
        ...mockExpression,
        expression: 'google.com',
        listType: ListType.GREY,
      }));
      const firstExpression = newState.default[0];
      expect(firstExpression).toHaveProperty('expression', 'google.com');
      expect(firstExpression).toHaveProperty('listType', ListType.GREY);
      expect(firstExpression).toHaveProperty('id');
    });

    it('should return youtube.com for firefox_container_2', () => {
      const newState = lists(state, addExpression({
        expression: 'youtube.com',
        listType: ListType.GREY,
        storeId: 'firefox_container_2',
      }));
      const firstExpression = newState.firefox_container_2[0];
      expect(firstExpression).toHaveProperty('expression', 'youtube.com');
      expect(firstExpression).toHaveProperty('listType', ListType.GREY);
      expect(firstExpression).toHaveProperty('id');
    });

    it('should return google.com with a default listType of WHITE', () => {
      const newState = lists(state, addExpression({
        ...mockExpression,
        expression: 'google.com',
      }));
      const firstExpression = newState.default[0];
      expect(firstExpression).toHaveProperty('expression', 'google.com');
      expect(firstExpression).toHaveProperty('listType', ListType.WHITE);
      expect(firstExpression).toHaveProperty('id');
    });
  });

  describe('lists with stuff', () => {
    const state: StoreIdToExpressionList = {
      default: [
        {
          expression: 'messenger.com*',
          id: 'SyZbDbC1dW',
          listType: ListType.WHITE,
          storeId: 'default',
        },
        {
          expression: 'facebook.com*',
          id: 'B1eWwWRJOb',
          listType: ListType.GREY,
          storeId: 'default',
        },
      ],
      'firefox-container-1': [
        {
          expression: 'messenger.com*',
          id: '456',
          listType: ListType.WHITE,
          storeId: 'firefox-container-1',
        },
        {
          expression: 'facebook.com*',
          id: '123',
          listType: ListType.GREY,
          storeId: 'firefox-container-1',
        },
      ],
      'firefox-container-2': [
        {
          expression: 'remove.me',
          id: '222',
          listType: ListType.WHITE,
          storeId: 'firefox-container-2',
        },
      ],
    };

    it('should return youtube.com on default', () => {
      const newState = lists(
        state,
        addExpression({
          ...mockExpression,
          expression: 'youtube.com',
          listType: ListType.WHITE,
        }),
      );
      const newExpression = newState.default[1];
      expect(newExpression).toHaveProperty('expression', 'youtube.com');
      expect(newExpression).toHaveProperty('listType', ListType.WHITE);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return github.com on firefox-container-1', () => {
      const newState = lists(
        state,
        addExpression({
          expression: 'github.com',
          listType: ListType.GREY,
          storeId: 'firefox-container-1',
        }),
      );
      const newExpression = newState['firefox-container-1'][2];
      expect(newExpression).toHaveProperty('expression', 'github.com');
      expect(newExpression).toHaveProperty('listType', ListType.GREY);
      expect(newExpression).toHaveProperty('id');
    });
    it('should return not return messenger.com on default', () => {
      const newState = lists(
        { ...state },
        removeExpression({
          id: 'SyZbDbC1dW',
          storeId: 'default',
        }),
      );
      expect(newState.default).not.toEqual(
        expect.arrayContaining(state.default as any[]),
      );
    });

    it('should return github.com and GREY for updated expression on default', () => {
      const newState = lists(
        state,
        updateExpression({
          ...mockExpression,
          expression: 'github.com',
          id: 'SyZbDbC1dW',
          listType: ListType.GREY,
        }),
      );

      const newExpression = newState.default[1];
      expect(newExpression).toHaveProperty('expression', 'github.com');
      expect(newExpression).toHaveProperty('listType', ListType.GREY);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return google.com and WHITE for updated expression on firefox-container-1', () => {
      const newState = lists(
        state,
        updateExpression({
          expression: 'google.com',
          id: '123',
          listType: ListType.WHITE,
          storeId: 'firefox-container-1',
        }),
      );

      const newExpression = newState['firefox-container-1'][0];
      expect(newExpression).toHaveProperty('expression', 'google.com');
      expect(newExpression).toHaveProperty('listType', ListType.WHITE);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return an empty object if CLEAR_EXPRESSIONS was called.', () => {
      const newState = lists(state, clearExpressions({}));
      expect(newState).toEqual({});
    });

    it('should remove a single list if REMOVE_LIST was called.', () => {
      const newState = lists(state, removeList('firefox-container-1'));
      expect(Object.keys(newState)).toEqual(
        expect.not.arrayContaining(['firefox-container-1']),
      );
    });

    it('should not remove anything if REMOVE_LIST was called but with invalid id.', () => {
      const newState = lists(state, removeList('firefox-container-99'));
      expect(newState).toEqual(state);
    });

    it('should return empty object if REMOVE_LIST was called with empty state/list.', () => {
      const newState = lists(
        {},
        removeList('firefox-container-9'),
      );
      expect(newState).toEqual({});
    });

    it('should return empty object if REMOVE_LIST removed last list.', () => {
      const newState = lists(
        { default: state['default'] },
        removeList('default'),
      );
      expect(newState).toEqual({});
    });

    it('should remove list if last expression entry was removed.', () => {
      const newState = lists(state, removeExpression(state['firefox-container-2'][0]));
      expect(Object.keys(newState)).toEqual(
        expect.not.arrayContaining(['firefox-container-2']),
      );
    });
  });

  describe('expression', () => {
    it('should return unchanged expression if expression is not being updated.', () => {
      const newState = expression(
        { ...mockExpression },
        addExpression({
          ...mockExpression,
          expression: 'unchanged',
        }),
      );
      expect(newState).toEqual(mockExpression);
    });
    it('should use default empty expression if none was given', () => {
      const newState = expression(undefined, addExpression({ ...mockExpression }));
      expect(newState).toEqual({
        ...mockExpression,
        id: '1',
        cookieNames: [],
      });
    });
    it('should update the expression with new cookieNames list if given', () => {
      const newState = expression(
        { ...mockExpression },
        updateExpression({
          ...mockExpression,
          cookieNames: ['test'],
        }),
      );
      expect(newState).toEqual(
        expect.objectContaining({ cookieNames: ['test'] }),
      );
    });
    it('should update the expression with default listType if none was given', () => {
      const newState = expression(
        { ...mockExpression },
        updateExpression({
          ...mockExpression,
          listType: undefined as unknown as ListType,
        }),
      );
      expect(newState).toEqual(
        expect.objectContaining({ listType: ListType.WHITE }),
      );
    });
  });

  describe('expressions', () => {
    const state = [mockExpression];
    it('should return empty if Reset All was triggered.', () => {
      const newState = expressions(state, resetAll());
      expect(newState.length).toBe(0);
    });
    it('should return unchanged if action type is not matched', () => {
      const newState = expressions(state, handleStartUp());
      expect(newState).toEqual(state);
    });
    it('should be an empty array if no cleanSiteData entries were provided', () => {
      const newState = expressions([], addExpression({
        ...mockExpression,
      }));
      expect(newState[0]).toEqual(
        expect.objectContaining({ cleanSiteData: [] }),
      );
    });
    it('should be included in cleanSiteData if siteDataType entries were provided', () => {
      const newState = expressions([], addExpression({
        ...mockExpression,
        cleanSiteData: [SiteDataType.LOCALSTORAGE, SiteDataType.INDEXEDDB],
      }));
      expect(newState[0]).toEqual(
        expect.objectContaining({
          cleanSiteData: expect.arrayContaining([
            SiteDataType.INDEXEDDB,
            SiteDataType.LOCALSTORAGE,
          ]),
        }),
      );
    });
  });

  describe('cache', () => {
    const state = {
      browserDetect: BrowserName.Firefox,
      browserVersion: 123,
    };
    it('should return empty object only if RESET_ALL was triggered', () => {
      const newState = cache(state, resetAll());
      expect(newState).toEqual({});
    });
  });

  describe('settings', () => {
    it('should update settings accordingly', () => {
      const newState = settings(initialSettings, updateSetting({
        name: SettingID.ACTIVE_MODE,
        value: true,
      }));
      expect(newState[SettingID.ACTIVE_MODE]).toEqual(
        expect.objectContaining({
          name: SettingID.ACTIVE_MODE,
          value: true,
        }),
      );
    });
    it('should reset settings to initial via RESET_ALL', () => {
      const newState = settings(
        {
          ...initialSettings,
          [SettingID.ACTIVE_MODE]: {
            name: SettingID.ACTIVE_MODE,
            value: true,
          },
        },
        resetAll(),
      );
      expect(newState).toStrictEqual(initialSettings);
    });
    it('should reset settings to initial via RESET_SETTINGS', () => {
      const newState = settings(
        {
          ...initialSettings,
          [SettingID.ACTIVE_MODE]: {
            name: SettingID.ACTIVE_MODE,
            value: true,
          },
        },
        resetSettings(),
      );
      expect(newState).toStrictEqual(initialSettings);
    });
  });
});
