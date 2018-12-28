type CleanupProperties = {
  greyCleanup: boolean;
  ignoreOpenTabs: boolean;
};

type ActivityLog = {
  dateTime: string;
  recentlyCleaned: number;
  storeIds: {
    [storeId: string]: {
      [hostname: string]: { decision?: boolean; reason?: string };
    };
  };
} & {
  // Remove this after update
  [storeId: string]: any;
};

interface CleanupPropertiesInternal extends CleanupProperties {
  cachedResults: ActivityLog;

  hostnamesDeleted: Set<String>;
  openTabDomains: Set<String>;
  setOfDeletedDomainCookies: Set<String>;
}

interface CookiePropertiesCleanup extends browser.cookies.CookieProperties {
  mainDomain: string;
  hostname: string;
}
