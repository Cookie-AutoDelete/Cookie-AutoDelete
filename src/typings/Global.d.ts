declare module '*.json';
declare var global: any;
declare var browserDetect: () => string;

type StoreIdToExpressionList = Readonly<{
  [storeId: string]: ReadonlyArray<Expression>;
}>;

type MapToSettingObject = Readonly<{ [setting: string]: Setting }>;

type CacheMap = Readonly<{ [key: string]: any }>;

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
  cleanLocalStorage?: boolean;
  cleanAllCookies?: boolean;
  listType: ListType;
  storeId: string;
  id?: string;
  cookieNames?: string[];
}>;

type Setting = Readonly<{
  id: string | number;
  name: string;
  value: boolean | number | string;
}>;

declare const enum ListType {
  WHITE = 'WHITE',
  GREY = 'GREY',
}

type ReleaseNote = {
  version: string;
  notes: string[];
};
