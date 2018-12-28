export const enum ReduxConstants {
  ADD_EXPRESSION = 'ADD_EXPRESSION',
  REMOVE_EXPRESSION = 'REMOVE_EXPRESSION',
  UPDATE_EXPRESSION = 'UPDATE_EXPRESSION',
  COOKIE_CLEANUP = 'COOKIE_CLEANUP',
  ON_STARTUP = 'ON_STARTUP',
  ADD_CACHE = 'ADD_CACHE',
  INCREMENT_COOKIE_DELETED_COUNTER = 'INCREMENT_COOKIE_DELETED_COUNTER',
  RESET_COOKIE_DELETED_COUNTER = 'RESET_COOKIE_DELETED_COUNTER',
  UPDATE_SETTING = 'UPDATE_SETTING',
  RESET_SETTINGS = 'RESET_SETTINGS',
  ADD_ACTIVITY_LOG = 'ADD_ACTIVITY_LOG',
}

export type ReduxAction =
  | ADD_EXPRESSION
  | REMOVE_EXPRESSION
  | UPDATE_EXPRESSION
  | COOKIE_CLEANUP
  | ON_STARTUP
  | ADD_CACHE
  | INCREMENT_COOKIE_DELETED_COUNTER
  | RESET_COOKIE_DELETED_COUNTER
  | UPDATE_SETTING
  | RESET_SETTINGS
  | ADD_ACTIVITY_LOG;

export type ADD_EXPRESSION = Readonly<{
  type: ReduxConstants.ADD_EXPRESSION;
  payload: Expression;
}>;
export type REMOVE_EXPRESSION = Readonly<{
  type: ReduxConstants.REMOVE_EXPRESSION;
  payload: Expression | { id: string; storeId: string };
}>;
export type UPDATE_EXPRESSION = Readonly<{
  type: ReduxConstants.UPDATE_EXPRESSION;
  payload: Expression;
}>;
export type COOKIE_CLEANUP = Readonly<{
  type: ReduxConstants.COOKIE_CLEANUP;
  payload: CleanupProperties;
}>;
export type ON_STARTUP = Readonly<{
  type: ReduxConstants.ON_STARTUP;
}>;
export type ADD_CACHE = Readonly<{
  type: ReduxConstants.ADD_CACHE;
  payload: any;
}>;
export type INCREMENT_COOKIE_DELETED_COUNTER = Readonly<{
  type: ReduxConstants.INCREMENT_COOKIE_DELETED_COUNTER;
  payload?: number;
}>;
export type RESET_COOKIE_DELETED_COUNTER = Readonly<{
  type: ReduxConstants.RESET_COOKIE_DELETED_COUNTER;
}>;
export type UPDATE_SETTING = Readonly<{
  type: ReduxConstants.UPDATE_SETTING;
  payload: Setting;
}>;
export type RESET_SETTINGS = Readonly<{
  type: ReduxConstants.RESET_SETTINGS;
}>;
export type ADD_ACTIVITY_LOG = Readonly<{
  type: ReduxConstants.ADD_ACTIVITY_LOG;
  payload: ActivityLog;
}>;
