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

export const enum FilterOptions {
  NONE,
  CLEAN,
  KEEP,
}

export const enum SiteDataType {
  CACHE = 'Cache',
  INDEXEDDB = 'IndexedDB',
  LOCALSTORAGE = 'LocalStorage',
  PLUGINDATA = 'PluginData',
  SERVICEWORKERS = 'ServiceWorkers',
}

export const enum SettingID {
  ACTIVE_MODE = 'activeMode',
  CLEAN_DELAY = 'delayBeforeClean',
  CLEAN_DISCARDED = 'discardedCleanup',
  CLEAN_DOMAIN_CHANGE = 'domainChangeCleanup',
  CLEAN_EXPIRED = 'cleanExpiredCookies',
  CLEAN_OPEN_TABS_STARTUP = 'cleanCookiesFromOpenTabsOnStartup',
  CLEANUP_CACHE = 'cacheCleanup',
  CLEANUP_INDEXEDDB = 'indexedDBCleanup',
  CLEANUP_LOCALSTORAGE = 'localStorageCleanup',
  CLEANUP_LOCALSTORAGE_OLD = 'localstorageCleanup',
  CLEANUP_PLUGINDATA = 'pluginDataCleanup',
  CLEANUP_SERVICEWORKERS = 'serviceWorkersCleanup',
  CONTEXT_MENUS = 'contextMenus',
  CONTEXTUAL_IDENTITIES = 'contextualIdentities',
  CONTEXTUAL_IDENTITIES_AUTOREMOVE = 'contextualIdentitiesAutoRemove',
  DEBUG_MODE = 'debugMode',
  ENABLE_GREYLIST = 'enableGreyListCleanup',
  ENABLE_NEW_POPUP = 'enableNewVersionPopup',
  KEEP_DEFAULT_ICON = 'keepDefaultIcon',
  NOTIFY_AUTO = 'showNotificationAfterCleanup',
  NOTIFY_MANUAL = 'manualNotifications',
  NOTIFY_DURATION = 'notificationOnScreen',
  NUM_COOKIES_ICON = 'showNumOfCookiesInIcon',
  OLD_GREY_CLEAN_LOCALSTORAGE = 'greyCleanLocalstorage',
  OLD_WHITE_CLEAN_LOCALSTORAGE = 'whiteCleanLocalstorage',
  SITEDATA_EMPTY_ON_ENABLE = 'siteDataEmptyOnEnable',
  SIZE_POPUP = 'sizePopup',
  SIZE_SETTING = 'sizeSetting',
  STAT_LOGGING = 'statLogging',
}

export const enum ListType {
  WHITE = 'WHITE',
  GREY = 'GREY',
}

export const enum EventListenerAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

/**
 * This only works if browserDetect function doesn't change its return method/string.
 */
export const enum BrowserName {
  Firefox = 'Firefox',
  Chrome = 'Chrome',
  Safari = 'Safari',
  Opera = 'Opera',
  IE = 'IE',
  Edge = 'Edge',
  EdgeChromium = 'EdgeChromium',
  Blink = 'Blink',
  Unknown = 'UnknownBrowser',
}

export const enum ReasonKeep {
  OpenTabs = 'reasonKeepOpenTab',
  MatchedExpression = 'reasonKeep',
}

export const enum ReasonClean {
  StartupNoMatchedExpression = 'reasonCleanStartupNoList',
  StartupCleanupAndGreyList = 'reasonCleanGreyList',
  NoMatchedExpression = 'reasonCleanNoList',
  MatchedExpressionButNoCookieName = 'reasonCleanCookieName',
  ExpiredCookie = 'reasonCleanCookieExpired',
  ExpiredCookieRestart = 'reasonCleanCookieExpiredRestart',
  CADSiteDataCookie = 'reasonCADSiteDataCookie',
  CADSiteDataCookieRestart = 'reasonCADSiteDataCookieRestart',
}

export const enum OpenTabStatus {
  TabsWasNotIgnored = 'reasonTabsWereNotIgnored',
  TabsWereIgnored = 'reasonTabsWereIgnored',
}
