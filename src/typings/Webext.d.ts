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

declare module 'redux-webext';
