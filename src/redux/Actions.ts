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

import { ActionCreator, Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { checkIfProtected } from '../services/BrowserActionService';
import { cleanCookiesOperation } from '../services/CleanupService';
import {
  getContainerExpressionDefault,
  getSetting,
  getStoreId,
  isChrome,
  isFirefoxAndroid,
  showNotification,
  sleep,
} from '../services/Libs';
import {
  ADD_ACTIVITY_LOG,
  ADD_EXPRESSION,
  CLEAR_ACTIVITY_LOG,
  CLEAR_EXPRESSIONS,
  COOKIE_CLEANUP,
  INCREMENT_COOKIE_DELETED_COUNTER,
  ReduxAction,
  ReduxConstants,
  REMOVE_ACTIVITY_LOG,
  REMOVE_EXPRESSION,
  REMOVE_LIST,
  RESET_ALL,
  RESET_COOKIE_DELETED_COUNTER,
  RESET_SETTINGS,
  UPDATE_EXPRESSION,
  UPDATE_SETTING,
} from '../typings/ReduxConstants';
import { initialState } from './State';

export const addExpressionUI = (payload: Expression): ADD_EXPRESSION => ({
  payload,
  type: ReduxConstants.ADD_EXPRESSION,
});

export const clearExpressionsUI = (
  payload: StoreIdToExpressionList,
): CLEAR_EXPRESSIONS => ({
  payload,
  type: ReduxConstants.CLEAR_EXPRESSIONS,
});

export const removeExpressionUI = (payload: Expression): REMOVE_EXPRESSION => ({
  payload,
  type: ReduxConstants.REMOVE_EXPRESSION,
});
export const updateExpressionUI = (payload: Expression): UPDATE_EXPRESSION => ({
  payload,
  type: ReduxConstants.UPDATE_EXPRESSION,
});
export const removeListUI = (
  payload: keyof StoreIdToExpressionList,
): REMOVE_LIST => ({
  payload,
  type: ReduxConstants.REMOVE_LIST,
});

export const addExpression = (payload: Expression) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
): void => {
  // Sanitize the payload's storeId
  const storeId = getStoreId(getState(), payload.storeId);
  const defaultOptions = getContainerExpressionDefault(
    getState(),
    storeId,
    payload.listType as ListType,
  );

  dispatch({
    payload: {
      ...payload,
      cleanAllCookies: payload.cleanAllCookies
        ? payload.cleanAllCookies
        : defaultOptions.cleanAllCookies,
      cleanSiteData: payload.cleanSiteData
        ? payload.cleanSiteData
        : defaultOptions.cleanSiteData || [],
      storeId,
    },
    type: ReduxConstants.ADD_EXPRESSION,
  });
  checkIfProtected(getState());
};

export const clearExpressions = (payload: StoreIdToExpressionList) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
): void => {
  dispatch({
    payload,
    type: ReduxConstants.CLEAR_EXPRESSIONS,
  });
  checkIfProtected(getState());
};

export const removeExpression = (payload: Expression) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
): void => {
  dispatch({
    payload: {
      ...payload,
      // Sanitize the payload's storeId
      storeId: getStoreId(getState(), payload.storeId),
    },
    type: ReduxConstants.REMOVE_EXPRESSION,
  });
  checkIfProtected(getState());
};

export const updateExpression = (payload: Expression) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
): void => {
  // Sanitize the payload's storeId
  const sanitizedStoreId = getStoreId(getState(), payload.storeId);
  dispatch({
    payload: {
      ...payload,
      storeId: sanitizedStoreId,
    },
    type: ReduxConstants.UPDATE_EXPRESSION,
  });
  // Migration Downgrades between 3.5.0 and 3.4.0
  // Uncheck 'Keep LocalStorage' on New ... Expressions
  if (
    payload.expression === `_Default:${payload.listType}` &&
    sanitizedStoreId === 'default' &&
    payload.cleanSiteData
  ) {
    if (payload.cleanSiteData.includes(SiteDataType.LOCALSTORAGE)) {
      if (
        !getSetting(
          getState(),
          `${payload.listType.toLowerCase()}CleanLocalstorage` as SettingID,
        )
      ) {
        // Enable Deprecated Option
        dispatch({
          payload: {
            name: `${payload.listType.toLowerCase()}CleanLocalstorage`,
            value: true,
          },
          type: ReduxConstants.UPDATE_SETTING,
        });
      }
    } else {
      if (
        getSetting(
          getState(),
          `${payload.listType.toLowerCase()}CleanLocalstorage` as SettingID,
        )
      ) {
        // Disable Deprecated Option
        dispatch({
          payload: {
            name: `${payload.listType.toLowerCase()}CleanLocalstorage`,
            value: false,
          },
          type: ReduxConstants.UPDATE_SETTING,
        });
      }
    }
  }
  checkIfProtected(getState());
};

export const removeList = (payload: keyof StoreIdToExpressionList) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
): void => {
  dispatch({
    payload,
    type: ReduxConstants.REMOVE_LIST,
  });
  checkIfProtected(getState());
};

export const addActivity = (payload: ActivityLog): ADD_ACTIVITY_LOG => ({
  payload,
  type: ReduxConstants.ADD_ACTIVITY_LOG,
});

export const clearActivities = (): CLEAR_ACTIVITY_LOG => ({
  type: ReduxConstants.CLEAR_ACTIVITY_LOG,
});

export const removeActivity = (payload: ActivityLog): REMOVE_ACTIVITY_LOG => ({
  payload,
  type: ReduxConstants.REMOVE_ACTIVITY_LOG,
});

export const incrementCookieDeletedCounter = (
  payload: number,
): INCREMENT_COOKIE_DELETED_COUNTER => ({
  payload,
  type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER,
});

export const resetCookieDeletedCounter = (): RESET_COOKIE_DELETED_COUNTER => ({
  type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
});

export const updateSetting = (payload: Setting): UPDATE_SETTING => ({
  payload,
  type: ReduxConstants.UPDATE_SETTING,
});

export const resetSettings = (): RESET_SETTINGS => ({
  type: ReduxConstants.RESET_SETTINGS,
});

export const resetAll = (): RESET_ALL => ({
  type: ReduxConstants.RESET_ALL,
});

// Validates the setting object and adds missing settings if it doesn't already exist in the initialState
export const validateSettings: ActionCreator<ThunkAction<
  void,
  State,
  null,
  ReduxAction
>> = () => (dispatch, getState) => {
  const { cache, settings } = getState();
  const initialSettings = initialState.settings;
  const settingKeys = Object.keys(settings);
  const initialSettingKeys = Object.keys(initialSettings);

  settingKeys.forEach((k) => {
    // Properties in a individual setting do not match up.  Repopulate from the default one and reuse existing value
    if (
      initialSettings[k] !== undefined &&
      Object.keys(settings[k]).length !== Object.keys(initialSettings[k]).length
    ) {
      dispatch({
        payload: {
          ...initialSettings[k],
          value: settings[k].value,
        },
        type: ReduxConstants.UPDATE_SETTING,
      });
    }
  });

  // Missing a setting
  if (settingKeys.length !== initialSettingKeys.length) {
    initialSettingKeys.forEach((k) => {
      if (settings[k] === undefined) {
        dispatch({
          payload: initialSettings[k],
          type: ReduxConstants.UPDATE_SETTING,
        });
      }
    });
  }

  function disableSettingIfTrue(s: Setting) {
    if (s && s.value) {
      dispatch({
        payload: {
          ...s,
          value: false,
        },
        type: ReduxConstants.UPDATE_SETTING,
      });
    }
  }

  // Disable unusable setting in Chrome
  if (isChrome(cache)) {
    disableSettingIfTrue(settings[SettingID.CONTEXTUAL_IDENTITIES]);
  }
  // Disable unusable setting in Firefox Android
  if (isFirefoxAndroid(cache)) {
    disableSettingIfTrue(settings[SettingID.NUM_COOKIES_ICON]);
    disableSettingIfTrue(settings[SettingID.CLEANUP_LOCALSTORAGE_OLD]);
    disableSettingIfTrue(settings[SettingID.CLEANUP_LOCALSTORAGE]);
    disableSettingIfTrue(settings[SettingID.CONTEXTUAL_IDENTITIES]);
    disableSettingIfTrue(settings[SettingID.CONTEXT_MENUS]);
  }

  // Minimum 1 second autoclean delay.
  if (settings[SettingID.CLEAN_DELAY].value < 1) {
    dispatch({
      payload: {
        name: SettingID.CLEAN_DELAY,
        value: 1,
      },
      type: ReduxConstants.UPDATE_SETTING,
    });
  }
  // Maximum 2147483 seconds due to signed 32-bit Integer (ms x 1000)
  if (settings[SettingID.CLEAN_DELAY].value > 2147483) {
    dispatch({
      payload: {
        name: SettingID.CLEAN_DELAY,
        value: 2147483,
      },
      type: ReduxConstants.UPDATE_SETTING,
    });
  }

  // If show cookie count in badge is disabled, force change icon color instead
  if (
    !settings[SettingID.NUM_COOKIES_ICON].value &&
    settings[SettingID.KEEP_DEFAULT_ICON].value
  ) {
    disableSettingIfTrue(settings[SettingID.KEEP_DEFAULT_ICON]);
  }
};

export const cookieCleanupUI = (
  payload: CleanupProperties,
): COOKIE_CLEANUP => ({
  payload,
  type: ReduxConstants.COOKIE_CLEANUP,
});

// Cookie Cleanup operation that is to be called from the React UI
export const cookieCleanup: ActionCreator<ThunkAction<
  void,
  State,
  null,
  ReduxAction
>> = (
  options: CleanupProperties = { greyCleanup: false, ignoreOpenTabs: false },
) => async (dispatch, getState) => {
  const cleanupDoneObject = await cleanCookiesOperation(getState(), options);
  if (!cleanupDoneObject) return;
  const { setOfDeletedDomainCookies, cachedResults } = cleanupDoneObject;
  const {
    browsingDataCleanup,
    recentlyCleaned,
    siteDataCleaned,
  } = cachedResults as ActivityLog;

  // Increment the count
  if (recentlyCleaned !== 0 && getSetting(getState(), SettingID.STAT_LOGGING)) {
    dispatch(incrementCookieDeletedCounter(recentlyCleaned));
  }

  if (
    (recentlyCleaned !== 0 || siteDataCleaned) &&
    getSetting(getState(), SettingID.STAT_LOGGING)
  ) {
    dispatch(addActivity(cachedResults));
  }

  // Show notifications after cleanup
  if (getSetting(getState(), SettingID.NOTIFY_AUTO)) {
    const domainsAll = new Set<string>();
    Object.values((cachedResults as ActivityLog).storeIds).forEach((v) => {
      v.forEach((d) => domainsAll.add(d.cookie.hostname));
    });
    const bDomains = new Set<string>();
    // Count for Summary Notification
    if (browsingDataCleanup) {
      for (const domains of Object.values(browsingDataCleanup)) {
        if (!domains || domains.length === 0) continue;
        domains.forEach((d) => bDomains.add(d));
      }
      bDomains.forEach((d) => domainsAll.add(d));
    }

    if (setOfDeletedDomainCookies.length > 0) {
      // Cookie Notification
      const notifyMessage = browser.i18n.getMessage('notificationContent', [
        recentlyCleaned.toString(),
        domainsAll.size.toString(),
        (setOfDeletedDomainCookies as string[]).slice(0, 5).join(', '),
      ]);
      showNotification({
        duration: getSetting(getState(), SettingID.NOTIFY_DURATION) as number,
        msg: `${notifyMessage} ...`,
        title: browser.i18n.getMessage('notificationTitle'),
      });
      await sleep(750);
    }
    // Here we just show a generic 'Site Data' cleaned instead of the specifics, with all domains.
    if (siteDataCleaned && browsingDataCleanup && bDomains.size > 0) {
      await showNotification({
        duration: getSetting(getState(), SettingID.NOTIFY_DURATION) as number,
        msg: browser.i18n.getMessage('activityLogSiteDataDomainsText', [
          browser.i18n.getMessage('siteDataText'),
          Array.from(bDomains).join(', '),
        ]),
        title: browser.i18n.getMessage('notificationTitleSiteData'),
      });
    }
  }
};
