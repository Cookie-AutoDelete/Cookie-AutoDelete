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
import * as CleanupService from '../../src/services/CleanupService';
import ContextMenuEvents from '../../src/services/ContextMenuEvents';
import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';

jest.requireActual('../../src/redux/Actions');
const spyActions: JestSpyObject = global.generateSpies(Actions);

jest.requireMock('../../src/services/CleanupService');
const spyCleanupService: JestSpyObject = global.generateSpies(CleanupService);

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

class TestContextMenuEvents extends ContextMenuEvents {
  public static getIsInitialized() {
    return ContextMenuEvents.isInitialized;
  }
  public static setIsInitialized(value: boolean) {
    ContextMenuEvents.isInitialized = value;
  }
  public static spyAddNewExpression = jest.spyOn(
    ContextMenuEvents,
    'addNewExpression' as never,
  );
}

const sampleTab: browser.tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-default',
  discarded: false,
  hidden: false,
  highlighted: false,
  incognito: false,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  selected: true,
  url: 'https://www.example.com',
  windowId: 1,
};

const defaultOnClickData: browser.contextMenus.OnClickData = {
  editable: false,
  menuItemId: 'replaceMe',
  modifiers: [],
};

const sampleClickLink: browser.contextMenus.OnClickData = {
  ...defaultOnClickData,
  linkUrl: 'https://link.cad',
};

const sampleClickPage: browser.contextMenus.OnClickData = {
  ...defaultOnClickData,
  pageUrl: 'https://page.cad',
};

const sampleClickText: browser.contextMenus.OnClickData = {
  ...defaultOnClickData,
  selectionText: 'selectedText',
};

const sampleClickTextMultiple: browser.contextMenus.OnClickData = {
  ...defaultOnClickData,
  selectionText: 'selectedText, MultipleText, ThirdText',
};

describe('ContextMenuEvents', () => {
  beforeAll(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' } as never);
  });
  afterEach(() => {
    TestStore.resetSetting();
  });

  describe('menuInit', () => {
    it('should do nothing if browser.contextMenus do not exist', () => {
      // Override setup of browser.contextMenus
      const jestContextMenus = global.browser.contextMenus;
      global.browser.contextMenus = undefined;
      ContextMenuEvents.menuInit();
      expect(spyLib.getSetting).not.toHaveBeenCalled();
      // Restore browser.contextMenus for future tests
      global.browser.contextMenus = jestContextMenus;
    });
    it('should do nothing if contextMenus setting is disabled', () => {
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, false);
      ContextMenuEvents.menuInit();
      expect(global.browser.contextMenus.create).not.toHaveBeenCalled();
    });
    it('should create its menus contextMenus setting is enabled and none was created beforehand', () => {
      when(global.browser.contextMenus.onClicked.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(false);
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, true);
      ContextMenuEvents.menuInit();
      expect(TestContextMenuEvents.getIsInitialized()).toBe(true);
      expect(global.browser.contextMenus.create).toHaveBeenCalledTimes(35);
      expect(
        global.browser.contextMenus.onClicked.addListener,
      ).toHaveBeenCalledTimes(1);
    });
    it('should not add another listener if one was already added', () => {
      when(global.browser.contextMenus.onClicked.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(true);
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, true);
      TestContextMenuEvents.setIsInitialized(false);
      ContextMenuEvents.menuInit();
      expect(
        global.browser.contextMenus.onClicked.addListener,
      ).not.toHaveBeenCalled();
    });
    it('should do nothing if contextMenus setting is enabled and menus were already created', () => {
      TestStore.changeSetting(SettingID.CONTEXT_MENUS, true);
      TestContextMenuEvents.setIsInitialized(true);
      ContextMenuEvents.menuInit();
      expect(global.browser.contextMenus.create).not.toHaveBeenCalled();
    });
  });

  describe('menuClear', () => {
    it('should work', async () => {
      TestContextMenuEvents.setIsInitialized(true);
      await ContextMenuEvents.menuClear();
      expect(
        global.browser.contextMenus.onClicked.removeListener,
      ).toHaveBeenCalledTimes(1);
      expect(TestContextMenuEvents.getIsInitialized()).toBe(false);
    });
  });

  describe('updateMenuItemCheckbox', () => {
    it('should work', () => {
      when(global.browser.contextMenus.update)
        .calledWith(expect.any(String), expect.any(Object))
        .mockResolvedValue(true as never);
      ContextMenuEvents.updateMenuItemCheckbox('test', true);
      expect(global.browser.contextMenus.update).toHaveBeenCalledTimes(1);
    });
  });

  // While the above test does also call onCreatedOrUpdated, we need a fail catch
  describe('onCreatedOrUpdated', () => {
    it('should show error if failed', () => {
      global.browser.runtime.lastError = 'testError';
      ContextMenuEvents.onCreatedOrUpdated();
      // The if statements both perform cadLog, so we need to check for the error one.
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('testError')).not.toBe(
        -1,
      );
      expect(spyLib.cadLog.mock.calls[0][0].type).toBe('error');
      global.browser.runtime.lastError = undefined;
    });
  });

  // This test block will also consume coverage for addNewExpression
  describe('onContextMenuClicked - aka the big switch statement', () => {
    beforeAll(() => {
      // Required otherwise NodeJS will complain about unhandledPromiseRejects
      when(spyCleanupService.cleanCookiesOperation)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockResolvedValue(undefined as never);
      when(spyCleanupService.clearCookiesForThisDomain)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockResolvedValue(true as never);
      when(spyCleanupService.clearLocalStorageForThisDomain)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockResolvedValue(true as never);
    });
    it('should show warning through cadLog if menuId given is unknown', () => {
      ContextMenuEvents.onContextMenuClicked(defaultOnClickData, sampleTab);
      expect(
        spyLib.cadLog.mock.calls[1][0].msg.indexOf('unknown menu id'),
      ).not.toBe(-1);
      expect(spyLib.cadLog.mock.calls[1][0].type).toBe('warn');
    });
    // Manual Clean Menu
    it('Trigger Normal Clean', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.CLEAN,
        },
        sampleTab,
      );
      expect(spyCleanupService.cleanCookiesOperation).toHaveBeenCalledWith(
        expect.any(Object),
        {
          greyCleanup: false,
          ignoreOpenTabs: false,
        },
      );
    });
    it('Trigger Clean, Include Open Tabs', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.CLEAN_OPEN,
        },
        sampleTab,
      );
      expect(spyCleanupService.cleanCookiesOperation).toHaveBeenCalledWith(
        expect.any(Object),
        {
          greyCleanup: false,
          ignoreOpenTabs: true,
        },
      );
    });
    it('Trigger Clear All Site Data For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}All`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearSiteDataForThisDomain).toHaveBeenCalledWith(
        expect.any(Object),
        'All',
        expect.any(String),
      );
    });
    it('Clear Site Data For This Domain was clicked, but hostname was blank', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}All`,
        },
        { ...sampleTab, url: 'about:blank' },
      );
      expect(
        spyCleanupService.clearSiteDataForThisDomain,
      ).not.toHaveBeenCalled();
    });
    it('Trigger Clear Cache For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}Cache`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearSiteDataForThisDomain).toHaveBeenCalledWith(
        expect.any(Object),
        'Cache',
        expect.any(String),
      );
    });
    it('Trigger Clear Cookies For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}Cookies`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearCookiesForThisDomain).toHaveBeenCalled();
    });
    it('Trigger Clear IndexedDB For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}IndexedDB`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearSiteDataForThisDomain).toHaveBeenCalledWith(
        expect.any(Object),
        'IndexedDB',
        expect.any(String),
      );
    });
    it('Trigger Clear LocalStorage For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}LocalStorage`,
        },
        sampleTab,
      );
      expect(
        spyCleanupService.clearLocalStorageForThisDomain,
      ).toHaveBeenCalledTimes(1);
    });
    it('Trigger Clear Plugin Data For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}PluginData`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearSiteDataForThisDomain).toHaveBeenCalledWith(
        expect.any(Object),
        'PluginData',
        expect.any(String),
      );
    });
    it('Trigger Clear Service Workers For This Domain', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}ServiceWorkers`,
        },
        sampleTab,
      );
      expect(spyCleanupService.clearSiteDataForThisDomain).toHaveBeenCalledWith(
        expect.any(Object),
        'ServiceWorkers',
        expect.any(String),
      );
    });
    it('Unknown Site Data Type was pass in.  Extreme case.', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: `${ContextMenuEvents.MenuID.MANUAL_CLEAN_SITEDATA}Test`,
        },
        sampleTab,
      );
      expect(
        spyCleanupService.clearSiteDataForThisDomain,
      ).not.toHaveBeenCalled();
    });
    // Add Expression via link
    it('Trigger LINK_ADD_GREY_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickLink,
          menuItemId: ContextMenuEvents.MenuID.LINK_ADD_GREY_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'link.cad',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger LINK_ADD_WHITE_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickLink,
          menuItemId: ContextMenuEvents.MenuID.LINK_ADD_WHITE_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'link.cad',
        ListType.WHITE,
        'firefox-default',
      );
    });
    it('Trigger LINK_ADD_GREY_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickLink,
          menuItemId: ContextMenuEvents.MenuID.LINK_ADD_GREY_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.link.cad',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger LINK_ADD_WHITE_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickLink,
          menuItemId: ContextMenuEvents.MenuID.LINK_ADD_WHITE_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.link.cad',
        ListType.WHITE,
        'firefox-default',
      );
    });
    // Add Expression via Page
    it('Trigger PAGE_ADD_GREY_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickPage,
          menuItemId: ContextMenuEvents.MenuID.PAGE_ADD_GREY_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'page.cad',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger PAGE_ADD_WHITE_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickPage,
          menuItemId: ContextMenuEvents.MenuID.PAGE_ADD_WHITE_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'page.cad',
        ListType.WHITE,
        'firefox-default',
      );
    });
    it('Trigger PAGE_ADD_GREY_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickPage,
          menuItemId: ContextMenuEvents.MenuID.PAGE_ADD_GREY_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.page.cad',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger PAGE_ADD_WHITE_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickPage,
          menuItemId: ContextMenuEvents.MenuID.PAGE_ADD_WHITE_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.page.cad',
        ListType.WHITE,
        'firefox-default',
      );
    });
    // Add Expression via Selected Text
    it('Trigger SELECT_ADD_GREY_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_GREY_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'selectedText',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger SELECT_ADD_GREY_DOMAIN and contextualIdentities was enabled', () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
      TestStore.addCache({
        key: 'firefox-container-1',
        value: 'Personal',
      });
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_GREY_DOMAIN,
        },
        { ...sampleTab, cookieStoreId: 'firefox-container-1' },
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'selectedText',
        ListType.GREY,
        'firefox-container-1',
      );
    });
    it('Trigger SELECT_ADD_GREY_DOMAIN and contextualIdentities was enabled with no matching container', () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_GREY_DOMAIN,
        },
        { ...sampleTab, cookieStoreId: 'firefox-container-2' },
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'selectedText',
        ListType.GREY,
        'firefox-container-2',
      );
    });
    it('Trigger SELECT_ADD_WHITE_DOMAIN', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_DOMAIN,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        'selectedText',
        ListType.WHITE,
        'firefox-default',
      );
    });
    it('Trigger SELECT_ADD_GREY_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_GREY_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.selectedText',
        ListType.GREY,
        'firefox-default',
      );
    });
    it('Trigger SELECT_ADD_WHITE_SUBS', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.selectedText',
        ListType.WHITE,
        'firefox-default',
      );
    });
    it('Trigger SELECT_ADD_WHITE_SUBS with multiple comma-separated values', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickTextMultiple,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_SUBS,
        },
        sampleTab,
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledTimes(
        3,
      );
    });
    it('Trigger SELECT_ADD_WHITE_SUBS with whitespaces only', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_SUBS,
          selectionText: '  ',
        },
        sampleTab,
      );
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'addNewExpressionNotificationFailed',
      );
      expect(spyActions.addExpressionUI).not.toHaveBeenCalled();
    });
    it('Trigger SELECT_ADD_WHITE_SUBS with undefined cookieStoreId (Chrome)', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...sampleClickText,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_SUBS,
        },
        { ...sampleTab, cookieStoreId: undefined },
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.selectedText',
        ListType.WHITE,
        '',
      );
    });
    it('Trigger SELECT_ADD_WHITE_SUBS with undefined inputs to addNewExpression', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          selectionText: undefined,
          menuItemId: ContextMenuEvents.MenuID.SELECT_ADD_WHITE_SUBS,
        },
        { ...sampleTab, cookieStoreId: undefined },
      );
      expect(TestContextMenuEvents.spyAddNewExpression).toHaveBeenCalledWith(
        '*.',
        ListType.WHITE,
        '',
      );
    });
    it('Trigger Toggle of ACTIVE_MODE', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.ACTIVE_MODE,
          checked: true,
          wasChecked: false,
        },
        sampleTab,
      );
      expect(spyActions.updateSetting).toHaveBeenCalledWith({
        name: SettingID.ACTIVE_MODE,
        value: true,
      });
    });
    it('Trigger ACTIVE_MODE and both checked and wasChecked was same value (no updateSetting call)', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.ACTIVE_MODE,
          checked: true,
          wasChecked: true,
        },
        sampleTab,
      );
      expect(spyActions.updateSetting).not.toHaveBeenCalled();
    });
    it('Trigger Open Settings', () => {
      ContextMenuEvents.onContextMenuClicked(
        {
          ...defaultOnClickData,
          menuItemId: ContextMenuEvents.MenuID.SETTINGS,
        },
        sampleTab,
      );
      expect(global.browser.tabs.create).toHaveBeenCalledTimes(1);
    });
  });
});
