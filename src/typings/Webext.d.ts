declare namespace browser.browsingData {
  function removeLocalStorage(removalOptions: {
    hostnames?: string[];
    since?: number;
  }): Promise<void>;
}

declare namespace browser.cookies {
  interface CookieProperties extends browser.cookies.Cookie {
    firstPartyDomain?: string;
  }
  type OptionalCookieProperties = Partial<CookieProperties>;
}
declare namespace browser.privacy.websites.firstPartyIsolate {
  function get(emptyObject: {}): { value: boolean };
}
declare namespace browser.browserAction {
  function setBadgeTextColor(details: {}): {
    color: string;
    tabId?: number;
    windowId?: number;
  };
}

declare module 'redux-webext';
