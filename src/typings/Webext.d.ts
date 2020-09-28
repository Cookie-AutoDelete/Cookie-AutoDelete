/* eslint-disable @typescript-eslint/no-unused-vars */
// This file is only a stub to make typescript happy.
// Tests uses global.browser.*, actual usage is browser.*
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

declare namespace browser.browsingData {
  function remove(
    removalOptions: {
      hostnames?: string[];
      origins?: string[]; // Added in Chrome 74+
      since?: number;
    },
    dataTypeSet: {
      cache?: boolean;
      indexedDB?: boolean;
      localStorage?: boolean;
      pluginData?: boolean;
      serviceWorkers?: boolean;
    },
  ): Promise<void>;
}

declare namespace browser.cookies {
  interface CookieProperties extends browser.cookies.Cookie {
    firstPartyDomain?: string;
  }
  type OptionalCookieProperties = Partial<CookieProperties>;
}

// Until web-ext-types land this, per https://github.com/kelseasy/web-ext-types/issues/81#issuecomment-527758881
declare namespace browser.contextMenus {
  type ContextType = browser.menus.ContextType;
  type ItemType = browser.menus.ItemType;
  type OnClickData = browser.menus.OnClickData;
  const create: typeof browser.menus.create;
  const getTargetElement: typeof browser.menus.getTargetElement;
  const refresh: typeof browser.menus.refresh;
  const remove: typeof browser.menus.remove;
  const removeAll: typeof browser.menus.removeAll;
  const update: typeof browser.menus.update;
  const onClicked: typeof browser.menus.onClicked;
  const onHidden: typeof browser.menus.onHidden;
  const onShown: typeof browser.menus.onShown;
}

// Until web-ext-types land events into it.
declare namespace browser.contextualIdentities {
  type contextualIdentitiesChangeInfo = {
    contextualIdentity: ContextualIdentity;
  };
  const onCreated: Listener<contextualIdentitiesChangeInfo>;
  const onRemoved: Listener<contextualIdentitiesChangeInfo>;
  const onUpdated: Listener<contextualIdentitiesChangeInfo>;
}

declare namespace browser.tabs {
  interface TabChangeInfo {
    attention?: boolean;
    audible?: boolean;
    cookieChanged?: {
      removed: boolean;
      cookie: browser.cookies.Cookie;
      cause: browser.cookies.OnChangedCause;
    };
    discarded?: boolean;
    favIconUrl?: string;
    hidden?: boolean;
    isArticle?: boolean;
    mutedInfo?: browser.tabs.MutedInfo;
    pinned?: boolean;
    status?: string;
    title?: string;
    url?: string;
  }
}

declare module 'redux-webext';
