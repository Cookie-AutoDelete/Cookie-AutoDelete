import { State } from '../../src/redux/Store';
import { initialState as initialSettings } from '../../src/redux/SettingsSlice';

export const initialState: State = {
  activityLog: [],
  cache: {},
  cookieDeletedCounterSession: 0,
  cookieDeletedCounterTotal: 0,
  settings: initialSettings,
  lists: {},
};