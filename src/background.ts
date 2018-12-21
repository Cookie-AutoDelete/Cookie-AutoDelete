/**
 * Copyright (c) 2017 Kenny Do
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Store } from 'redux';
import shortid from 'shortid';
import {
  cacheCookieStoreIdNames,
  cookieCleanup,
  validateSettings,
} from './redux/Actions';
// tslint:disable-next-line:import-name
import createStore from './redux/Store';
import {
  checkIfProtected,
  showNumberOfCookiesInIcon,
} from './services/BrowserActionService';
import {
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  returnOptionalCookieAPIAttributes,
} from './services/Libs';

let store: Store;
let currentSettings: { [setting: string]: Setting };

// Delay saving to disk to queue up actions
let delaySave = false;
const saveToStorage = () => {
  if (!delaySave) {
    delaySave = true;
    setTimeout(() => {
      delaySave = false;
      return browser.storage.local.set({
        state: JSON.stringify(store.getState()),
      });
    }, 1000);
  }
};

const onSettingsChange = () => {
  const previousSettings = currentSettings;
  currentSettings = store.getState().settings;
  // Container Mode enabled
  if (
    !previousSettings.contextualIdentities.value &&
    currentSettings.contextualIdentities.value
  ) {
    // @ts-ignore
    store.dispatch(cacheCookieStoreIdNames());
  }

  // Localstorage support enabled
  if (
    !previousSettings.localstorageCleanup.value &&
    currentSettings.localstorageCleanup.value
  ) {
    browser.browsingData.removeLocalStorage({
      since: 0,
    });
  }

  if (previousSettings.activeMode.value && !currentSettings.activeMode.value) {
    browser.alarms.clear('activeModeAlarm');
  }
};

// Create an alarm delay or use setTimeout before cookie cleanup
let alarmFlag = false;
const createActiveModeAlarm = () => {
  const seconds = parseInt(
    getSetting(store.getState(), 'delayBeforeClean') as string,
    10,
  );
  const minutes = seconds / 60;
  const milliseconds = seconds * 1000;
  if (alarmFlag) {
    return;
  }
  alarmFlag = true;
  if (seconds < 1) {
    setTimeout(() => {
      store.dispatch(
        // @ts-ignore
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
      alarmFlag = false;
    }, 500);
  } else if (
    browserDetect() === 'Firefox' ||
    (browserDetect() === 'Chrome' && seconds >= 60)
  ) {
    browser.alarms.create('activeModeAlarm', {
      delayInMinutes: minutes,
    });
  } else {
    setTimeout(() => {
      if (getSetting(store.getState(), 'activeMode')) {
        store.dispatch(
          // @ts-ignore
          cookieCleanup({
            greyCleanup: false,
            ignoreOpenTabs: false,
          }),
        );
      }
      alarmFlag = false;
    }, milliseconds);
  }
};

const cleanFromFromTabEvents = async () => {
  if (getSetting(store.getState(), 'activeMode')) {
    const alarm = await browser.alarms.get('activeModeAlarm');
    // This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
    // in chrome, it returns an array
    if (store.getState().cache.browserDetect === 'Firefox' && !alarm) {
      createActiveModeAlarm();
    } else if (alarm && alarm.name !== 'activeModeAlarm') {
      createActiveModeAlarm();
    }
  }
};

const getAllCookieActions = async (tab: browser.tabs.Tab) => {
  const hostname = getHostname(tab.url);
  const cookies = await browser.cookies.getAll(
    returnOptionalCookieAPIAttributes(store.getState(), {
      domain: hostname,
      firstPartyDomain: extractMainDomain(hostname),
      storeId: tab.cookieStoreId,
    }),
  );
  let cookieLength = cookies.length;
  if (
    cookies.length === 0 &&
    getSetting(store.getState(), 'localstorageCleanup') &&
    isAWebpage(tab.url)
  ) {
    browser.cookies.set(
      // @ts-ignore
      returnOptionalCookieAPIAttributes(store.getState(), {
        expirationDate: Math.floor(Date.now() / 1000 + 31557600),
        firstPartyDomain: extractMainDomain(getHostname(tab.url)),
        name: 'CookieAutoDelete',
        path: `/${shortid.generate()}`,
        storeId: tab.cookieStoreId,
        url: tab.url,
        value: 'cookieForLocalstorageCleanup',
      }),
    );
    cookieLength = 1;
  }
  if (getSetting(store.getState(), 'showNumOfCookiesInIcon')) {
    showNumberOfCookiesInIcon(tab, cookieLength);
  } else {
    browser.browserAction.setBadgeText({
      tabId: tab.id,
      text: '',
    });
  }
};

// Add a delay to prevent multiple spawns of the localstorage cookie
let onTabUpdateDelay = false;
export const onTabUpdate = (
  tabId: number,
  changeInfo: any,
  tab: browser.tabs.Tab,
) => {
  if (tab.status === 'complete') {
    checkIfProtected(store.getState(), tab);
    if (!onTabUpdateDelay) {
      onTabUpdateDelay = true;
      setTimeout(() => {
        getAllCookieActions(tab);
        onTabUpdateDelay = false;
      }, 750);
    }
  }
};

const tabToDomain: { [key: number]: string } = {};
export const onDomainChange = (
  tabId: number,
  changeInfo: any,
  tab: browser.tabs.Tab,
) => {
  if (tab.status === 'complete') {
    const mainDomain = extractMainDomain(getHostname(tab.url));
    if (tabToDomain[tabId] === undefined && mainDomain !== '') {
      tabToDomain[tabId] = mainDomain;
    } else if (tabToDomain[tabId] !== mainDomain && mainDomain !== '') {
      tabToDomain[tabId] = mainDomain;
      if (getSetting(store.getState(), 'domainChangeCleanup')) {
        cleanFromFromTabEvents();
      }
    }
  }
};

export const onDomainChangeRemove = (tabId: number) => {
  delete tabToDomain[tabId];
};

const onStartUp = async () => {
  const storage = await browser.storage.local.get();
  let stateFromStorage;
  try {
    if (storage.state) {
      stateFromStorage = JSON.parse(storage.state as string);
    } else {
      stateFromStorage = {};
    }
  } catch (err) {
    stateFromStorage = {};
  }
  store = createStore(stateFromStorage);
  // @ts-ignore
  store.dispatch(validateSettings());
  store.dispatch({
    type: 'ON_STARTUP',
  });
  // Store the FF version in cache
  if (browserDetect() === 'Firefox') {
    const browserInfo = await browser.runtime.getBrowserInfo();
    const browserVersion = browserInfo.version.split('.')[0];
    store.dispatch({
      payload: {
        key: 'browserVersion',
        value: browserVersion,
      },
      type: 'ADD_CACHE',
    });
    // Store whether firstPartyIsolate is true or false
    if (browserVersion >= '58') {
      // @ts-ignore
      const setting = await browser.privacy.websites.firstPartyIsolate.get({});
      store.dispatch({
        payload: {
          key: 'firstPartyIsolateSetting',
          value: setting.value,
        },
        type: 'ADD_CACHE',
      });
    }
  }
  // Store which browser environment in cache
  store.dispatch({
    payload: {
      key: 'browserDetect',
      value: browserDetect(),
    },
    type: 'ADD_CACHE',
  });

  // Temporary fix until contextualIdentities events land
  if (getSetting(store.getState(), 'contextualIdentities')) {
    // @ts-ignore
    store.dispatch(cacheCookieStoreIdNames());
  }
  if (getSetting(store.getState(), 'activeMode')) {
    store.dispatch(
      // @ts-ignore
      cookieCleanup({
        greyCleanup: true,
        ignoreOpenTabs: getSetting(
          store.getState(),
          'cleanCookiesFromOpenTabsOnStartup',
        ),
      }),
    );
  }
  currentSettings = store.getState().settings;
  store.subscribe(onSettingsChange);
  store.subscribe(saveToStorage);
};

onStartUp();

// Logic that controls when to disable the browser action
browser.tabs.onUpdated.addListener(onTabUpdate);
browser.tabs.onUpdated.addListener(onDomainChange);
browser.tabs.onRemoved.addListener(onDomainChangeRemove);
browser.tabs.onRemoved.addListener(cleanFromFromTabEvents);

// Alarm event handler for Active Mode
browser.alarms.onAlarm.addListener(alarmInfo => {
  // console.log(alarmInfo.name);
  if (alarmInfo.name === 'activeModeAlarm') {
    store.dispatch(
      // @ts-ignore
      cookieCleanup({
        greyCleanup: false,
        ignoreOpenTabs: false,
      }),
    );
    alarmFlag = false;
    browser.alarms.clear(alarmInfo.name);
  }
});
