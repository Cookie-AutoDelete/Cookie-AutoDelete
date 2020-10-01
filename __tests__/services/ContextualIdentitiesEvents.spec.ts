/**
 * Copyright (c) 2020 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { when } from 'jest-when';
import { Store } from 'redux';

import * as Actions from '../../src/redux/Actions';
import { initialState } from '../../src/redux/State';
// tslint:disable-next-line: import-name
import createStore from '../../src/redux/Store';
import { ReduxAction, ReduxConstants } from '../../src/typings/ReduxConstants';
import ContextualIdentitiesEvents from '../../src/services/ContextualIdentitiesEvents';
import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';

jest.requireActual('../../src/services/Libs');
const spyLib: JestSpyObject = global.generateSpies(Lib);

const store: Store<State, ReduxAction> = createStore(initialState);
StoreUser.init(store);

class TestStore extends StoreUser {
  public static addCache(payload: any) {
    StoreUser.store.dispatch({
      payload,
      type: ReduxConstants.ADD_CACHE,
    });
  }
  public static dispatch(payload: any, type: ReduxConstants) {
    StoreUser.store.dispatch({
      payload,
      type,
    });
  }

  public static getCacheValue(key: string) {
    return StoreUser.store.getState().cache[key];
  }

  public static getLists() {
    return StoreUser.store.getState().lists;
  }

  public static changeSetting(
    name: SettingID,
    value: string | boolean | number,
  ) {
    StoreUser.store.dispatch(Actions.updateSetting({ name, value }));
  }

  public static resetSetting() {
    StoreUser.store.dispatch(Actions.resetSettings());
  }
}

const wildCardWhiteListGoogle: Expression = {
  expression: '*.google.com',
  id: '1',
  listType: ListType.GREY,
  storeId: 'remove-container-1',
};

class TestContextualIdentitiesEvents extends ContextualIdentitiesEvents {
  public static getIsInitialized() {
    return ContextualIdentitiesEvents.isInitialized;
  }
  public static setIsInitialized(value: boolean) {
    ContextualIdentitiesEvents.isInitialized = value;
  }
}

const defaultContextualIdentity: browser.contextualIdentities.ContextualIdentity = {
  cookieStoreId: 'firefox-container-0',
  color: 'blue',
  icon: 'fingerprint',
  name: 'Testing Container',
};

describe('ContextualIdentitiesEvents', () => {
  beforeAll(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' } as never);
    when(global.browser.contextualIdentities.query)
      .calledWith({})
      .mockResolvedValue([
        defaultContextualIdentity,
        { ...defaultContextualIdentity, cookieStoreId: 'firefox-container-1' },
        { ...defaultContextualIdentity, cookieStoreId: 'firefox-container-99' },
      ] as never);
  });
  afterEach(() => {
    TestStore.resetSetting();
  });

  describe('init', () => {
    it('should do nothing if browser.contextualIdentities do not exist', () => {
      // Override setup of browser.contextualIdentities
      const jestContextualIdentities = global.browser.contextualIdentities;
      global.browser.contextualIdentities = undefined;
      ContextualIdentitiesEvents.init();
      expect(spyLib.getSetting).not.toHaveBeenCalled();
      // Restore browser.contextualIdentities for future tests
      global.browser.contextualIdentities = jestContextualIdentities;
    });
    it('should do nothing if contextualIdentities setting is false/disabled', () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, false);
      ContextualIdentitiesEvents.init();
      expect(TestContextualIdentitiesEvents.getIsInitialized()).toEqual(false);
    });
    it('should populate cache with existing container maps and add listeners.', async () => {
      when(global.browser.contextualIdentities.onCreated.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(false);
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
      await ContextualIdentitiesEvents.init();
      expect(TestContextualIdentitiesEvents.getIsInitialized()).toEqual(true);
      expect(spyLib.eventListenerActions).toHaveBeenCalledTimes(3);
    });
    it('should do nothing if contextualIdentities was already initialized', () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
      ContextualIdentitiesEvents.init();
      expect(spyLib.eventListenerActions).not.toHaveBeenCalled();
    });
  });

  describe('deInit()', () => {
    it('should do nothing if it was not initialized previously', async () => {
      TestContextualIdentitiesEvents.setIsInitialized(false);
      await ContextualIdentitiesEvents.deInit();
      expect(spyLib.eventListenerActions).not.toHaveBeenCalled();
    });
    it('should remove all listeners and existing containers in cache', async () => {
      TestStore.addCache({
        payload: {
          key: 'firefox-container-99',
          value: 'TestContainer',
        },
      });
      when(global.browser.contextualIdentities.onCreated.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(true);
      TestContextualIdentitiesEvents.setIsInitialized(true);
      await ContextualIdentitiesEvents.deInit();
      expect(spyLib.eventListenerActions).toHaveBeenCalledTimes(3);
      expect(TestContextualIdentitiesEvents.getIsInitialized()).toEqual(false);
      expect(TestStore.getCacheValue('firefox-container-99')).toBeUndefined();
    });
  });

  describe('onContainerCreated()', () => {
    it('should add the new container map into the cache', () => {
      ContextualIdentitiesEvents.onContainerCreated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'new-container-1',
        },
      });
      expect(TestStore.getCacheValue('new-container-1')).toEqual(
        'Testing Container',
      );
    });
  });

  describe('onContainerRemoved()', () => {
    it('should set undefined that cookieStoreId from cache', () => {
      TestStore.addCache({
        key: 'remove-container-1',
        value: 'AShortLivedContainer',
      });
      ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getCacheValue('remove-container-1')).toBeUndefined();
    });
    it('should not remove expression list if related setting is disabled', () => {
      TestStore.changeSetting(
        SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
        false,
      );
      TestStore.dispatch(
        wildCardWhiteListGoogle,
        ReduxConstants.ADD_EXPRESSION,
      );
      ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getLists()).toHaveProperty('remove-container-1');
    });
    it('should remove expression list if related setting is enabled', () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE, true);
      TestStore.dispatch(
        wildCardWhiteListGoogle,
        ReduxConstants.ADD_EXPRESSION,
      );
      ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getLists()).not.toHaveProperty('remove-container-1');
    });
  });

  describe('onContainerUpdated()', () => {
    it('should do nothing if for some reason the container updated was not in the cache', () => {
      ContextualIdentitiesEvents.onContainerUpdated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'non-existent-0',
        },
      });
      expect(TestStore.getCacheValue('non-existent-0')).toBeUndefined();
    });

    it('should update the container name accordingly', () => {
      TestStore.addCache({ key: 'container-01', value: 'oldValue' });
      ContextualIdentitiesEvents.onContainerUpdated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'container-01',
          name: 'newValue',
        },
      });
      expect(TestStore.getCacheValue('container-01')).toEqual('newValue');
    });
  });
});
