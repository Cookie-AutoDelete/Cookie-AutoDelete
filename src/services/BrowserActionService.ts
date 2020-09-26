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

import { getHostname, returnMatchedExpressionObject } from './Libs';

// Show the # of cookies in icon
export const showNumberOfCookiesInIcon = (
  tab: browser.tabs.Tab,
  cookieLength: number,
): void => {
  if (browser.browserAction.setBadgeText) {
    browser.browserAction.setBadgeText({
      tabId: tab.id,
      text: `${cookieLength === 0 ? '' : cookieLength.toString()}`,
    });
  }
  if (browser.browserAction.setBadgeTextColor) {
    browser.browserAction.setBadgeTextColor({
      color: 'white',
      tabId: tab.id,
    });
  }
};

// Set BrowserAction Title with number of cookies in square brackets.
export const showNumberOfCookiesInTitle = async (
  tab: browser.tabs.Tab,
  otherInfo: {
    cookieLength?: number;
    listType?: string;
    platformOS?: string;
  },
): Promise<void> => {
  const mf = browser.runtime.getManifest();
  // Use Shortened Extension name for mobile.
  const tabTitle = `${otherInfo.platformOS === 'android' ? 'CAD' : mf.name} ${
    mf.version
  }`;

  const curData = /\[(.*)] \((\d*)\)/.exec(
    await browser.browserAction.getTitle({
      tabId: tab.id,
    }),
  );
  const newData = {
    cookies: otherInfo.cookieLength || (curData && curData[2]) || 0,
    list: otherInfo.listType || (curData && curData[1]) || 'NO LIST',
  };

  browser.browserAction.setTitle({
    tabId: tab.id,
    title: `${tabTitle} [${newData.list}] (${newData.cookies})`,
  });
};

// Set Badge Color accordingly (to matching list)
const setBadgeColor = (tab: browser.tabs.Tab, color = 'default') => {
  const badgeBackgroundColor: { [key: string]: string } = {
    default: 'blue',
    red: 'red',
    yellow: '#e6a32e',
  };
  if (browser.browserAction.setBadgeBackgroundColor) {
    browser.browserAction.setBadgeBackgroundColor({
      color: badgeBackgroundColor[color],
      tabId: tab.id,
    });
  }
};

// Set Background icon color and badgeBackgroundColor accordingly.
const setIconColor = (
  tab: browser.tabs.Tab,
  keepDefault = false,
  color = 'default',
) => {
  if (browser.browserAction.setIcon) {
    browser.browserAction.setIcon({
      path: {
        48: `icons/icon_48${
          keepDefault || color === 'default' ? '' : `_${color}`
        }.png`,
      },
      tabId: tab.id,
    });
  }

  setBadgeColor(tab, color);
};

// Set background icon for browser.
export const setGlobalIcon = async (enabled: boolean): Promise<void> => {
  // This sets global icon
  if (browser.browserAction.setIcon) {
    // Set Global Icon
    await browser.browserAction.setIcon({
      path: {
        48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
      },
    });

    const tabAwait = await browser.tabs.query({
      windowType: 'normal',
    });
    for (const tab of tabAwait) {
      if (tab.id !== browser.tabs.TAB_ID_NONE) {
        await browser.browserAction.setIcon({
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
  tab: browser.tabs.Tab | undefined = undefined,
  cookieLength?: number,
): Promise<void> => {
  const active = state.settings[SettingID.ACTIVE_MODE].value as boolean;
  let activeTabs: browser.tabs.Tab[] = [];

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
        platformOS: state.cache.platformOs,
        listType: matchedExpression.listType,
        cookieLength,
      });
    } else {
      showNumberOfCookiesInTitle(aTab, {
        platformOS: state.cache.platformOs,
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
            setIconColor(
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
            setIconColor(
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
          setIconColor(aTab);
        } else {
          setBadgeColor(aTab);
        }
      } else {
        if (active) {
          setIconColor(
            aTab,
            state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
            'red',
          );
        } else {
          setBadgeColor(aTab, 'red');
        }
      }
    }
  });
};
