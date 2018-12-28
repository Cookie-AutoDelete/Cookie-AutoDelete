import { cookieDeletedCounterTotal, lists } from '../src/redux/Reducers';
import { ReduxConstants } from '../src/typings/ReduxConstants';

const mockExpression: Expression = {
  expression: '',
  listType: ListType.WHITE,
  storeId: 'default',
};

describe('Reducer', () => {
  describe('cookieDeletedCounterTotal', () => {
    const state = 5;

    it('should return 0', () => {
      const newState = cookieDeletedCounterTotal(state, {
        type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
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
      firefox_container_1: [
        {
          expression: 'messenger.com*',
          id: '456',
          listType: ListType.WHITE,
          storeId: 'firefox_container_1',
        },
        {
          expression: 'facebook.com*',
          id: '123',
          listType: ListType.GREY,
          storeId: 'firefox_container_1',
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

    it('should return github.com on firefox_container_1', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            expression: 'github.com',
            listType: ListType.GREY,
            storeId: 'firefox_container_1',
          },
          type: ReduxConstants.ADD_EXPRESSION,
        },
      );
      const newExpression = newState.firefox_container_1[2];
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

    it('should return google.com and WHITE for updated expression on firefox_container_1', () => {
      const newState = lists(
        { ...state },
        {
          payload: {
            expression: 'google.com',
            id: '123',
            listType: ListType.WHITE,
            storeId: 'firefox_container_1',
          },
          type: ReduxConstants.UPDATE_EXPRESSION,
        },
      );

      const newExpression = newState.firefox_container_1[0];
      expect(newExpression).toHaveProperty('expression', 'google.com');
      expect(newExpression).toHaveProperty('listType', ListType.WHITE);
      expect(newExpression).toHaveProperty('id');
    });
  });
});
