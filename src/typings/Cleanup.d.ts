type CleanupProperties = {
  greyCleanup: boolean;
  ignoreOpenTabs: boolean;
};

type ActivityLog = {
  dateTime: string;
  recentlyCleaned: number;
  storeIds: {
    [storeId: string]: CleanReasonObject[];
  };
} & {
  // Remove this after update
  [storeId: string]: any;
};

interface CleanupPropertiesInternal extends CleanupProperties {
  openTabDomains: Set<String>;
}

declare const enum ReasonKeep {
  OpenTabs = 'reasonKeepOpenTab',
  MatchedExpression = 'reasonKeep',
}

declare const enum ReasonClean {
  StartupNoMatchedExpression = 'reasonCleanStartupNoList',
  StartupCleanupAndGreyList = 'reasonCleanGreyList',
  NoMatchedExpression = 'reasonCleanNoList',
  MatchedExpressionButNoCookieName = 'reasonCleanCookieName',
}

declare const enum OpenTabStatus {
  TabsWasNotIgnored = 'reasonTabsWereNotIgnored',
  TabsWereIgnored = 'reasonTabsWereIgnored',
}

interface CleanReasonObject {
  cached: boolean;
  cleanCookie: boolean;
  reason: ReasonKeep | ReasonClean;
  openTabStatus: OpenTabStatus;
  expression?: Expression;
  cookie: CookiePropertiesCleanup;
}

interface CookiePropertiesCleanup extends browser.cookies.CookieProperties {
  mainDomain: string;
  hostname: string;
  preparedCookieDomain: string;
}
