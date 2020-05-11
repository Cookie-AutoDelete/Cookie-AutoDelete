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

import shortid from 'shortid';
import AlarmEvents from './AlarmEvents';
import {
  checkIfProtected,
  showNumberOfCookiesInIcon,
  showNumberofCookiesinTitle,
} from './BrowserActionService';
import {
  cadLog,
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  LSCLEANUPNAME,
  returnOptionalCookieAPIAttributes,
} from './Libs';
import StoreUser from './StoreUser';

export default class TabEvents extends StoreUser {
  public static onTabUpdate(
    tabId: number,
    changeInfo: any,
    tab: browser.tabs.Tab,
  ) {
    if (tab.status === 'complete') {
      const debug = getSetting(StoreUser.store.getState(), 'debugMode');
      const { id, windowId, status, incognito, cookieStoreId, url, title} = tab;
      const partialTabInfo = { id, windowId, status, incognito, cookieStoreId, url, title};
      if (!TabEvents.onTabUpdateDelay) {
        TabEvents.onTabUpdateDelay = true;
        if (debug) {
          cadLog({
            msg: 'TabEvents.onTabUpdate: action delay has been set for ~750 ms.',
            x: {tabId, changeInfo, partialTabInfo,},
          });
        }
        setTimeout(() => {
          if (debug) {
            cadLog({
              msg: 'TabEvents.onTabUpdate: actions will now commence.',
              x: {tabId, changeInfo, partialTabInfo,},
            });
          }
          TabEvents.getAllCookieActions(tab);
          TabEvents.onTabUpdateDelay = false;
          if (debug) {
            cadLog({
              msg: 'TabEvents.onTabUpdate: actions have been processed and flag cleared.',
            });
          }
        }, 750);
      } else {
        if (debug) {
          cadLog({
            msg: 'TabEvents.onTabUpdate: actions delay is pending already.',
            x: {tabId, changeInfo, partialTabInfo,},
          });
        }
      }
    }
  }

  public static onDomainChange(
    tabId: number,
    changeInfo: any,
    tab: browser.tabs.Tab,
  ) {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    if (tab.status === 'complete') {
      const { id, windowId, status, incognito, cookieStoreId, url, title} = tab;
      const partialTabInfo = { id, windowId, status, incognito, cookieStoreId, url, title};
      const mainDomain = extractMainDomain(getHostname(tab.url));
      if (TabEvents.tabToDomain[tabId] === undefined && mainDomain !== '') {
        if (debug) {
          cadLog({
            msg: 'TabEvents.onDomainChange: First mainDomain set.',
            x: {tabId, changeInfo, mainDomain, partialTabInfo,},
          });
        }
        TabEvents.tabToDomain[tabId] = mainDomain;
      } else if (TabEvents.tabToDomain[tabId] !== mainDomain
        && (mainDomain !== '' ||
          tab.url === 'about:blank' ||
          tab.url === 'about:home' ||
          tab.url === 'about:newtab' ||
          tab.url === 'chrome://newtab/'))
      {
        const oldMainDomain = TabEvents.tabToDomain[tabId];
        TabEvents.tabToDomain[tabId] = mainDomain;
        if (getSetting(StoreUser.store.getState(), 'domainChangeCleanup')) {
          if (oldMainDomain === '') {
            if (debug) {
              cadLog({
                msg: 'TabEvents.onDomainChange: mainDomain has changed, but previous domain may have been a blank or new tab.  Not executing domainChangeCleanup',
                x: {tabId, changeInfo, partialTabInfo,},
              });
            }
            return;
          }
          if (debug) {
            cadLog({
              msg: 'TabEvents.onDomainChange: mainDomain has changed.  Executing domainChangeCleanup',
              x: {tabId, changeInfo, oldMainDomain: TabEvents.tabToDomain[tabId], mainDomain, partialTabInfo,},
            });
          }
          TabEvents.cleanFromFromTabEvents();
        } else {
          if (debug) {
            cadLog({
              msg: 'TabEvents.onDomainChange: mainDomain has changed, but cleanOnDomainChange is not enabled.  Not cleaning.',
              x: {tabId, changeInfo, oldMainDomain: TabEvents.tabToDomain[tabId], mainDomain, partialTabInfo,},
            });
          }
        }
      } else {
        if (debug) {
          cadLog({
            msg: 'TabEvents.onDomainChange: mainDomain has not changed yet.',
            x: {tabId, changeInfo, mainDomain, partialTabInfo,},
          });
        }
      }
    }
  }

  public static onDomainChangeRemove(tabId: number, removeInfo: {windowId: number, isWindowClosing: boolean}) {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    if (debug) {
      cadLog({
        msg: 'TabEvents.onDomainChangeRemove: Tab was closed.  Removing old tabToDomain info.',
        x: {tabId, mainDomain: TabEvents.tabToDomain[tabId] || '', removeInfo,},
      });
    }
    delete TabEvents.tabToDomain[tabId];
  }

  public static cleanFromFromTabEvents = async () => {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    if (getSetting(StoreUser.store.getState(), 'activeMode')) {
      const alarm = await browser.alarms.get('activeModeAlarm');
      if (!alarm || (alarm.name && alarm.name !== 'activeModeAlarm')) {
        if (debug) {
          cadLog({
            msg: 'TabEvents.cleanFromFromTabEvents:  No Alarms detected.  Creating alarm for cleaning...',
          });
        }
        AlarmEvents.createActiveModeAlarm();
      } else {
        if (debug) {
          cadLog({
            msg: 'TabEvents.cleanFromFromTabEvents:  An alarm for cleaning was created already.  Cleaning will commence soon.',
            x: alarm,
          });
        }
      }
    }
  };

  public static async getAllCookieActions(tab: browser.tabs.Tab) {
    if (!tab.url) return;
    if (tab.url === '') return;
    if (tab.url.startsWith('about:') || tab.url.startsWith('chrome:')) return;
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    const { id, windowId, status, incognito, cookieStoreId, url, title} = tab;
    const partialTabInfo = { id, windowId, status, incognito, cookieStoreId, url, title};
    const hostname = getHostname(tab.url);
    if (hostname === '') {
      if (debug) {
        cadLog({
          msg: 'TabEvents.getAllCookieActions: hostname parsed empty for tab url.  Skipping Cookie Actions.',
          x: {partialTabInfo, hostname,},
        });
      }
      return;
    }
    let cookies = [];
    if (hostname.startsWith('file:')){
      const allCookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(StoreUser.store.getState(), {
          storeId: tab.cookieStoreId,
        }),
      );
      const regExp = new RegExp(hostname.slice(7)); // take out file://
      if (debug) {
        cadLog({
          msg: 'TabEvents.getAllCookieActions:  Local File Regex to test on cookie.path',
          x: {partialTabInfo, hostname, regExp: regExp.toString(),},
        });
      }
      cookies = allCookies.filter(cookie => cookie.domain === '' && regExp.test(cookie.path));
    } else {
      if (debug) {
        cadLog({
          msg: 'TabEvents.getAllCookieActions:  browser.cookies.getAll for domain.',
          x: {partialTabInfo, domain: hostname, firstPartyDomain: extractMainDomain(hostname),},
        });
      }
      cookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(StoreUser.store.getState(), {
          domain: hostname,
          firstPartyDomain: extractMainDomain(hostname),
          storeId: tab.cookieStoreId,
        }),
      );
    }
    if (debug) {
      cadLog({
        msg: 'TabEvents.getAllCookieActions:  Filtered Cookie Count',
        x: { partialTabInfo, tabURL: tab.url, hostname, cookieCount: cookies.length,},
      });
    }

    if (
      cookies.length === 0 &&
      getSetting(AlarmEvents.store.getState(), 'localstorageCleanup') &&
      isAWebpage(tab.url) && ! tab.url.startsWith('file:')
    ) {
      const cookiesAttributes = returnOptionalCookieAPIAttributes(
        StoreUser.store.getState(),
        {
          expirationDate: Math.floor(Date.now() / 1000 + 31557600),
          firstPartyDomain: extractMainDomain(getHostname(tab.url)),
          name: LSCLEANUPNAME,
          path: `/${shortid.generate()}`,
          storeId: tab.cookieStoreId,
          url: tab.url || '',
          value: 'cookieForLocalstorageCleanup',
        },
      );
      browser.cookies.set({ ...cookiesAttributes, url: tab.url || '' });
      if (debug) {
        cadLog({
          msg: 'TabEvents.getAllCookieActions:  A temporary cookie has been set for future LocalStorage cleaning as the site did not set any cookies yet.',
          x: {partialTabInfo, cadLSCookie: cookiesAttributes,},
        });
      }
    }
    // Filter out cookie(s) that were set by this extension.
    const cookieLength = cookies.length - cookies.filter(cookie => cookie.name === LSCLEANUPNAME).length;
    if (debug && cookies.length !== cookieLength) {
      cadLog({
        msg: 'TabEvents.getAllCookieActions:  New Cookie Count after filtering out cookie set by extension',
        x: { preFilterCount: cookies.length, newCookieCount: cookieLength,},
      });
    }
    if (debug) {
      cadLog({
        msg: 'TabEvents.getAllCookieActions: executing checkIfProtected to update Icons and Title.',
      });
    }
    checkIfProtected(StoreUser.store.getState(), tab, cookieLength);

    // Exclude Firefox Android for browser icons and badge texts
    if (getSetting(StoreUser.store.getState(), 'showNumOfCookiesInIcon') && (StoreUser.store.getState().cache.platformOs || '') !== 'android') {
      if (debug) {
        cadLog({
          msg: 'TabEvents.getAllCookieActions: executing showNumberOfCookiesInIcon.',
        });
      }
      showNumberOfCookiesInIcon(tab, cookieLength);
    } else {
      if (browser.browserAction.setBadgeText) {
        browser.browserAction.setBadgeText({
          tabId: tab.id,
          text: '',
        });
        if (debug) {
          cadLog({
            msg: `TabEvents.getAllCookieActions:  BadgeText has been cleared for tab ${tab.id}.`,
          });
        }
      }
    }
  }
  // Add a delay to prevent multiple spawns of the localstorage cookie
  private static onTabUpdateDelay = false;

  private static tabToDomain: { [key: number]: string } = {};
}
