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
) => {
  browser.browserAction.setBadgeText({
    tabId: tab.id,
    text: `${cookieLength === 0 ? '' : cookieLength.toString()}`,
  });
  if (browser.browserAction.setBadgeTextColor) {
    browser.browserAction.setBadgeTextColor({
      color: 'white',
      tabId: tab.id,
    });
  }
};

// Set BrowserAction Title with number of cookies in square brackets.
export const showNumberofCookiesinTitle = async (
  tab: browser.tabs.Tab,
  otherInfo: {
    cookieLength?: number,
    listType?: string,
    platformOS?: string,
  },
) => {
  const mf = browser.runtime.getManifest();
  // Use Shortened Extension name for mobile.
  const tabTitle = `${((otherInfo.platformOS === 'android') ? 'CAD' : mf.name)} ${mf.version}`;

  const curData = /\[(.*)\] \((\d*)\)/.exec(await browser.browserAction.getTitle({
    tabId: tab.id,
  }));
  const newData = {
    cookies: otherInfo.cookieLength || (curData && curData[2]) || 0,
    list: otherInfo.listType || (curData && curData[1]) || 'NO LIST',
  };

  browser.browserAction.setTitle({
    tabId: tab.id,
    title: `${tabTitle} [${newData.list}] (${newData.cookies})`,
  });
}

// Set Background icon color and badgeBackgroundColor accordingly.
const setIconColor = (tab: browser.tabs.Tab, keepDefault: boolean = false, color: string = 'default') => {
  const badgeBackgroundColor: {[key:string]: string} = {
    default: 'blue',
    red: 'red',
    yellow: '#e6a32e',
  };
  if (browser.browserAction.setIcon) {
    browser.browserAction.setIcon({
      path: {
        48: `icons/icon_48${(keepDefault || color === 'default') ? '' : `_${color}`}.png`,
      },
      tabId: tab.id,
    });
  }

  if (browser.browserAction.setBadgeBackgroundColor) {
    browser.browserAction.setBadgeBackgroundColor({
      color: badgeBackgroundColor[color],
      tabId: tab.id,
    })
  }
};

// Set background icon for browser.
export const setGlobalIcon = async (enabled: boolean) => {
  // This sets global icon
  if (browser.browserAction.setIcon) {
    const tabAwait = await browser.tabs.query({
      active: true,
      windowType: 'normal',
    });
    tabAwait.forEach(tab => {
      if (tab.id !== browser.tabs.TAB_ID_NONE) {
        browser.browserAction.setIcon({
          path: {
            48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
          },
          tabId: tab.id,
        });
      }
    });
    // Set Global Icon
    browser.browserAction.setIcon({
      path: {
        48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
      },
    });
  }
}

// Check if the site is protected and adjust the icon and titles appropriately
export const checkIfProtected = async (
  state: State,
  tab: browser.tabs.Tab | undefined = undefined,
  cookieLength: number = 0,
) => {
  let currentTab: browser.tabs.Tab;

  if (!tab) {
    const tabAwait = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentTab = tabAwait[0];
  } else {
    currentTab = tab;
  }

  setGlobalIcon(true);

  const otherWindows: browser.tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: false,
  });

  otherWindows.forEach(owt => {
    if (state.settings.activeMode.value === false) {
      showNumberofCookiesinTitle(owt, {platformOS: state.cache.platformOs, listType: 'DISABLED'});
      setGlobalIcon(false);
      return;
    }

    const matched = returnMatchedExpressionObject(
      state,
      currentTab.cookieStoreId || 'default',
      getHostname(owt.url || ''),
    );
    if (matched) {
      showNumberofCookiesinTitle(owt, {platformOS: state.cache.platformOs, listType: matched.listType});
      // Can't set icons on Android.
      if (state.cache.platformOs && state.cache.platformOs === 'android') {
        return;
      }
      switch (matched.listType) {
        case ListType.WHITE:
          setIconColor(owt);
          break;
        case ListType.GREY:
          setIconColor(owt, state.settings.keepDefaultIcon.value as boolean, 'yellow');
          break;
        default:
          setIconColor(owt, state.settings.keepDefaultIcon.value as boolean, 'red');
          break;
      }
    } else {
      showNumberofCookiesinTitle(owt, {platformOS: state.cache.platformOs, listType: 'NO LIST'});
      // Can't set icons on Android.
      if (state.cache.platformOs && state.cache.platformOs === 'android') {
        return;
      }
      setIconColor(owt);
    }
  });

  if (state.settings.activeMode.value === false) {
    showNumberofCookiesinTitle(currentTab, {platformOS: state.cache.platformOs, listType: 'DISABLED', cookieLength});
    setGlobalIcon(false);
    return;
  }

  const matchedExpression = returnMatchedExpressionObject(
    state,
    currentTab.cookieStoreId || 'default',
    getHostname(currentTab.url || ''),
  );

  if (matchedExpression) {
    showNumberofCookiesinTitle(currentTab, {platformOS: state.cache.platformOs, listType: matchedExpression.listType, cookieLength});
  } else {
    showNumberofCookiesinTitle(currentTab, {platformOS: state.cache.platformOs, listType: 'NO LIST', cookieLength});
  }

  // Can't set icons on Android.
  if (state.cache.platformOs && state.cache.platformOs === 'android') {
    return;
  }

  if (matchedExpression) {
    switch (matchedExpression.listType) {
      case ListType.WHITE:
        setIconColor(currentTab);
        break;
      case ListType.GREY:
        setIconColor(currentTab, state.settings.keepDefaultIcon.value as boolean, 'yellow');
        break;
      default:
        setIconColor(currentTab, state.settings.keepDefaultIcon.value as boolean, 'red');
        break;
    }
  } else {
    if (cookieLength === 0) {
      setIconColor(currentTab);
    } else {
      setIconColor(currentTab, state.settings.keepDefaultIcon.value as boolean, 'red');
    }
  }
};
