import {
    createAction,
    createSlice,
    isAnyOf,
    type PayloadAction,
} from '@reduxjs/toolkit';
import type { ActivityLog } from '../typings/Cleanup';
import { ReduxConstants } from './ReduxConstants';
import { resetAll } from './SharedActions';

const initialState: ReadonlyArray<ActivityLog> = [];

const actions = {
  clearActivities: createAction(ReduxConstants.CLEAR_ACTIVITY_LOG),
  resetAll,
};

const activityLogSlice = createSlice({
  name: 'activityLog',
  initialState,
  reducers: {
    addActivity: (state, action: PayloadAction<ActivityLog>) => {
      if (
        Object.keys(action.payload.storeIds).length > 0 ||
        action.payload.siteDataCleaned
      ) {
        return [action.payload, ...state].slice(0, 10);
      }
      return state;
    },
    removeActivity: (state, action: PayloadAction<ActivityLog>) => {
      return state.filter((log) => log.dateTime !== action.payload.dateTime);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(actions.resetAll, actions.clearActivities),
        () => initialState,
      )
      .addDefaultCase((state) => state);
  },
});

export const { addActivity, removeActivity, clearActivities } = {
  ...activityLogSlice.actions,
  ...actions,
};

export const selectActivityLog = activityLogSlice.selectSlice;

export default activityLogSlice.reducer;
