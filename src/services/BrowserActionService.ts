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
  if (cookieLength === 0) {
    browser.browserAction.setBadgeText({
      tabId: tab.id,
      text: '',
    });
  } else {
    browser.browserAction.setBadgeText({
      tabId: tab.id,
      text: cookieLength.toString(),
    });
    if (browser.browserAction.setBadgeTextColor) {
      browser.browserAction.setBadgeTextColor({
        color: 'white',
        tabId: tab.id,
      });
    }
  }
};

// Set BrowserAction Title with number of cookies in square brackets.
export const showNumberofCookiesinTitle = async (
  tab: browser.tabs.Tab,
  cookieLength: number
) => {
  const tabTitle = await browser.browserAction.getTitle({tabId: tab.id});
  if (tabTitle.search(/\[ \d+ \]$/) === -1) {
    browser.browserAction.setTitle({
      tabId: tab.id,
      title: `${tabTitle} [ ${cookieLength} ]`,
    });
  } else {
    browser.browserAction.setTitle({
      tabId: tab.id,
      title: `${tabTitle.replace(/\[ \d+ \]/,`[ ${cookieLength} ]`)}`,
    });
  }
}

// Set background icon to yellow
const setIconYellow = (tab: browser.tabs.Tab) => {
  browser.browserAction.setIcon({
    path: {
      48: 'icons/icon_yellow_48.png',
    },
    tabId: tab.id,
  });

  browser.browserAction.setBadgeBackgroundColor({
    color: '#e6a32e',
    tabId: tab.id,
  });
};

// Set background icon to red
export const setIconRed = (tab: browser.tabs.Tab) => {
  browser.browserAction.setIcon({
    path: {
      48: 'icons/icon_red_48.png',
    },
    tabId: tab.id,
  });

  browser.browserAction.setBadgeBackgroundColor({
    color: 'red',
    tabId: tab.id,
  });
};

// Set background icon to blue
const setIconDefault = (tab: browser.tabs.Tab) => {
  browser.browserAction.setIcon({
    path: {
      48: 'icons/icon_48.png',
    },
    tabId: tab.id,
  });

  browser.browserAction.setBadgeBackgroundColor({
    color: 'blue',
    tabId: tab.id,
  });
};

// Check if the site is protected and adjust the icon appropriately
export const checkIfProtected = async (
  state: State,
  tab: browser.tabs.Tab | undefined = undefined,
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

  const hostname = getHostname(currentTab.url || '');
  const matchedExpression = returnMatchedExpressionObject(
    state,
    currentTab.cookieStoreId || 'default',
    hostname,
  );
  if (matchedExpression && matchedExpression.listType === ListType.WHITE) {
    setIconDefault(currentTab);
  } else if (
    matchedExpression &&
    matchedExpression.listType === ListType.GREY
  ) {
    setIconYellow(currentTab);
  } else {
    setIconRed(currentTab);
  }
};
