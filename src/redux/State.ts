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

// tslint:disable:object-literal-sort-keys

export const initialState: State = {
  lists: {},
  cookieDeletedCounterTotal: 0,
  cookieDeletedCounterSession: 0,
  settings: {
    [`${SettingID.ACTIVE_MODE}`]: {
      name: `${SettingID.ACTIVE_MODE}`,
      value: false,
    },
    [`${SettingID.CLEANUP_CACHE}`]: {
      name: `${SettingID.CLEANUP_CACHE}`,
      value: false,
    },
    [`${SettingID.CLEAN_OPEN_TABS_STARTUP}`]: {
      name: `${SettingID.CLEAN_OPEN_TABS_STARTUP}`,
      value: false,
    },
    [`${SettingID.CLEAN_EXPIRED}`]: {
      name: `${SettingID.CLEAN_EXPIRED}`,
      value: false,
    },
    [`${SettingID.CONTEXT_MENUS}`]: {
      name: `${SettingID.CONTEXT_MENUS}`,
      value: true,
    },
    [`${SettingID.CONTEXTUAL_IDENTITIES}`]: {
      name: `${SettingID.CONTEXTUAL_IDENTITIES}`,
      value: false,
    },
    [`${SettingID.DEBUG_MODE}`]: {
      name: `${SettingID.DEBUG_MODE}`,
      value: false,
    },
    [`${SettingID.CLEAN_DELAY}`]: {
      name: `${SettingID.CLEAN_DELAY}`,
      value: 15,
    },
    [`${SettingID.CLEAN_DISCARDED}`]: {
      name: `${SettingID.CLEAN_DISCARDED}`,
      value: false,
    },
    [`${SettingID.CLEAN_DOMAIN_CHANGE}`]: {
      name: `${SettingID.CLEAN_DOMAIN_CHANGE}`,
      value: false,
    },
    [`${SettingID.ENABLE_GREYLIST}`]: {
      name: `${SettingID.ENABLE_GREYLIST}`,
      value: true,
    },
    [`${SettingID.ENABLE_NEW_POPUP}`]: {
      name: `${SettingID.ENABLE_NEW_POPUP}`,
      value: false,
    },
    [`${SettingID.OLD_GREY_CLEAN_LOCALSTORAGE}`]: {
      id: 'DEPRECATED - use default expressions',
      name: `${SettingID.OLD_GREY_CLEAN_LOCALSTORAGE}`,
      value: false,
    },
    [`${SettingID.CLEANUP_INDEXEDDB}`]: {
      name: `${SettingID.CLEANUP_INDEXEDDB}`,
      value: false,
    },
    [`${SettingID.KEEP_DEFAULT_ICON}`]: {
      name: `${SettingID.KEEP_DEFAULT_ICON}`,
      value: false,
    },
    [`${SettingID.CLEANUP_LOCALSTORAGE_OLD}`]: {
      id: 'DEPRECATED - use localStorageCleanup',
      name: `${SettingID.CLEANUP_LOCALSTORAGE_OLD}`,
      value: false,
    },
    [`${SettingID.CLEANUP_LOCALSTORAGE}`]: {
      name: `${SettingID.CLEANUP_LOCALSTORAGE}`,
      value: false,
    },
    [`${SettingID.NOTIFY_MANUAL}`]: {
      name: `${SettingID.NOTIFY_MANUAL}`,
      value: true,
    },
    [`${SettingID.NOTIFY_DURATION}`]: {
      name: `${SettingID.NOTIFY_DURATION}`,
      value: 3,
    },
    [`${SettingID.CLEANUP_PLUGIN_DATA}`]: {
      name: `${SettingID.CLEANUP_PLUGIN_DATA}`,
      value: false,
    },
    [`${SettingID.CLEANUP_SERVICE_WORKERS}`]: {
      name: `${SettingID.CLEANUP_SERVICE_WORKERS}`,
      value: false,
    },
    [`${SettingID.NOTIFY_AUTO}`]: {
      name: `${SettingID.NOTIFY_AUTO}`,
      value: true,
    },
    [`${SettingID.NUM_COOKIES_ICON}`]: {
      name: `${SettingID.NUM_COOKIES_ICON}`,
      value: true,
    },
    [`${SettingID.SIZE_POPUP}`]: {
      name: `${SettingID.SIZE_POPUP}`,
      value: 16,
    },
    [`${SettingID.SIZE_SETTING}`]: {
      name: `${SettingID.SIZE_SETTING}`,
      value: 16,
    },
    [`${SettingID.STAT_LOGGING}`]: {
      name: `${SettingID.STAT_LOGGING}`,
      value: true,
    },
    [`${SettingID.OLD_WHITE_CLEAN_LOCALSTORAGE}`]: {
      id: 'DEPRECATED - use default expressions',
      name: `${SettingID.OLD_WHITE_CLEAN_LOCALSTORAGE}`,
      value: false,
    },
  },
  activityLog: [],
  cache: {},
};
