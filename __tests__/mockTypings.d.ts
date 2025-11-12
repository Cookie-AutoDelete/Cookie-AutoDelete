/* eslint-disable no-var */
type Browser = typeof import('webextension-polyfill');
type JestSpyObject<T extends Record<string, unknown>> = {
  [key in keyof T]: T[key] extends (...args: infer P) => infer R
    ? jest.SpyInstance<R, P>
    : never;
};

type MockedBrowser = {
  alarms: {
    get: jest.Mock;
  };
  cookies: {
    set: jest.Mock;
    getAll: jest.Mock;
    remove: jest.Mock;
    onChanged: {
      addListener: jest.Mock;
      removeListener: jest.Mock;
      hasListener: jest.Mock;
    };
  };
  runtime: {
    getManifest: jest.Mock;
    getURL: jest.Mock;
    getPlatformInfo: jest.Mock;
  };
  notifications: {
    create: jest.Mock;
    clear: jest.Mock;
  };
  tabs: {
    query: jest.Mock;
    executeScript: jest.Mock;
  };
  i18n: {
    getMessage: jest.Mock;
  };
  extension: {
    isAllowedIncognitoAccess: jest.Mock;
  };
  browsingData: {
    remove: jest.Mock;
  };
  contextualIdentities?: {
    query: jest.Mock;
  };
};

declare var browser: Browser & MockedBrowser;
declare var chrome: Browser & MockedBrowser;

declare var browserDetect: jest.Mock<
  import('../src/typings/Enums').BrowserName,
  []
>;
declare function generateSpies<T extends Record<string, unknown>>(
  v: T,
): JestSpyObject<T>;
declare function generateSpies<T extends { new (...args: any[]) }>(
  v: T,
): JestSpyObject<{
  [K in keyof T]: T[K];
}>;
