/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import browser from 'webextension-polyfill';

import { configureWrapStore } from './redux/Store';
import AlarmEvents from './services/AlarmEvents';
import {
  checkIfProtected,
  setGlobalIcon,
} from './services/BrowserActionService';
import ContextMenuEvents from './services/ContextMenuEvents';
import ContextualIdentitiesEvents from './services/ContextualIdentitiesEvents';
import CookieEvents from './services/CookieEvents';
import {
  cadLog,
  convertVersionToNumber,
  extractMainDomain,
  getSetting,
  sleep,
  waitUntil,
} from './services/Libs';
import SettingService from './services/SettingService';
import StoreUser from './services/StoreUser';
import TabEvents from './services/TabEvents';
import {
  BrowserName,
  ListType,
  SettingID,
  SiteDataType,
} from './typings/Enums';

import {
  cookieCleanup,
  handleStartUp,
  validateSettings,
} from './redux/BackgroundActions';
import { addCache } from './redux/CacheSlice';
import { resetCookieDeletedCounter } from './redux/CookieDeletedCounterSlices';
import { addExpression, updateExpression } from './redux/ListsSlice';
import { updateSetting } from './redux/SettingsSlice';
import { browserDetect } from './utils/BrowserDetect';

(async () => {
  // Delay saving to disk to queue up actions
  let delaySave = false;
  const saveToStorage = async () => {
    if (!delaySave) {
      delaySave = true;

      await sleep(1000);

      await waitUntil(
        browser.storage.local.set({
          state: JSON.stringify(store.getState()),
        }),
      );

      delaySave = false;
    }
  };

  const mf = browser.runtime.getManifest();
  browser.action.setTitle({
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
  const store = configureWrapStore(stateFromStorage);

  // Store the FF version in cache
  if (browserDetect() === BrowserName.Firefox) {
    const browserInfo = await browser.runtime.getBrowserInfo();
    const browserVersion = Number.parseInt(browserInfo.version);
    store.dispatch(addCache({ key: 'browserVersion', value: browserVersion }));
    store.dispatch(addCache({ key: 'browserInfo', value: browserInfo }));
  }

  // Store which browser environment in cache
  store.dispatch(addCache({ key: 'browserDetect', value: browserDetect() }));

  // Store platform in cache
  const platformInfo = await browser.runtime.getPlatformInfo();
  store.dispatch(addCache({ key: 'platformInfo', value: platformInfo }));
  store.dispatch(addCache({ key: 'platformOs', value: platformInfo.os }));

  // This is important to initialize the Store for all classes that extend from this
  StoreUser.init(store);

  SettingService.init();
  store.subscribe(SettingService.onSettingsChange);
  store.subscribe(saveToStorage);

  store.dispatch(validateSettings());

  if (browser.contextualIdentities) {
    // Populate cache with mapped Container ID to Name
    await ContextualIdentitiesEvents.cacheCookieStoreIdNames();
  }

  await setGlobalIcon(
    getSetting(store.getState(), SettingID.ACTIVE_MODE) as boolean,
  );

  checkIfProtected(store.getState());

  browser.action.setTitle({
    title: `${mf.name} ${mf.version} [READY] (0)`,
  });

  cadLog(
    {
      msg: `background.onInit has been executed`,
      type: 'info',
    },
    getSetting(store.getState(), SettingID.DEBUG_MODE) as boolean,
  );
})();

browser.runtime.onStartup.addListener(
  StoreUser.withStoreReady((store) => async () => {
    store.dispatch(handleStartUp());

    const greyCleanup = () => {
      if (getSetting(store.getState(), SettingID.ACTIVE_MODE)) {
        cadLog(
          {
            msg: `background.greyCleanup:  dispatching browser restart greyCleanup.`,
          },
          getSetting(store.getState(), SettingID.DEBUG_MODE) as boolean,
        );
        store.dispatch(
          cookieCleanup({
            greyCleanup: true,
            ignoreOpenTabs: getSetting(
              store.getState(),
              SettingID.CLEAN_OPEN_TABS_STARTUP,
            ) as boolean,
          }),
        );
      }
    };

    if (getSetting(store.getState(), SettingID.ACTIVE_MODE) === true) {
      if (getSetting(store.getState(), SettingID.ENABLE_GREYLIST) === true) {
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
              msg: 'Found a tab with [ about:sessionrestore ] in Firefox. Skipping Grey startup cleanup this time.',
              type: 'info',
            },
            getSetting(store.getState(), SettingID.DEBUG_MODE) === true,
          );
        }
      } else {
        cadLog(
          {
            msg: 'GreyList Cleanup setting is disabled.  Not cleaning cookies on startup.',
            type: 'info',
          },
          getSetting(store.getState(), SettingID.DEBUG_MODE) === true,
        );
      }
    }

    await checkIfProtected(store.getState());
  }),
);

// Keeps a memory of all runtime ports for popups.  Should only be one but just in case.
const cookiePopupPorts: browser.Runtime.Port[] = [];
const cookiePopupHeartbeat: number[] = [];

async function onCookiePopupUpdates(changeInfo: {
  removed: boolean;
  cookie: browser.Cookies.Cookie;
  cause: browser.Cookies.OnChangedCause;
}) {
  const cDomain = extractMainDomain(changeInfo.cookie.domain);
  cookiePopupPorts.forEach((p) => {
    if (!p.name?.startsWith('popupCAD_')) return;
    const pn = p.name.slice(9).split(',');
    if (pn[0].endsWith(changeInfo.cookie.domain) || pn[0].endsWith(cDomain)) {
      p.postMessage({ cookieUpdated: true });
    }
  });
}

function handleConnect(p: browser.Runtime.Port) {
  if (!p.name?.startsWith('popupCAD_')) return;

  p.onMessage.addListener((m) => {
    cadLog(
      {
        msg: 'Received unexpected message from CAD Popup',
        type: 'warn',
        x: JSON.stringify(m),
      },
      true,
    );
  });

  p.onDisconnect.addListener((dp: browser.Runtime.Port) => {
    if (!dp.name) return;

    const i: number = cookiePopupPorts.findIndex((pp: browser.Runtime.Port) => {
      if (!pp.name) return false;
      return pp.name === dp.name;
    });

    if (i !== -1) {
      clearInterval(cookiePopupHeartbeat[i]);

      cookiePopupPorts.splice(i, 1);
      cookiePopupHeartbeat.splice(i, 1);
    }

    if (cookiePopupPorts.length === 0) {
      browser.cookies.onChanged.removeListener(onCookiePopupUpdates);
    }
  });

  p.postMessage({ cookieUpdated: true });

  // Keep sending a ping every 10 seconds to keep the port alive.
  const timer = setInterval(() => {
    p.postMessage({
      status: 'ping',
    });
  }, 10000);

  cookiePopupPorts.push(p);
  // For testing purposes
  cookiePopupHeartbeat.push(timer as unknown as number);
}

browser.runtime.onConnect.addListener(handleConnect);

// Register Menus
browser.runtime.onInstalled.addListener(
  StoreUser.withStoreReady(() => async (details) => {
    switch (details.reason) {
      case 'install':
      case 'update':
        if (browser.contextMenus) {
          ContextMenuEvents.menuInit();
        }
        break;
      default:
        break;
    }
  }),
);

// Update Settings
browser.runtime.onInstalled.addListener(
  StoreUser.withStoreReady((store) => async (details) => {
    await checkIfProtected(store.getState());
    switch (details.reason) {
      case 'install':
        await browser.runtime.openOptionsPage();
        break;
      case 'update':
        // Validate Settings to get new settings (if any).
        store.dispatch(validateSettings());

        if (convertVersionToNumber(details.previousVersion) < 350) {
          // Migrate State Setting Name localstorageCleanup to localStorageCleanup
          if (store.getState().settings[SettingID.CLEANUP_LOCALSTORAGE_OLD]) {
            store.dispatch(
              updateSetting({
                name: SettingID.CLEANUP_LOCALSTORAGE,
                value: store.getState().settings[
                  SettingID.CLEANUP_LOCALSTORAGE_OLD
                ].value as boolean,
              }),
            );
          }
          // Migrate Expression Option 'cleanLocalStorage' to cleanSiteData: [ LocalStorage ]
          Object.values(store.getState().lists).forEach((list) => {
            list.forEach((exp) => {
              // Only migrate if cleanSiteData array is undefined/empty.
              if (exp.cleanLocalStorage && !exp.cleanSiteData) {
                store.dispatch(
                  updateExpression({
                    ...exp,
                    cleanSiteData: [SiteDataType.LOCALSTORAGE],
                  }),
                );
              }
            });
          });
          // Migrate Settings [uncheck 'Keep LocalStorage' on New [GREY/WHITE] Expressions]
          // Only does this if either was checked.
          for (const lt of [ListType.GREY, ListType.WHITE]) {
            if (
              getSetting(
                store.getState(),
                `${lt.toLowerCase()}CleanLocalstorage` as SettingID,
              )
            ) {
              const containers = new Set<string>(
                Object.keys(store.getState().lists),
              );
              containers.add('default');
              if (
                getSetting(store.getState(), SettingID.CONTEXTUAL_IDENTITIES)
              ) {
                const contextualIdentitiesObjects =
                  await browser.contextualIdentities.query({});
                contextualIdentitiesObjects.forEach((c) =>
                  containers.add(c.cookieStoreId),
                );
              }
              containers.forEach((list) => {
                store.dispatch(
                  addExpression({
                    expression: `_Default:${lt}`,
                    cleanSiteData: [SiteDataType.LOCALSTORAGE],
                    listType: lt,
                    storeId: list,
                  }),
                );
              });
            }
          }
        }
        if (convertVersionToNumber(details.previousVersion) < 300) {
          store.dispatch(resetCookieDeletedCounter());
        }
        if (getSetting(store.getState(), SettingID.ENABLE_NEW_POPUP)) {
          await browser.runtime.openOptionsPage();
        }

        break;
      default:
        break;
    }
  }),
);

browser.alarms.onAlarm.addListener(
  StoreUser.withStoreReady(() => async (alarm) => {
    switch (alarm.name) {
      case 'activeModeAlarm':
        AlarmEvents.handleAlarmEvent();
        break;
      default:
        break;
    }
  }),
);

browser.cookies.onChanged.addListener(onCookiePopupUpdates);

browser.tabs.onUpdated.addListener(
  StoreUser.withStoreReady(() => TabEvents.onDomainChange),
);
browser.tabs.onUpdated.addListener(
  StoreUser.withStoreReady(() => TabEvents.onTabDiscarded),
);
browser.tabs.onUpdated.addListener(
  StoreUser.withStoreReady(() => TabEvents.onTabUpdate),
);
browser.tabs.onRemoved.addListener(
  StoreUser.withStoreReady(() => TabEvents.onDomainChangeRemove),
);
browser.tabs.onRemoved.addListener(
  StoreUser.withStoreReady(() => TabEvents.cleanFromTabEvents),
);

// This should update the cookie badge count when cookies are changed.
browser.cookies.onChanged.addListener(
  StoreUser.withStoreReady(() => CookieEvents.onCookieChanged),
);

if (browser.contextualIdentities) {
  ContextualIdentitiesEvents.init();
}
