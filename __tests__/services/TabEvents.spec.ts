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

import { resetSettings, updateSetting } from '../../src/redux/Actions';
import { initialState } from '../../src/redux/State';
// tslint:disable-next-line: import-name
import createStore from '../../src/redux/Store';
import { ReduxAction, ReduxConstants } from '../../src/typings/ReduxConstants';
import AlarmEvents from '../../src/services/AlarmEvents';
import * as BrowserActionService from '../../src/services/BrowserActionService';
import * as Lib from '../../src/services/Libs';
import TabEvents from '../../src/services/TabEvents';
import StoreUser from '../../src/services/StoreUser';

jest.requireActual('../../src/services/AlarmEvents');
const spyAlarmEvents: JestSpyObject = global.generateSpies(AlarmEvents);
const spyBrowserActions: JestSpyObject = global.generateSpies(
  BrowserActionService,
);
jest.requireActual('../../src/services/Libs');
const spyLib: JestSpyObject = global.generateSpies(Lib);
jest.requireActual('../../src/services/TabEvents');
const spyTabEvents: JestSpyObject = global.generateSpies(TabEvents);

jest.requireActual('../../src/services/StoreUser');

jest.useFakeTimers();

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
    StoreUser.store.dispatch(updateSetting({ name, value }));
  }

  public static resetSetting() {
    StoreUser.store.dispatch(resetSettings());
  }
}

class TestTabEvents extends TabEvents {
  public static getTabToDomain() {
    return TabEvents.tabToDomain;
  }
  public static getOnTabUpdateDelay() {
    return TabEvents.onTabUpdateDelay;
  }
}

const sampleChangeInfo: browser.tabs.TabChangeInfo = {
  discarded: false,
  favIconUrl: 'sample',
  status: 'loading|complete',
  title: 'newTitle',
  url: 'sampleURL',
};

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

describe('TabEvents', () => {
  beforeAll(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' } as never);
    when(global.browser.cookies.getAll)
      .calledWith(expect.any(Object))
      .mockResolvedValue([] as never);
    // Required so the actual cleaning functions being awaited won't run.
    when(spyAlarmEvents.createActiveModeAlarm)
      .calledWith()
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.clearAllTimers();
    TestStore.resetSetting();
  });

  describe('getAllCookieActions', () => {
    beforeAll(() => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: '' })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'domain.com', storeId: 'firefox-default' })
        .mockResolvedValue([testCookie] as never);
    });

    const testCookie: browser.cookies.Cookie = {
      domain: 'domain.com',
      hostOnly: true,
      httpOnly: true,
      name: 'blah',
      path: '/',
      sameSite: 'no_restriction',
      secure: true,
      session: true,
      storeId: 'firefox-default',
      value: 'test value',
    };

    it('should do nothing if url is undefined', async () => {
      await TabEvents.getAllCookieActions({ ...sampleTab, url: undefined });
      expect(spyLib.getAllCookiesForDomain).not.toHaveBeenCalled();
    });

    it('should do nothing if url is empty string', async () => {
      await TabEvents.getAllCookieActions({ ...sampleTab, url: '' });
      expect(spyLib.getAllCookiesForDomain).not.toHaveBeenCalled();
    });

    it('should do nothing if url is an internal page', async () => {
      await TabEvents.getAllCookieActions({ ...sampleTab, url: 'about:home' });
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'chrome:newtab',
      });
      expect(spyLib.getAllCookiesForDomain).not.toHaveBeenCalled();
    });

    it('should do nothing if url is not valid', async () => {
      await TabEvents.getAllCookieActions({ ...sampleTab, url: 'bad' });
      expect(global.browser.cookies.getAll).not.toHaveBeenCalled();
    });

    it('should work on regular domains', async () => {
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://domain.com',
      });
      expect(spyBrowserActions.checkIfProtected.mock.calls[0][2]).toBe(1);
    });

    it('should create a cookie if clean cache was enabled and no CAD cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      TestStore.changeSetting(SettingID.CLEANUP_CACHE, true);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should create a cookie if clean indexedDB was enabled and no CAD cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      TestStore.changeSetting(SettingID.CLEANUP_INDEXEDDB, true);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should create a cookie if clean localStorage was enabled and no CAD cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      TestStore.changeSetting(SettingID.CLEANUP_LOCALSTORAGE, true);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should create a cookie if clean plugin data was enabled and no CAD cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      TestStore.changeSetting(SettingID.CLEANUP_PLUGIN_DATA, true);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should create a cookie if clean service workers was enabled and no CAD cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      TestStore.changeSetting(SettingID.CLEANUP_SERVICE_WORKERS, true);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should filter out CAD browsingDataCleanup cookie from total cookie count', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([
          { ...testCookie, name: Lib.CADCOOKIENAME },
        ] as never);
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(spyBrowserActions.checkIfProtected.mock.calls[0][2]).toBe(0);
    });

    it('should not show cookie count in non-existent icon in Firefox Android', async () => {
      TestStore.addCache({ key: 'platformOs', value: 'android' });
      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://domain.com',
      });
      expect(
        spyBrowserActions.showNumberOfCookiesInIcon,
      ).not.toHaveBeenCalled();
    });

    it('should create a cookie with firstPartyDomain if FPI is enabled', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ domain: '' })
        .mockResolvedValueOnce([] as never)
        .mockRejectedValue(new Error('firstPartyDomain') as never);
      TestStore.changeSetting(SettingID.CLEANUP_CACHE, true);
      TestStore.addCache({ key: 'browserDetect', value: browserName.Firefox });

      await TabEvents.getAllCookieActions({
        ...sampleTab,
        url: 'http://cookie.net',
      });
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
      expect(global.browser.cookies.set.mock.calls[0][0]).toHaveProperty(
        'firstPartyDomain',
      );
    });
  });

  describe('onTabDiscarded', () => {
    it('should do nothing if clean discarded tabs setting is not enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, false);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyLib.createPartialTabInfo).not.toHaveBeenCalled();
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should do nothing if the tab that was updated is not discarded, even if discardedCleanup was true', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger cleaning if clean discarded tabs is enabled and changeInfo was discarded', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TabEvents.onTabDiscarded(
        0,
        { ...sampleChangeInfo, discarded: true },
        sampleTab,
      );
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should sanitize favIconUrl if debug was enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      TabEvents.onTabDiscarded(0, { ...sampleChangeInfo }, sampleTab);
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe(
        '***',
      );
    });
  });

  describe('onTabUpdate', () => {
    beforeAll(() => {
      when(spyTabEvents.getAllCookieActions)
        .calledWith()
        .mockResolvedValue(undefined as any);
    });
    afterAll(() => {
      spyTabEvents.getAllCookieActions.mockRestore();
    });

    it('should do nothing if tab status is not "complete"', () => {
      TabEvents.onTabUpdate(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'loading',
      });
      expect(spyTabEvents.getAllCookieActions).not.toHaveBeenCalled();
    });

    it('should trigger getAllCookieActions', () => {
      TabEvents.onTabUpdate(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      jest.runAllTimers();
      expect(spyTabEvents.getAllCookieActions).toHaveBeenCalledTimes(1);
    });

    it('should sanitize favIconUrl if status=complete and debug is true', () => {
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      TabEvents.onTabUpdate(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe(
        '***',
      );
    });

    it('should not queue getAllCookieActions if one is pending already', () => {
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      expect(TestTabEvents.getOnTabUpdateDelay()).toBe(false);
      TabEvents.onTabUpdate(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getOnTabUpdateDelay()).toBe(true);
      TabEvents.onTabUpdate(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      jest.runAllTimers();
      expect(spyTabEvents.getAllCookieActions).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDomainChange', () => {
    // Do not change any of the test order as each test relies on the previous actions.

    it('should do nothing if tab.status is not complete', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'loading',
      });
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should set mainDomain on first encounter', () => {
      expect(Object.keys(TestTabEvents.getTabToDomain()).length).toBe(0);
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should truncate favIconUrl if debug=true', () => {
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      expect(Object.keys(TestTabEvents.getTabToDomain()).length).toBe(1);
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe(
        '***',
      );
    });

    it('should not do anything if mainDomain has not changed yet', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger clean if cleanOnDomainChange was not enabled', () => {
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: 'http://domain.cad',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('domain.cad');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger clean if mainDomain was changed and domainChangeCleanup is enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to change domain
      expect(TestTabEvents.getTabToDomain()[0]).toBe('domain.cad');
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should trigger clean if mainDomain was changed to a home/blank/new tab and domainChangeCleanup is enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to change domain to blank
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: 'about:blank',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('');
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should not trigger cleaning if previous domain was a new/blank/home tab with domainChangeCleanup enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId of blank tab to new domain.
      expect(TestTabEvents.getTabToDomain()[0]).toBe('');
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger if next domain is an empty string (highly unlikely scenario)', () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to go from domain to empty string...which usually doesn't happen
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: '',
      });
      // Treat as mainDomain unchanged per current logic.
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });
  });

  describe('onDomainChangeRemove', () => {
    // This function doesn't throw any errors when tabId does not exist, so one test covers all.
    it('should remove old mainDomain from closed tabId', () => {
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      TabEvents.onDomainChangeRemove(0, {
        windowId: 1,
        isWindowClosing: false,
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe(undefined);
    });
  });

  describe('cleanFromTabEvents', () => {
    afterAll(() => {
      global.browser.alarms.get.mockRestore();
    });

    it('should do nothing if activeMode is disabled', async () => {
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.createActiveModeAlarm).not.toHaveBeenCalled();
    });

    it('should create an "alarm" for cleaning when activeMode is enabled', async () => {
      when(global.browser.alarms.get)
        .calledWith('activeModeAlarm')
        .mockResolvedValue(undefined as never);
      TestStore.changeSetting(SettingID.ACTIVE_MODE, true);
      TestStore.changeSetting(SettingID.CLEAN_DELAY, 1);
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.createActiveModeAlarm).toHaveBeenCalledTimes(1);
    });

    it('should not create an alarm if one exists already when activeMode is enabled', async () => {
      when(global.browser.alarms.get)
        .calledWith('activeModeAlarm')
        .mockResolvedValue({ name: 'activeModeAlarm' } as never);
      TestStore.changeSetting(SettingID.ACTIVE_MODE, true);
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.createActiveModeAlarm).not.toHaveBeenCalled();
    });
  });
});
