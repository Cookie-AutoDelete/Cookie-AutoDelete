/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import { Store } from 'redux';
import {
  cacheCookieStoreIdNames,
  cookieCleanup,
  validateSettings,
} from './redux/Actions';
import createStore from './redux/Store';
import {
  checkIfProtected,
  setGlobalIcon,
} from './services/BrowserActionService';
import ContextMenuEvents from './services/ContextMenuEvents';
import CookieEvents from './services/CookieEvents';
import {
  cadLog,
  convertVersionToNumber,
  extractMainDomain,
  getSetting,
  sleep,
} from './services/Libs';
import StoreUser from './services/StoreUser';
import TabEvents from './services/TabEvents';
import { ReduxAction, ReduxConstants } from './typings/ReduxConstants';

let store: Store<State, ReduxAction>;
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

const onSettingsChange = async () => {
  const previousSettings = currentSettings;
  currentSettings = store.getState().settings;
  // Container Mode enabled
  if (
    !previousSettings.contextualIdentities.value &&
    currentSettings.contextualIdentities.value
  ) {
    store.dispatch<any>(cacheCookieStoreIdNames());
  }

  // Localstorage support enabled
  if (
    !previousSettings.localstorageCleanup.value &&
    currentSettings.localstorageCleanup.value
  ) {
    await browser.browsingData.removeLocalStorage({
      since: 0,
    });
    cadLog(
      {
        msg:
          'LocalStorage setting has been activated.  All previous LocalStorage has been cleared to give it a clean slate.',
        type: 'info',
      },
      currentSettings.debugMode.value as boolean,
    );
  }

  if (previousSettings.activeMode.value && !currentSettings.activeMode.value) {
    await browser.alarms.clear('activeModeAlarm');
  }

  if (previousSettings.activeMode.value !== currentSettings.activeMode.value) {
    await setGlobalIcon(currentSettings.activeMode.value as boolean);
    ContextMenuEvents.updateMenuItemCheckbox(
      ContextMenuEvents.MenuID.ACTIVE_MODE,
      currentSettings.activeMode.value as boolean,
    );
  }

  // Context Menu Changes
  if (
    previousSettings.contextMenus.value !== currentSettings.contextMenus.value
  ) {
    if (currentSettings.contextMenus.value) {
      ContextMenuEvents.menuInit();
    } else {
      await ContextMenuEvents.menuClear();
    }
  }

  await checkIfProtected(store.getState());

  // Validate Settings again
  store.dispatch<any>(validateSettings());
};

const onStartUp = async () => {
  const mf = browser.runtime.getManifest();
  browser.browserAction.setTitle({
    title: `${mf.name} ${mf.version} [STARTING UP...] (0)`,
  });
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

  store.dispatch({
    type: ReduxConstants.ON_STARTUP,
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
      type: ReduxConstants.ADD_CACHE,
    });
  }
  // Store which browser environment in cache
  store.dispatch({
    payload: {
      key: 'browserDetect',
      value: browserDetect(),
    },
    type: ReduxConstants.ADD_CACHE,
  });

  // Store platform in cache
  const platformInfo = await browser.runtime.getPlatformInfo();
  store.dispatch({
    payload: {
      key: 'platformOs',
      value: platformInfo.os,
    },
    type: ReduxConstants.ADD_CACHE,
  });

  // Temporary fix until contextualIdentities events land
  if (getSetting(store.getState(), 'contextualIdentities')) {
    store.dispatch<any>(cacheCookieStoreIdNames());
  }
  currentSettings = store.getState().settings;
  store.subscribe(onSettingsChange);
  store.subscribe(saveToStorage);

  // This is important to initialize the Store for all classes that extend from this
  StoreUser.init(store);

  store.dispatch<any>(validateSettings());

  await setGlobalIcon(getSetting(store.getState(), 'activeMode') as boolean);

  await checkIfProtected(store.getState());

  browser.tabs.onUpdated.addListener(TabEvents.onDomainChange);
  browser.tabs.onUpdated.addListener(TabEvents.onTabDiscarded);
  browser.tabs.onUpdated.addListener(TabEvents.onTabUpdate);
  browser.tabs.onRemoved.addListener(TabEvents.onDomainChangeRemove);
  browser.tabs.onRemoved.addListener(TabEvents.cleanFromTabEvents);

  // This should update the cookie badge count when cookies are changed.
  browser.cookies.onChanged.addListener(CookieEvents.onCookieChanged);

  if (browser.contextMenus) {
    ContextMenuEvents.menuInit();
  }
  browser.browserAction.setTitle({
    title: `${mf.name} ${mf.version} [READY] (0)`,
  });
};

// Keeps a memory of all runtime ports for popups.  Should only be one but just in case.
const cookiePopupPorts: browser.runtime.Port[] = [];

async function onCookiePopupUpdates(changeInfo: {
  removed: boolean;
  cookie: browser.cookies.Cookie;
  cause: browser.cookies.OnChangedCause;
}) {
  const cDomain = extractMainDomain(changeInfo.cookie.domain);
  cookiePopupPorts.forEach((p) => {
    if (!p.name) return;
    if (!p.name.startsWith('popupCAD_')) return;
    const pn = p.name.slice(9).split(',');
    if (pn[0].endsWith(changeInfo.cookie.domain) || pn[0].endsWith(cDomain)) {
      p.postMessage({ cookieUpdated: true });
    }
  });
}

function handleConnect(p: browser.runtime.Port) {
  if (!p.name || !p.name.startsWith('popupCAD_')) return;
  if (!browser.cookies.onChanged.hasListener(onCookiePopupUpdates)) {
    browser.cookies.onChanged.addListener(onCookiePopupUpdates);
  }
  p.onMessage.addListener((m) => {
    console.warn('Received Unexpected message from CAD Popup');
    console.warn(JSON.stringify(m));
  });
  p.onDisconnect.addListener((dp: browser.runtime.Port) => {
    if (
      cookiePopupPorts.length - 1 === 0 &&
      browser.cookies.onChanged.hasListener(onCookiePopupUpdates)
    ) {
      browser.cookies.onChanged.removeListener(onCookiePopupUpdates);
    }
    if (!dp.name) return;
    const i: number = cookiePopupPorts.findIndex((pp: browser.runtime.Port) => {
      if (!pp.name) return false;
      return pp.name === dp.name;
    });
    if (i !== -1) {
      cookiePopupPorts.splice(i, 1);
    }
  });
  p.postMessage({ cookieUpdated: true });
  cookiePopupPorts.push(p);
}

browser.runtime.onConnect.addListener(handleConnect);

onStartUp().then(() => {
  cadLog(
    {
      msg: `background.onStartUp has been executed`,
      type: 'info',
    },
    getSetting(store.getState(), 'debugMode') as boolean,
  );
});
browser.runtime.onStartup.addListener(async () => {
  await awaitStore();
  if (getSetting(store.getState(), 'activeMode') === true) {
    if (getSetting(store.getState(), 'enableGreyListCleanup') === true) {
      let isFFSessionRestore = false;
      const startupTabs = await browser.tabs.query({ windowType: 'normal' });
      startupTabs.forEach((tab) => {
        if (tab.url === 'about:sessionrestore') isFFSessionRestore = true;
      });
      if (!isFFSessionRestore) {
        greyCleanup();
      } else {
        cadLog(
          {
            msg:
              'Found a tab with [ about:sessionrestore ] in Firefox. Skipping Grey startup cleanup this time.',
            type: 'info',
          },
          getSetting(store.getState(), 'debugMode') === true,
        );
      }
    } else {
      cadLog(
        {
          msg:
            'GreyList Cleanup setting is disabled.  Not cleaning cookies on startup.',
          type: 'info',
        },
        getSetting(store.getState(), 'debugMode') === true,
      );
    }
  }
  await checkIfProtected(store.getState());
});
browser.runtime.onInstalled.addListener(async (details) => {
  await awaitStore();
  await checkIfProtected(store.getState());
  switch (details.reason) {
    case 'install':
      await browser.runtime.openOptionsPage();
      break;
    case 'update':
      if (convertVersionToNumber(details.previousVersion) < 300) {
        store.dispatch({
          type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
        });
      }
      if (getSetting(store.getState(), 'enableNewVersionPopup')) {
        await browser.runtime.openOptionsPage();
      }
      break;
    default:
      break;
  }
});

const awaitStore = async () => {
  while (!store) {
    await sleep(250);
  }
};

const greyCleanup = () => {
  if (getSetting(store.getState(), 'activeMode')) {
    cadLog(
      {
        msg: `background.greyCleanup:  dispatching browser restart greyCleanup.`,
      },
      getSetting(store.getState(), 'debugMode') as boolean,
    );
    store.dispatch<any>(
      cookieCleanup({
        greyCleanup: true,
        ignoreOpenTabs: getSetting(
          store.getState(),
          'cleanCookiesFromOpenTabsOnStartup',
        ),
      }),
    );
  }
};
