/**
 * Copyright (c) 2020-2022 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
  createSlice,
  isAnyOf,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { SettingID } from '../typings/Enums';
import type { MapToSettingObject, Setting } from '../typings/Global';
import { ReduxConstants } from './ReduxConstants';
import { resetAll } from './SharedActions';

const initialState: MapToSettingObject = {
  [SettingID.ACTIVE_MODE]: {
    name: SettingID.ACTIVE_MODE,
    value: false,
  },
  [SettingID.CLEANUP_CACHE]: {
    name: SettingID.CLEANUP_CACHE,
    value: false,
  },
  [SettingID.CLEAN_OPEN_TABS_STARTUP]: {
    name: SettingID.CLEAN_OPEN_TABS_STARTUP,
    value: false,
  },
  [SettingID.CLEAN_EXPIRED]: {
    name: SettingID.CLEAN_EXPIRED,
    value: false,
  },
  [SettingID.CONTEXT_MENUS]: {
    name: SettingID.CONTEXT_MENUS,
    value: true,
  },
  [SettingID.CONTEXTUAL_IDENTITIES]: {
    name: SettingID.CONTEXTUAL_IDENTITIES,
    value: false,
  },
  [SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE]: {
    name: SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
    value: true,
  },
  [SettingID.DEBUG_MODE]: {
    name: SettingID.DEBUG_MODE,
    value: false,
  },
  [SettingID.CLEAN_DELAY]: {
    name: SettingID.CLEAN_DELAY,
    value: 15,
  },
  [SettingID.CLEAN_DISCARDED]: {
    name: SettingID.CLEAN_DISCARDED,
    value: false,
  },
  [SettingID.CLEAN_DOMAIN_CHANGE]: {
    name: SettingID.CLEAN_DOMAIN_CHANGE,
    value: false,
  },
  [SettingID.ENABLE_GREYLIST]: {
    name: SettingID.ENABLE_GREYLIST,
    value: true,
  },
  [SettingID.ENABLE_NEW_POPUP]: {
    name: SettingID.ENABLE_NEW_POPUP,
    value: false,
  },
  [SettingID.OLD_GREY_CLEAN_LOCALSTORAGE]: {
    id: 'DEPRECATED - use default expressions',
    name: SettingID.OLD_GREY_CLEAN_LOCALSTORAGE,
    value: false,
  },
  [SettingID.CLEANUP_INDEXEDDB]: {
    name: SettingID.CLEANUP_INDEXEDDB,
    value: false,
  },
  [SettingID.KEEP_DEFAULT_ICON]: {
    name: SettingID.KEEP_DEFAULT_ICON,
    value: false,
  },
  [SettingID.CLEANUP_LOCALSTORAGE_OLD]: {
    id: 'DEPRECATED - use localStorageCleanup',
    name: SettingID.CLEANUP_LOCALSTORAGE_OLD,
    value: false,
  },
  [SettingID.CLEANUP_LOCALSTORAGE]: {
    name: SettingID.CLEANUP_LOCALSTORAGE,
    value: false,
  },
  [SettingID.NOTIFY_MANUAL]: {
    name: SettingID.NOTIFY_MANUAL,
    value: true,
  },
  [SettingID.NOTIFY_DURATION]: {
    name: SettingID.NOTIFY_DURATION,
    value: 3,
  },
  [SettingID.CLEANUP_PLUGINDATA]: {
    name: SettingID.CLEANUP_PLUGINDATA,
    value: false,
  },
  [SettingID.CLEANUP_SERVICEWORKERS]: {
    name: SettingID.CLEANUP_SERVICEWORKERS,
    value: false,
  },
  [SettingID.NOTIFY_AUTO]: {
    name: SettingID.NOTIFY_AUTO,
    value: true,
  },
  [SettingID.NUM_COOKIES_ICON]: {
    name: SettingID.NUM_COOKIES_ICON,
    value: true,
  },
  [SettingID.SITEDATA_EMPTY_ON_ENABLE]: {
    name: SettingID.SITEDATA_EMPTY_ON_ENABLE,
    value: true,
  },
  [SettingID.SIZE_POPUP]: {
    name: SettingID.SIZE_POPUP,
    value: 16,
  },
  [SettingID.SIZE_SETTING]: {
    name: SettingID.SIZE_SETTING,
    value: 16,
  },
  [SettingID.STAT_LOGGING]: {
    name: SettingID.STAT_LOGGING,
    value: true,
  },
  [SettingID.OLD_WHITE_CLEAN_LOCALSTORAGE]: {
    id: 'DEPRECATED - use default expressions',
    name: SettingID.OLD_WHITE_CLEAN_LOCALSTORAGE,
    value: false,
  },
};

const actions = {
  resetSettings: createAction(ReduxConstants.RESET_SETTINGS),
  resetAll,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSetting: (state, action: PayloadAction<Setting>) => {
      const newObject = {
        ...state,
      };
      newObject[action.payload.name] = {
        ...action.payload,
      };
      return newObject;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(actions.resetAll, actions.resetSettings),
        () => initialState,
      )
      .addDefaultCase((state) => state);
  },
});

export const { updateSetting, resetSettings } = {
  ...settingsSlice.actions,
  ...actions,
};

export { initialState };

export const selectSettings = settingsSlice.selectSlice;

export const selectSettingValues = <TSettingIDs extends Array<SettingID>>(
  state: MapToSettingObject,
  ...settingIDs: TSettingIDs
) => {
  const selectedSettings = {} as {
    [K in TSettingIDs[number]]: Setting['value'];
  };
  settingIDs.forEach((id) => {
    if (state[id]) {
      selectedSettings[id as TSettingIDs[number]] = state[id].value;
    }
  });
  return selectedSettings;
};

export default settingsSlice.reducer;
