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

declare module '*.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare const global: any;
declare const browserDetect: () => browserName;

/**
 * This only works if browserDetect function doesn't change its return method/string.
 */
declare const enum browserName {
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

type StoreIdToExpressionList = Readonly<{
  [storeId: string]: ReadonlyArray<Expression>;
}>;

type MapToSettingObject = Readonly<{ [setting: string]: Setting }>;

type CacheMap = Readonly<
  { [browserDetect: string]: browserName } & { [key: string]: any }
>;

type GetState = () => State;

type State = Readonly<{
  lists: StoreIdToExpressionList;
  cookieDeletedCounterTotal: number;
  cookieDeletedCounterSession: number;
  settings: MapToSettingObject;
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
}>;

type Expression = Readonly<{
  expression: string;
  cleanAllCookies?: boolean;
  // Deprecated as of 3.5.0, but kept for backwards-compatibility for pre-3.4.0.
  cleanLocalStorage?: boolean;
  cleanSiteData?: SiteDataType[];
  listType: ListType;
  storeId: string;
  id?: string;
  cookieNames?: string[];
}>;

declare const enum SiteDataType {
  CACHE = 'Cache',
  INDEXEDDB = 'IndexedDB',
  LOCALSTORAGE = 'LocalStorage',
  PLUGINDATA = 'PluginData',
  SERVICEWORKERS = 'ServiceWorkers',
}

type Setting = Readonly<{
  id?: string | number;
  name: string;
  value: boolean | number | string;
}>;

declare const enum SettingID {
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
  CLEANUP_PLUGIN_DATA = 'pluginDataCleanup',
  CLEANUP_SERVICE_WORKERS = 'serviceWorkersCleanup',
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
  SIZE_POPUP = 'sizePopup',
  SIZE_SETTING = 'sizeSetting',
  STAT_LOGGING = 'statLogging',
}

declare const enum ListType {
  WHITE = 'WHITE',
  GREY = 'GREY',
}

interface ReleaseNote {
  readonly version: string;
  readonly notes: string[];
}

type CookieCountMsg = Readonly<{
  popupHostname?: string;
  cookieUpdated?: boolean;
}>;

type CADLogItem = Readonly<{
  type?: string;
  level?: number;
  msg?: string;
  x?: any;
}>;

declare const enum EventListenerAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

type JestSpyObject = { [s: string]: jest.SpyInstance };
