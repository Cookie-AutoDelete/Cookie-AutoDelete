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
import { initialState } from '../../src/redux/State';
// tslint:disable-next-line: import-name
import createStore from '../../src/redux/Store';
import * as BrowserActionService from '../../src/services/BrowserActionService';
import ContextualIdentitiesEvents from '../../src/services/ContextualIdentitiesEvents';
import SettingService from '../../src/services/SettingService';
import StoreUser from '../../src/services/StoreUser';
import { ReduxAction } from '../../src/typings/ReduxConstants';
import { resetSettings, updateSetting } from '../../src/redux/Actions';
import ContextMenuEvents from '../../src/services/ContextMenuEvents';

const spyBrowserActions: JestSpyObject = global.generateSpies(
  BrowserActionService,
);

jest.requireActual('../../src/services/ContextMenuEvents');
class TestContextMenus extends ContextMenuEvents {
  public static isInit(): boolean {
    return ContextMenuEvents.isInitialized;
  }
}

jest.requireActual('../../src/services/ContextualIdentitiesEvents');
class TestContextualIdentities extends ContextualIdentitiesEvents {
  public static isInit(): boolean {
    return ContextualIdentitiesEvents.isInitialized;
  }
}

jest.requireActual('../../src/services/StoreUser');
const store: Store<State, ReduxAction> = createStore(initialState);
StoreUser.init(store);

class TestStore extends StoreUser {
  public static changeSetting(
    name: SettingID,
    value: string | boolean | number,
  ) {
    StoreUser.store.dispatch(updateSetting({ name, value }));
  }

  public static resetSetting() {
    StoreUser.store.dispatch(resetSettings());
  }
}

class TestSettingService extends SettingService {
  public static getIsInitialized() {
    return SettingService.isInitialized;
  }

  public static getTestCurrent() {
    return SettingService.current;
  }

  public static setIsInitialized(value: boolean) {
    SettingService.isInitialized = value;
  }
}

const defaultTab: browser.tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-container-5',
  hidden: false,
  highlighted: false,
  incognito: false,
  id: 1,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  selected: true,
  url: 'https://domain.com',
  windowId: 1,
};

describe('SettingService', () => {
  beforeEach(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' });
    when(global.browser.contextualIdentities.query)
      .calledWith({})
      .mockResolvedValue([] as never);
    when(global.browser.tabs.query)
      .calledWith({ windowType: 'normal' })
      .mockResolvedValue([] as never);
    when(global.browser.contextMenus.update)
      .calledWith(expect.anything(), expect.anything())
      .mockResolvedValue(null as never);
  });

  afterEach(() => {
    TestStore.resetSetting();
  });

  describe('init()', () => {
    it('should fetch settings from store state', () => {
      SettingService.init();
      expect(TestSettingService.getIsInitialized()).toEqual(true);
      expect(TestSettingService.getTestCurrent()).toEqual(
        initialState.settings,
      );
    });
  });
  describe('onSettingsChange()', () => {
    when(global.browser.tabs.query)
      .calledWith({ active: true, windowType: 'normal' })
      .mockResolvedValue([
        defaultTab,
        { ...defaultTab, url: 'https://example.com' },
      ] as never);
    it('should init if not yet initialized', async () => {
      TestSettingService.setIsInitialized(false);
      expect(TestSettingService.getIsInitialized()).toEqual(false);
      await SettingService.onSettingsChange();
      expect(TestSettingService.getIsInitialized()).toEqual(true);
    });
    it('should initialize ContextualIdentities if recently enabled', async () => {
      expect(TestContextualIdentities.isInit()).toEqual(false);
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
      await SettingService.onSettingsChange();
      expect(TestContextualIdentities.isInit()).toEqual(true);
    });
    it('should de-init ContextualIdentities if recently disabled', async () => {
      expect(TestContextualIdentities.isInit()).toEqual(true);
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, false);
      await SettingService.onSettingsChange();
      expect(TestContextualIdentities.isInit()).toEqual(false);
    });
    it('should not clean localstorage if migrating from old setting', async () => {
      TestStore.changeSetting(SettingID.CLEANUP_LOCALSTORAGE_OLD, true);
      await SettingService.onSettingsChange();
      TestStore.changeSetting(SettingID.CLEANUP_LOCALSTORAGE, true);
      await SettingService.onSettingsChange();
      expect(global.browser.browsingData.remove).not.toHaveBeenCalled();
    });
    it('should clean that site data if it was recently enabled', async () => {
      TestStore.changeSetting(SettingID.CLEANUP_CACHE, true);
      await SettingService.onSettingsChange();
      expect(global.browser.browsingData.remove).toHaveBeenCalledTimes(1);
    });
    it('should enable global icon if active mode was recently enabled', async () => {
      TestStore.changeSetting(SettingID.ACTIVE_MODE, true);
      await SettingService.onSettingsChange();
      expect(spyBrowserActions.setGlobalIcon).toHaveBeenCalledWith(true);
    });
    it('should make global icon greyscale and clear alarms if active mode was recently disabled', async () => {
      TestStore.changeSetting(SettingID.ACTIVE_MODE, false);
      await SettingService.onSettingsChange();
      expect(global.browser.alarms.clear).toHaveBeenCalledTimes(1);
      expect(spyBrowserActions.setGlobalIcon).toHaveBeenCalledWith(false);
    });
    it('should clear contextMenus if recently disabled', async () => {
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, false);
      await SettingService.onSettingsChange();
      expect(TestContextMenus.isInit()).toEqual(false);
    });
    it('should init contextMenu items if recently enabled', async () => {
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, true);
      await SettingService.onSettingsChange();
      expect(TestContextMenus.isInit()).toEqual(true);
    });
  });
});
