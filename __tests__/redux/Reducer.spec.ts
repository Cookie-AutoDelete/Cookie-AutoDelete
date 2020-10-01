import {
  activityLog,
  cache,
  cookieDeletedCounterSession,
  cookieDeletedCounterTotal,
  expression,
  expressions,
  lists,
  settings,
} from '../../src/redux/Reducers';
import { ReduxConstants } from '../../src/typings/ReduxConstants';
import { initialState } from '../../src/redux/State';

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
      const result = activityLog(state, {
        payload: log1,
        type: ReduxConstants.REMOVE_ACTIVITY_LOG,
      });
      expect(result.length).toBe(0);
    });

    it('should be removed when clearing logs', () => {
      const result = activityLog(state, {
        type: ReduxConstants.CLEAR_ACTIVITY_LOG,
      });
      expect(result).toHaveLength(0);
    });

    it('should be added to the front', () => {
      const result = activityLog(state, {
        payload: log2,
        type: ReduxConstants.ADD_ACTIVITY_LOG,
      });
      expect(result).toEqual([log2, log1]);
    });

    it('should not be added because no storeIds', () => {
      const result = activityLog(state, {
        payload: {
          ...log2,
          storeIds: {},
        },
        type: ReduxConstants.ADD_ACTIVITY_LOG,
      });
      expect(result).toEqual([log1]);
    });
    it('should return empty array on RESET_ALL', () => {
      const result = activityLog(state, { type: ReduxConstants.RESET_ALL });
      expect(result).toHaveLength(0);
    });
  });
  describe('cookieDeletedCounterTotal', () => {
    const state = 5;

    it('should return 0 through RESET_COOKIE_DELETED_COUNTER', () => {
      const newState = cookieDeletedCounterTotal(state, {
        type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(0);
    });
    it('should return 0 through RESET_ALL', () => {
      const newState = cookieDeletedCounterTotal(state, {
        type: ReduxConstants.RESET_ALL,
      });
      expect(newState).toBe(0);
    });
    it('should return 6', () => {
      const newState = cookieDeletedCounterTotal(state, {
        type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(6);
    });
    it('should return 10', () => {
      const newState = cookieDeletedCounterTotal(state, {
        payload: 5,
        type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(10);
    });
    it('should return 1 if nothing was given', () => {
      const newState = cookieDeletedCounterTotal(undefined, {
        type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(1);
    });
  });

  describe('cookieDeletedCounterSession', () => {
    const state = 5;

    it('should return 0 on RESET_COOKIE_DELETED_COUNTER', () => {
      const newState = cookieDeletedCounterSession(state, {
        type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(0);
    });
    it('should return 0 on RESET_ALL', () => {
      const newState = cookieDeletedCounterSession(state, {
        type: ReduxConstants.RESET_ALL,
      });
      expect(newState).toBe(0);
    });
    it('should return 0 on start up', () => {
      const newState = cookieDeletedCounterSession(state, {
        type: ReduxConstants.ON_STARTUP,
      });
      expect(newState).toBe(0);
    });
    it('should return 6', () => {
      const newState = cookieDeletedCounterSession(state, {
        type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(6);
    });
    it('should return 10', () => {
      const newState = cookieDeletedCounterSession(state, {
        payload: 5,
        type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
      });
      expect(newState).toBe(10);
    });
  });

  describe('lists with no stuff', () => {
    const state = {};

    it('should return google.com', () => {
      const newState = lists(state, {
        payload: {
          ...mockExpression,
          expression: 'google.com',
          listType: ListType.GREY,
        },
        type: ReduxConstants.ADD_EXPRESSION,
      });
      const firstExpression = newState.default[0];
      expect(firstExpression).toHaveProperty('expression', 'google.com');
      expect(firstExpression).toHaveProperty('listType', ListType.GREY);
      expect(firstExpression).toHaveProperty('id');
    });

    it('should return youtube.com for firefox_container_2', () => {
      const newState = lists(state, {
        payload: {
          expression: 'youtube.com',
          listType: ListType.GREY,
          storeId: 'firefox_container_2',
        },
        type: ReduxConstants.ADD_EXPRESSION,
      });
      const firstExpression = newState.firefox_container_2[0];
      expect(firstExpression).toHaveProperty('expression', 'youtube.com');
      expect(firstExpression).toHaveProperty('listType', ListType.GREY);
      expect(firstExpression).toHaveProperty('id');
    });

    it('should return google.com with a default listType of WHITE', () => {
      const newState = lists(state, {
        payload: {
          ...mockExpression,
          expression: 'google.com',
        },
        type: ReduxConstants.ADD_EXPRESSION,
      });
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
        { ...state },
        {
          payload: {
            ...mockExpression,
            expression: 'youtube.com',
            listType: ListType.WHITE,
          },
          type: ReduxConstants.ADD_EXPRESSION,
        },
      );
      const newExpression = newState.default[1];
      expect(newExpression).toHaveProperty('expression', 'youtube.com');
      expect(newExpression).toHaveProperty('listType', ListType.WHITE);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return github.com on firefox-container-1', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            expression: 'github.com',
            listType: ListType.GREY,
            storeId: 'firefox-container-1',
          },
          type: ReduxConstants.ADD_EXPRESSION,
        },
      );
      const newExpression = newState['firefox-container-1'][2];
      expect(newExpression).toHaveProperty('expression', 'github.com');
      expect(newExpression).toHaveProperty('listType', ListType.GREY);
      expect(newExpression).toHaveProperty('id');
    });
    it('should return not return messenger.com on default', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            id: 'SyZbDbC1dW',
            storeId: 'default',
          },
          type: ReduxConstants.REMOVE_EXPRESSION,
        },
      );
      expect(newState.default).not.toEqual(
        expect.arrayContaining(state.default as any[]),
      );
    });

    it('should return github.com and GREY for updated expression on default', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            ...mockExpression,
            expression: 'github.com',
            id: 'SyZbDbC1dW',
            listType: ListType.GREY,
          },
          type: ReduxConstants.UPDATE_EXPRESSION,
        },
      );

      const newExpression = newState.default[1];
      expect(newExpression).toHaveProperty('expression', 'github.com');
      expect(newExpression).toHaveProperty('listType', ListType.GREY);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return google.com and WHITE for updated expression on firefox-container-1', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            expression: 'google.com',
            id: '123',
            listType: ListType.WHITE,
            storeId: 'firefox-container-1',
          },
          type: ReduxConstants.UPDATE_EXPRESSION,
        },
      );

      const newExpression = newState['firefox-container-1'][0];
      expect(newExpression).toHaveProperty('expression', 'google.com');
      expect(newExpression).toHaveProperty('listType', ListType.WHITE);
      expect(newExpression).toHaveProperty('id');
    });

    it('should return an empty object if CLEAR_EXPRESSIONS was called.', () => {
      const newState = lists(state, {
        payload: {},
        type: ReduxConstants.CLEAR_EXPRESSIONS,
      });
      expect(newState).toEqual({});
    });

    it('should remove a single list if REMOVE_LIST was called.', () => {
      const newState = lists(state, {
        payload: 'firefox-container-1',
        type: ReduxConstants.REMOVE_LIST,
      });
      expect(Object.keys(newState)).toEqual(
        expect.not.arrayContaining(['firefox-container-1']),
      );
    });

    it('should not remove anything if REMOVE_LIST was called but with invalid id.', () => {
      const newState = lists(state, {
        payload: 'firefox-container-99',
        type: ReduxConstants.REMOVE_LIST,
      });
      expect(newState).toEqual(state);
    });

    it('should return empty object if REMOVE_LIST was called with empty state/list.', () => {
      const newState = lists(
        {},
        {
          payload: 'firefox-container-9',
          type: ReduxConstants.REMOVE_LIST,
        },
      );
      expect(newState).toEqual({});
    });

    it('should return empty object if REMOVE_LIST removed last list.', () => {
      const newState = lists(
        { default: state['default'] },
        {
          payload: 'default',
          type: ReduxConstants.REMOVE_LIST,
        },
      );
      expect(newState).toEqual({});
    });

    it('should remove list if last expression entry was removed.', () => {
      const newState = lists(state, {
        payload: state['firefox-container-2'][0],
        type: ReduxConstants.REMOVE_EXPRESSION,
      });
      expect(Object.keys(newState)).toEqual(
        expect.not.arrayContaining(['firefox-container-2']),
      );
    });
  });

  describe('expression', () => {
    it('should return unchanged expression if expression is not being updated.', () => {
      const newState = expression(
        { ...mockExpression },
        {
          payload: {
            ...mockExpression,
            expression: 'unchanged',
          },
          type: ReduxConstants.ADD_EXPRESSION,
        },
      );
      expect(newState).toEqual(mockExpression);
    });
    it('should use default empty expression if none was given', () => {
      const newState = expression(undefined, {
        payload: { ...mockExpression },
        type: ReduxConstants.ADD_EXPRESSION,
      });
      expect(newState).toEqual({
        ...mockExpression,
        id: '1',
        cookieNames: [],
      });
    });
    it('should update the expression with new cookieNames list if given', () => {
      const newState = expression(
        { ...mockExpression },
        {
          payload: {
            ...mockExpression,
            cookieNames: ['test'],
          },
          type: ReduxConstants.UPDATE_EXPRESSION,
        },
      );
      expect(newState).toEqual(
        expect.objectContaining({ cookieNames: ['test'] }),
      );
    });
    it('should update the expression with default listType if none was given', () => {
      const newState = expression(
        { ...mockExpression },
        {
          payload: {
            ...mockExpression,
            listType: (undefined as unknown) as ListType,
          },
          type: ReduxConstants.UPDATE_EXPRESSION,
        },
      );
      expect(newState).toEqual(
        expect.objectContaining({ listType: ListType.WHITE }),
      );
    });
  });

  describe('expressions', () => {
    const state = [mockExpression];
    it('should return empty if Reset All was triggered.', () => {
      const newState = expressions(state, {
        type: ReduxConstants.RESET_ALL,
      });
      expect(newState.length).toBe(0);
    });
    it('should return unchanged if action type is not matched', () => {
      const newState = expressions(state, {
        type: ReduxConstants.ON_STARTUP,
      });
      expect(newState).toEqual(state);
    });
    it('should be an empty array if no cleanSiteData entries were provided', () => {
      const newState = expressions([], {
        payload: {
          ...mockExpression,
        },
        type: ReduxConstants.ADD_EXPRESSION,
      });
      expect(newState[0]).toEqual(
        expect.objectContaining({ cleanSiteData: [] }),
      );
    });
    it('should be included in cleanSiteData if siteDataType entries were provided', () => {
      const newState = expressions([], {
        payload: {
          ...mockExpression,
          cleanSiteData: [SiteDataType.LOCALSTORAGE, SiteDataType.INDEXEDDB],
        },
        type: ReduxConstants.ADD_EXPRESSION,
      });
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
      browserDetect: browserName.Firefox,
      browserVersion: 123,
    };
    it('should return empty object only if RESET_ALL was triggered', () => {
      const newState = cache(state, {
        type: ReduxConstants.RESET_ALL,
      });
      expect(newState).toEqual({});
    });
  });

  describe('settings', () => {
    it('should update settings accordingly', () => {
      const newState = settings(initialState.settings, {
        payload: {
          name: SettingID.ACTIVE_MODE,
          value: true,
        },
        type: ReduxConstants.UPDATE_SETTING,
      });
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
          ...initialState.settings,
          [SettingID.ACTIVE_MODE]: {
            name: SettingID.ACTIVE_MODE,
            value: true,
          },
        },
        {
          type: ReduxConstants.RESET_ALL,
        },
      );
      expect(newState).toStrictEqual(initialState.settings);
    });
    it('should reset settings to initial via RESET_SETTINGS', () => {
      const newState = settings(
        {
          ...initialState.settings,
          [SettingID.ACTIVE_MODE]: {
            name: SettingID.ACTIVE_MODE,
            value: true,
          },
        },
        {
          type: ReduxConstants.RESET_SETTINGS,
        },
      );
      expect(newState).toStrictEqual(initialState.settings);
    });
  });
});
