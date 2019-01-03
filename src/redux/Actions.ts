/**
 * Copyright (c) 2017 Kenny Do
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
import { getSetting, getStoreId } from '../services/Libs';
import {
  ADD_ACTIVITY_LOG,
  ADD_EXPRESSION,
  COOKIE_CLEANUP,
  INCREMENT_COOKIE_DELETED_COUNTER,
  ReduxAction,
  ReduxConstants,
  REMOVE_ACTIVITY_LOG,
  REMOVE_EXPRESSION,
  RESET_COOKIE_DELETED_COUNTER,
  RESET_SETTINGS,
  UPDATE_EXPRESSION,
  UPDATE_SETTING,
} from '../typings/ReduxConstants';
import { initialState } from './State';

const COOKIE_CLEANUP_NOTIFICATION = 'COOKIE_CLEANUP_NOTIFICATION';

export const addExpressionUI = (payload: Expression): ADD_EXPRESSION => ({
  payload,
  type: ReduxConstants.ADD_EXPRESSION,
});

export const removeExpressionUI = (payload: Expression): REMOVE_EXPRESSION => ({
  payload,
  type: ReduxConstants.REMOVE_EXPRESSION,
});
export const updateExpressionUI = (payload: Expression): UPDATE_EXPRESSION => ({
  payload,
  type: ReduxConstants.UPDATE_EXPRESSION,
});

export const addExpression = (payload: Expression) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
) => {
  dispatch({
    payload: {
      ...payload,
      // Sanitize the payload's storeId
      storeId: getStoreId(getState(), payload.storeId),
    },
    type: ReduxConstants.ADD_EXPRESSION,
  });
  checkIfProtected(getState());
};

export const removeExpression = (payload: Expression) => (
  dispatch: Dispatch<ReduxAction>,
  getState: GetState,
) => {
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
) => {
  dispatch({
    payload: {
      ...payload,
      // Sanitize the payload's storeId
      storeId: getStoreId(getState(), payload.storeId),
    },
    type: ReduxConstants.UPDATE_EXPRESSION,
  });
  checkIfProtected(getState());
};

export const addActivity = (payload: ActivityLog): ADD_ACTIVITY_LOG => ({
  payload,
  type: ReduxConstants.ADD_ACTIVITY_LOG,
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

// Validates the setting object and adds missing settings if it doesn't already exist in the initialState.json
export const validateSettings: ActionCreator<
  ThunkAction<void, State, null, ReduxAction>
> = () => (dispatch, getState) => {
  const { settings } = getState();
  const initialSettings = initialState.settings;
  const settingKeys = Object.keys(settings);
  const initialSettingKeys = Object.keys(initialSettings);

  const invividalSettingKeysMatch =
    Object.keys(settings[settingKeys[0]]).length ===
    Object.keys(initialSettings[initialSettingKeys[0]]).length;

  // Missing a property in a individual setting
  if (!invividalSettingKeysMatch) {
    settingKeys.forEach(element => {
      dispatch({
        payload: settings[element],
        type: ReduxConstants.UPDATE_SETTING,
      });
    });
  }

  // Missing a setting
  if (settingKeys.length !== initialSettingKeys.length) {
    initialSettingKeys.forEach(element => {
      if (settings[element] === undefined) {
        dispatch({
          payload: initialSettings[element],
          type: ReduxConstants.UPDATE_SETTING,
        });
      }
    });
  }
};

export const cookieCleanupUI = (
  payload: CleanupProperties,
): COOKIE_CLEANUP => ({
  payload,
  type: ReduxConstants.COOKIE_CLEANUP,
});

// Cookie Cleanup operation that is to be called from the React UI
export const cookieCleanup: ActionCreator<
  ThunkAction<void, State, null, ReduxAction>
> = (
  options: CleanupProperties = { greyCleanup: false, ignoreOpenTabs: false },
) => async (dispatch, getState) => {
  const newOptions = options;

  const cleanupDoneObject = await cleanCookiesOperation(getState(), newOptions);
  if (!cleanupDoneObject) return;
  const { setOfDeletedDomainCookies, cachedResults } = cleanupDoneObject;
  const { recentlyCleaned } = cachedResults;

  // Increment the count
  if (recentlyCleaned !== 0 && getSetting(getState(), 'statLogging')) {
    dispatch(incrementCookieDeletedCounter(recentlyCleaned));
  }

  if (recentlyCleaned !== 0 && getSetting(getState(), 'statLogging')) {
    dispatch(addActivity(cachedResults));
  }

  // Show notifications after cleanup
  if (
    setOfDeletedDomainCookies.size > 0 &&
    getSetting(getState(), 'showNotificationAfterCleanup')
  ) {
    const notifyMessage = browser.i18n.getMessage('notificationContent', [
      recentlyCleaned.toString(),
      Array.from(setOfDeletedDomainCookies).join(', '),
    ]);
    browser.notifications.create(COOKIE_CLEANUP_NOTIFICATION, {
      iconUrl: browser.extension.getURL('icons/icon_48.png'),
      message: notifyMessage,
      title: browser.i18n.getMessage('notificationTitle'),
      type: 'basic',
    });
    const seconds = parseInt(
      `${getSetting(getState(), 'notificationOnScreen')}000`,
      10,
    );
    setTimeout(() => {
      browser.notifications.clear(COOKIE_CLEANUP_NOTIFICATION);
    }, seconds);
  }
};

// Map the cookieStoreId to their actual names and store in cache
export const cacheCookieStoreIdNames = () => async (
  dispatch: Dispatch<ReduxAction>,
) => {
  const contextualIdentitiesObjects = await browser.contextualIdentities.query(
    {},
  );
  dispatch({
    payload: {
      key: 'default',
      value: 'Default',
    },
    type: ReduxConstants.ADD_CACHE,
  });
  dispatch({
    payload: {
      key: 'firefox-default',
      value: 'Default',
    },
    type: ReduxConstants.ADD_CACHE,
  });
  dispatch({
    payload: {
      key: 'firefox-private',
      value: 'Private',
    },
    type: ReduxConstants.ADD_CACHE,
  });
  contextualIdentitiesObjects.forEach(object =>
    dispatch({
      payload: {
        key: object.cookieStoreId,
        value: object.name,
      },
      type: ReduxConstants.ADD_CACHE,
    }),
  );
};
