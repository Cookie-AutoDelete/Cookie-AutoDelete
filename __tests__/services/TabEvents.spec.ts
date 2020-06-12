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
import * as Lib from '../../src/services/Libs';
import TabEvents from '../../src/services/TabEvents';
import StoreUser from '../../src/services/StoreUser';

jest.requireActual('../../src/services/AlarmEvents');

// This dynamically generates the spies for all functions in AlarmEvents
const spyAlarmEvents: {[s: string]: jest.SpyInstance} = {};
for (const k of Object.keys(AlarmEvents)) {
  try {
    if (!spyAlarmEvents[k]) spyAlarmEvents[k] = jest.spyOn(AlarmEvents, k as never);
  } catch {
    // Most likely not a function
  }
}

jest.requireActual('../../src/services/Libs');

// This dynamically generates the spies for all functions in Libs
const spyLib: {[s: string]: jest.SpyInstance} = {};
for (const k of Object.keys(Lib)) {
  try {
    if (!spyLib[k]) spyLib[k] = jest.spyOn(Lib, k as never);
  } catch {
    // Most likely not a function
  }
}
jest.requireActual('../../src/services/TabEvents');

// This dynamically generates the spies for all functions in TabEvents
const spyTabEvents: {[s: string]: jest.SpyInstance} = {};
for (const k of Object.keys(TabEvents)) {
  try {
    if (!spyTabEvents[k]) spyTabEvents[k] = jest.spyOn(TabEvents, k as never);
  } catch {
    // Most likely not a function
  }
}

jest.requireActual('../../src/services/StoreUser');

jest.useFakeTimers();

const store: Store<State, ReduxAction> = createStore(initialState);
StoreUser.init(store);

class TestStore extends StoreUser {

  public static addCache(payload: any) {
    StoreUser.store.dispatch({
      payload,
      type: ReduxConstants.ADD_CACHE
    });
  };

  public static changeSetting(name: string, value: string | boolean | number) {
    StoreUser.store.dispatch(updateSetting({ name, value }));
  }

  public static resetSetting() {
    StoreUser.store.dispatch(resetSettings());
  }
}

const sampleChangeInfo: browser.tabs.TabChangeInfo = {
  discarded: false,
  favIconUrl: 'sample',
  status: 'loading|complete',
  title: 'newTitle',
  url: 'sampleURL',
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
}

describe('TabEvents', () => {
  beforeAll(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({version: '0.12.34' } as never);
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
        .calledWith({storeId: 'firefox-default'})
        .mockResolvedValue([testCookie, {...testCookie, domain: '', path: '/test/'}] as never);
      when(global.browser.cookies.getAll)
        .calledWith({domain: ''})
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({domain: 'domain.com', storeId: 'firefox-default'})
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
      await TabEvents.getAllCookieActions({...sampleTab, url: undefined});
      expect(spyLib.cadLog).not.toHaveBeenCalled();
    });

    it('should do nothing if url is empty string', async () => {
      await TabEvents.getAllCookieActions({...sampleTab, url: ''});
      expect(spyLib.cadLog).not.toHaveBeenCalled();
    });

    it('should do nothing if url is an internal page', async () => {
      await TabEvents.getAllCookieActions({...sampleTab, url: 'about:home'});
      await TabEvents.getAllCookieActions({...sampleTab, url: 'chrome:newtab'});
      expect(spyLib.cadLog).not.toHaveBeenCalled();
    });

    it('should do nothing if url is not valid', async () => {
      await TabEvents.getAllCookieActions({...sampleTab, url: 'bad'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('empty')).not.toBe(-1);
    });

    it('should work on local files', async () => {
      await TabEvents.getAllCookieActions({...sampleTab, url: 'file:///test/file.html'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('Local')).not.toBe(-1);
      // Well a simple test but at least we cover that path somewhat.\
      expect(spyLib.cadLog.mock.calls[1][0].x.cookieCount).toBe(1);
    });

    it('should work on regular domains', async () => {
      await TabEvents.getAllCookieActions({...sampleTab, url: 'http://domain.com'});
      expect(spyLib.cadLog.mock.calls[1][0].x.cookieCount).toBe(1);
    });

    it('should create a cookie if clean localstorage was enabled and no cookie was found', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({domain: 'cookie.net', storeId: 'firefox-default'})
        .mockResolvedValue([] as never);
      TestStore.changeSetting('localstorageCleanup', true);
      await TabEvents.getAllCookieActions({...sampleTab, url: 'http://cookie.net'});
      expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should filter out CAD LocalStorage cookie from total cookie count', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({domain: 'cookie.net', storeId: 'firefox-default'})
        .mockResolvedValue([{...testCookie, name: Lib.LSCLEANUPNAME}] as never);
      await TabEvents.getAllCookieActions({...sampleTab, url: 'http://cookie.net'});
      expect(spyLib.cadLog.mock.calls[2][0].x).toEqual({
        preFilterCount: 1, newCookieCount: 0,
      });
    });

    it('should not show cookie count in non-existent icon in Firefox Android', async () => {
      TestStore.addCache({key: 'platformOs', value: 'android'});
      await TabEvents.getAllCookieActions({...sampleTab, url: 'http://domain.com'});
      // dynamically get last call to cadLog
      const cl = spyLib.cadLog.mock.calls.length - 1;
      // This makes sure that showNumberOfCookiesInIcon is not called
      expect(spyLib.cadLog.mock.calls[cl][0].msg.indexOf('showNumberOfCookiesInIcon')).toBe(-1);
    });
  });

  describe('onTabDiscarded', () => {
    it('should do nothing if clean discarded tabs setting is not enabled', () => {
      TestStore.changeSetting('discardedCleanup', false);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyLib.createPartialTabInfo).not.toHaveBeenCalled();
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should do nothing if the tab that was updated is not discarded, even if discardedCleanup was true', () => {
      TestStore.changeSetting('discardedCleanup', true);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger cleaning if clean discarded tabs is enabled and changeInfo was discarded', () => {
      TestStore.changeSetting('discardedCleanup', true);
      TabEvents.onTabDiscarded(0, {...sampleChangeInfo, discarded: true}, sampleTab);
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should sanitize favIconUrl if debug was enabled', () => {
      TestStore.changeSetting('discardedCleanup', true);
      TestStore.changeSetting('debugMode', true);
      TabEvents.onTabDiscarded(0, {...sampleChangeInfo}, sampleTab);
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe('***');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
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
      TabEvents.onTabUpdate(0, sampleChangeInfo, {...sampleTab, status: 'loading'});
      expect(spyTabEvents.getAllCookieActions).not.toHaveBeenCalled();
    });

    it('should trigger getAllCookieActions', () => {
      TabEvents.onTabUpdate(0, sampleChangeInfo, { ...sampleTab, status: 'complete' });
      jest.runAllTimers();
      expect(spyTabEvents.getAllCookieActions).toHaveBeenCalledTimes(1);
    });

    it('should sanitize favIconUrl if status=complete and debug is true', () => {
      TestStore.changeSetting('debugMode', true);
      TabEvents.onTabUpdate(0, sampleChangeInfo, { ...sampleTab, status: 'complete' });
      jest.runAllTimers();
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe('***');
    });

    it('should not queue getAllCookieActions if one is pending already', () => {
      TestStore.changeSetting('debugMode', true);
      TabEvents.onTabUpdate(0, sampleChangeInfo, { ...sampleTab, status: 'complete' });
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('set')).not.toBe(-1);
      TabEvents.onTabUpdate(0, sampleChangeInfo, { ...sampleTab, status: 'complete' });
      expect(spyLib.cadLog.mock.calls[1][0].msg.indexOf('pending')).not.toBe(-1);
      jest.runAllTimers();
    });
  });

  describe('onDomainChange', () => {
    // Because it is not easy checking private variables, use cadLog's inbound msg
    // to check, even though it is not being output if debug=false.
    //       spyLib.cadLog.mock.calls[0][0] for first call & first argument

    // Do not change any of the test order as each test relies on the previous actions.

    it('should do nothing if tab.status is not complete', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'loading'});
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should set mainDomain on first encounter', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('First')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should truncate favIconUrl if debug=true', () => {
      TestStore.changeSetting('debugMode', true);
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete'});
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe('***');
    });

    it('should not do anything if mainDomain has not changed yet', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('not changed')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger clean if cleanOnDomainChange was not enabled', () => {
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete', url: 'http://domain.cad'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('not enabled')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger clean if mainDomain was changed and domainChangeCleanup is enabled', () => {
      TestStore.changeSetting('domainChangeCleanup', true);
      // reuse previous tabId to change domain
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('changed.  Executing')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should trigger clean if mainDomain was changed to a home/blank/new tab and domainChangeCleanup is enabled', () => {
      TestStore.changeSetting('domainChangeCleanup', true);
      // reuse previous tabId to change domain to blank
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete', url: 'about:blank'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('changed.  Executing')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should not trigger cleaning if previous domain was a new/blank/home tab with domainChangeCleanup enabled', () => {
      TestStore.changeSetting('domainChangeCleanup', true);
      // reuse previous tabId of blank tab to new domain.
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete'});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('blank')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger if next domain is an empty string (highly unlikely scenario)', () => {
      TestStore.changeSetting('domainChangeCleanup', true);
      // reuse previous tabId to go from domain to empty string...which usually doesn't happen
      TabEvents.onDomainChange(0, sampleChangeInfo, {...sampleTab, status: 'complete', url: ''});
      // Treat as mainDomain unchanged per current logic.
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('not changed')).not.toBe(-1);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });
  });

  describe('onDomainChangeRemove', () => {
    // This function doesn't throw any errors when tabId does not exist, so one test covers all.
    it('should remove old mainDomain from closed tabId', () => {
      TabEvents.onDomainChangeRemove(0, {windowId: 1, isWindowClosing: false,});
      expect(spyLib.cadLog.mock.calls[0][0].msg.indexOf('Removing')).not.toBe(-1);
    });
  });

  describe('cleanFromTabEvents', () => {
    afterAll(() => {
      global.browser.alarms.get.mockRestore();
    });

    it('should do nothing if activeMode is disabled', async () => {
      await TabEvents.cleanFromTabEvents();
      expect(spyLib.cadLog.mock.calls.length).toBe(0);
    });

    it('should create an "alarm" for cleaning when activeMode is enabled', async () => {
      when(global.browser.alarms.get)
        .calledWith('activeModeAlarm')
        .mockResolvedValue(undefined as never);
      TestStore.changeSetting('activeMode', true);
      TestStore.changeSetting('delayBeforeClean', 1);
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.createActiveModeAlarm).toHaveBeenCalledTimes(1);
    });

    it('should not create an alarm if one exists already when activeMode is enabled', async () => {
      when(global.browser.alarms.get)
        .calledWith('activeModeAlarm')
        .mockResolvedValue({name: 'activeModeAlarm'} as never);
      TestStore.changeSetting('activeMode', true);
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.createActiveModeAlarm).not.toHaveBeenCalled();
    });
  });
});
