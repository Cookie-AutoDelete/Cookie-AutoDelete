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
import {
  createAction,
  createAsyncThunk,
  type ActionCreator,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import browser from 'webextension-polyfill';
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
import type { CleanupProperties } from '../typings/Cleanup';
import { ListType, SettingID, SiteDataType } from '../typings/Enums';
import type {
  Expression,
  Setting,
  StoreIdToExpressionList,
} from '../typings/Global';
import { addActivity } from './ActivityLogSlice';
import { incrementCookieDeletedCounter } from './CookieDeletedCounterSlices';
import {
  addExpression as addExpressionAction,
  clearExpressions as clearExpressionsAction,
  removeExpression as removeExpressionAction,
  removeList as removeListAction,
  updateExpression as updateExpressionAction,
} from './ListsSlice';
import { ReduxConstants } from './ReduxConstants';
import {
  initialState as initialSettings,
  updateSetting,
} from './SettingsSlice';
import type { State } from './Store';

// Those actions can only work in background scripts. To use them in the UI,
// invoke their UI versions. webext-redux will dispatch these thunk actions through aliases.

export const addExpression: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>,
  [Expression]
> = (payload) => (dispatch, getState) => {
  // Sanitize the payload's storeId
  const storeId = getStoreId(getState(), payload.storeId);
  const defaultOptions = getContainerExpressionDefault(
    getState(),
    storeId,
    payload.listType as ListType,
  );

  dispatch(
    addExpressionAction({
      ...payload,
      cleanAllCookies:
        payload.cleanAllCookies !== undefined
          ? payload.cleanAllCookies
          : defaultOptions.cleanAllCookies,
      cleanSiteData: payload.cleanSiteData
        ? payload.cleanSiteData
        : defaultOptions.cleanSiteData || [],
      storeId,
    }),
  );
  checkIfProtected(getState());
};

export const clearExpressions: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>,
  [StoreIdToExpressionList]
> = (payload) => (dispatch, getState) => {
  dispatch(clearExpressionsAction(payload));
  checkIfProtected(getState());
};

export const removeExpression: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>,
  [Expression]
> = (payload) => (dispatch, getState) => {
  dispatch(
    removeExpressionAction({
      ...payload,
      // Sanitize the payload's storeId
      storeId: getStoreId(getState(), payload.storeId),
    }),
  );
  checkIfProtected(getState());
};

export const updateExpression: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>,
  [Expression]
> = (payload) => (dispatch, getState) => {
  // Sanitize the payload's storeId
  const sanitizedStoreId = getStoreId(getState(), payload.storeId);
  dispatch(
    updateExpressionAction({
      ...payload,
      storeId: sanitizedStoreId,
    }),
  );
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
        dispatch(
          updateSetting({
            name: `${payload.listType.toLowerCase()}CleanLocalstorage`,
            value: true,
          }),
        );
      }
    } else {
      if (
        getSetting(
          getState(),
          `${payload.listType.toLowerCase()}CleanLocalstorage` as SettingID,
        )
      ) {
        // Disable Deprecated Option
        dispatch(
          updateSetting({
            name: `${payload.listType.toLowerCase()}CleanLocalstorage`,
            value: false,
          }),
        );
      }
    }
  }
  checkIfProtected(getState());
};

export const removeList: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>,
  [string]
> = (payload) => (dispatch, getState) => {
  dispatch(removeListAction(payload));
  checkIfProtected(getState());
};

// Validates the setting object and adds missing settings if it doesn't already exist in the initialState
export const validateSettings: ActionCreator<
  ThunkAction<void, State, unknown, UnknownAction>
> = () => (dispatch, getState) => {
  const { cache, settings } = getState();
  const settingKeys = Object.keys(settings);
  const initialSettingKeys = Object.keys(initialSettings);

  settingKeys.forEach((k) => {
    // Properties in a individual setting do not match up.  Repopulate from the default one and reuse existing value
    if (
      initialSettings[k] !== undefined &&
      Object.keys(settings[k]).length !== Object.keys(initialSettings[k]).length
    ) {
      dispatch(
        updateSetting({
          ...initialSettings[k],
          value: settings[k].value,
        }),
      );
    }
  });

  // Missing a setting
  if (settingKeys.length !== initialSettingKeys.length) {
    initialSettingKeys.forEach((k) => {
      if (settings[k] === undefined) {
        dispatch(updateSetting(initialSettings[k]));
      }
    });
  }

  function disableSettingIfTrue(s: Setting) {
    if (s && s.value) {
      dispatch(
        updateSetting({
          ...s,
          value: false,
        }),
      );
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
  if ((settings[SettingID.CLEAN_DELAY].value as number) < 1) {
    dispatch(
      updateSetting({
        name: SettingID.CLEAN_DELAY,
        value: 1,
      }),
    );
  }
  // Maximum 2147483 seconds due to signed 32-bit Integer (ms x 1000)
  if ((settings[SettingID.CLEAN_DELAY].value as number) > 2147483) {
    dispatch(
      updateSetting({
        name: SettingID.CLEAN_DELAY,
        value: 2147483,
      }),
    );
  }

  // If show cookie count in badge is disabled, force change icon color instead
  if (
    !settings[SettingID.NUM_COOKIES_ICON].value &&
    settings[SettingID.KEEP_DEFAULT_ICON].value
  ) {
    disableSettingIfTrue(settings[SettingID.KEEP_DEFAULT_ICON]);
  }
};

// Cookie Cleanup operation that is to be called from the React UI
export const cookieCleanup = createAsyncThunk(
  'actions/background/cookieCleanup',
  async (
    options: CleanupProperties = {
      greyCleanup: false,
      ignoreOpenTabs: false,
    },
    { dispatch, getState },
  ) => {
    const state = getState() as State;
    const cleanupDoneObject = await cleanCookiesOperation(state, options);
    if (!cleanupDoneObject) return;

    const { setOfDeletedDomainCookies, cachedResults } = cleanupDoneObject;
    const { browsingDataCleanup, recentlyCleaned, siteDataCleaned } =
      cachedResults;

    // Increment the count
    if (recentlyCleaned !== 0 && getSetting(state, SettingID.STAT_LOGGING)) {
      dispatch(incrementCookieDeletedCounter(recentlyCleaned));
    }

    if (
      (recentlyCleaned !== 0 || siteDataCleaned) &&
      getSetting(state, SettingID.STAT_LOGGING)
    ) {
      dispatch(addActivity(cachedResults));
    }

    // Show notifications after cleanup
    if (getSetting(state, SettingID.NOTIFY_AUTO)) {
      const domainsAll = new Set<string>();
      Object.values(cachedResults.storeIds).forEach((v) => {
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
          duration: getSetting(state, SettingID.NOTIFY_DURATION) as number,
          msg: `${notifyMessage} ...`,
          title: browser.i18n.getMessage('notificationTitle'),
        });
        await sleep(750);
      }
      // Here we just show a generic 'Site Data' cleaned instead of the specifics, with all domains.
      if (siteDataCleaned && browsingDataCleanup && bDomains.size > 0) {
        showNotification({
          duration: getSetting(state, SettingID.NOTIFY_DURATION) as number,
          msg: browser.i18n.getMessage('activityLogSiteDataDomainsText', [
            browser.i18n.getMessage('siteDataText'),
            Array.from(bDomains).join(', '),
          ]),
          title: browser.i18n.getMessage('notificationTitleSiteData'),
        });
        await sleep(750);
      }
    }
  },
);

export const handleStartUp = createAction(ReduxConstants.ON_STARTUP);
