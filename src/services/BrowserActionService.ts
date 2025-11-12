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

import type { State } from '../redux/Store';
import { ListType, SettingID } from '../typings/Enums';
import { getHostname, returnMatchedExpressionObject } from './Libs';
import browser from 'webextension-polyfill';

// Show the # of cookies in icon
export const showNumberOfCookiesInIcon = async (
  tab: browser.Tabs.Tab,
  cookieLength: number,
) => {
  await browser.action?.setBadgeText({
    tabId: tab.id,
    text: `${cookieLength === 0 ? '' : cookieLength.toString()}`,
  });

  await browser.action?.setBadgeTextColor({
    color: 'white',
    tabId: tab.id,
  });
};

// Set BrowserAction Title with number of cookies in square brackets.
export const showNumberOfCookiesInTitle = async (
  tab: browser.Tabs.Tab,
  otherInfo: {
    cookieLength?: number;
    listType?: string;
    platformOS?: string;
  },
) => {
  const mf = browser.runtime.getManifest();
  // Use Shortened Extension name for mobile.
  const tabTitle = `${otherInfo.platformOS === 'android' ? 'CAD' : mf.name} ${
    mf.version
  }`;

  const curData = /\[(.*)] \((\d*)\)/.exec(
    await browser.action.getTitle({
      tabId: tab.id,
    }),
  );
  const newData = {
    cookies: otherInfo.cookieLength || (curData && curData[2]) || 0,
    list: otherInfo.listType || (curData && curData[1]) || 'NO LIST',
  };

  await browser.action.setTitle({
    tabId: tab.id,
    title: `${tabTitle} [${newData.list}] (${newData.cookies})`,
  });
};

// Set Badge Color accordingly (to matching list)
const setBadgeColor = async (tab: browser.Tabs.Tab, color = 'default') => {
  const badgeBackgroundColor: { [key: string]: string } = {
    default: 'blue',
    red: 'red',
    yellow: '#e6a32e',
  };

  await browser.action?.setBadgeBackgroundColor({
    color: badgeBackgroundColor[color],
    tabId: tab.id,
  });
};

// Set Background icon color and badgeBackgroundColor accordingly.
const setIconColor = async (
  tab: browser.Tabs.Tab,
  keepDefault = false,
  color = 'default',
) => {
  await browser.action?.setIcon({
    path: {
      48: `icons/icon_48${
        keepDefault || color === 'default' ? '' : `_${color}`
      }.png`,
    },
    tabId: tab.id,
  });

  await setBadgeColor(tab, color);
};

// Set background icon for browser.
export const setGlobalIcon = async (enabled: boolean) => {
  // This sets global icon
  if (browser.action.setIcon) {
    // Set Global Icon
    await browser.action.setIcon({
      path: {
        48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
      },
    });

    const tabAwait = await browser.tabs.query({
      windowType: 'normal',
    });
    for (const tab of tabAwait) {
      if (tab.id !== browser.tabs.TAB_ID_NONE) {
        await browser.action.setIcon({
          path: {
            48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
          },
          tabId: tab.id,
        });
      }
    }
  }
};

// Check if the site is protected and adjust the icon and titles appropriately
export const checkIfProtected = async (
  state: State,
  tab: browser.Tabs.Tab | undefined = undefined,
  cookieLength?: number,
) => {
  const active = state.settings[SettingID.ACTIVE_MODE].value as boolean;
  let activeTabs: browser.Tabs.Tab[] = [];

  if (tab) {
    activeTabs.push(tab);
  } else {
    // No tab provided - query all active tabs instead.
    activeTabs = await browser.tabs.query({
      active: true,
      windowType: 'normal',
    });
  }

  activeTabs.forEach((aTab) => {
    const matchedExpression = returnMatchedExpressionObject(
      state,
      aTab.cookieStoreId || 'default',
      getHostname(aTab.url || ''),
    );

    if (matchedExpression) {
      showNumberOfCookiesInTitle(aTab, {
        platformOS: state.cache.platformOs as string,
        listType: matchedExpression.listType,
        cookieLength,
      });
    } else {
      showNumberOfCookiesInTitle(aTab, {
        platformOS: state.cache.platformOs as string,
        listType: 'NO LIST',
        cookieLength,
      });
    }

    // Can't set icons on Android.
    if (state.cache.platformOs && state.cache.platformOs === 'android') return;

    if (matchedExpression) {
      switch (matchedExpression.listType) {
        case ListType.WHITE:
          if (active) {
            setIconColor(aTab);
          } else {
            setBadgeColor(aTab);
          }
          break;
        case ListType.GREY:
          if (active) {
            void setIconColor(
              aTab,
              state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
              'yellow',
            );
          } else {
            setBadgeColor(aTab, 'yellow');
          }
          break;
        default:
          if (active) {
            void setIconColor(
              aTab,
              state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
              'red',
            );
          } else {
            setBadgeColor(aTab, 'red');
          }
          break;
      }
    } else {
      if (cookieLength !== undefined && cookieLength === 0) {
        if (active) {
          void setIconColor(aTab);
        } else {
          void setBadgeColor(aTab);
        }
      } else {
        if (active) {
          void setIconColor(
            aTab,
            state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
            'red',
          );
        } else {
          void setBadgeColor(aTab, 'red');
        }
      }
    }
  });
};
