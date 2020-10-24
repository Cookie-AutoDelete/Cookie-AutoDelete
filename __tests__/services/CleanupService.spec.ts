import { advanceTo, clear } from 'jest-date-mock';
import { when } from 'jest-when';
import { initialState } from '../../src/redux/State';
import {
  cleanCookies,
  cleanCookiesOperation,
  cleanSiteData,
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
  clearSiteDataForThisDomain,
  filterSiteData,
  isSafeToClean,
  otherBrowsingDataCleanup,
  prepareCookie,
  removeSiteData,
  returnContainersOfOpenTabDomains,
} from '../../src/services/CleanupService';

jest.requireActual('../../src/services/Libs');
import * as Lib from '../../src/services/Libs';

// This dynamically generates the spies for all functions in Libs
const spyLib: JestSpyObject = global.generateSpies(Lib);

jest.requireActual('../../src/services/CleanupService');
import * as CleanupService from '../../src/services/CleanupService';
import { CADCOOKIENAME } from '../../src/services/Libs';
const spyCleanupService: JestSpyObject = global.generateSpies(CleanupService);

const sampleTab: browser.tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-default',
  hidden: false,
  highlighted: false,
  incognito: false,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  selected: true,
  url: 'https://example.com',
  windowId: 1,
};

const wildCardWhiteListGoogle: Expression = {
  expression: '*.google.com',
  id: '1',
  listType: ListType.GREY,
  storeId: 'default',
};

const whiteListYoutube: Expression = {
  expression: 'youtube.com',
  cleanSiteData: [SiteDataType.CACHE],
  id: '2',
  listType: ListType.WHITE,
  storeId: 'default',
};

const wildCardGreyFacebook: Expression = {
  expression: '*.facebook.com',
  id: '3',
  listType: ListType.GREY,
  storeId: 'firefox-container-1',
};

const wildCardGreyGit: Expression = {
  expression: 'git*b.com',
  id: '4',
  listType: ListType.GREY,
  storeId: 'default',
};

const whiteListAllExceptTwitter: Expression = {
  expression: '/^((?!twitter[.]com).)+$/',
  id: '5',
  listType: ListType.WHITE,
  storeId: 'default',
};

const greyMessenger: Expression = {
  expression: 'messenger.com',
  cleanSiteData: [SiteDataType.CACHE],
  id: '6',
  listType: ListType.GREY,
  storeId: 'firefox-container-1',
};

const exampleWithCookieName: Expression = {
  cleanAllCookies: false,
  cookieNames: ['in-cookie-names'],
  expression: 'examplewithcookiename.com',
  id: '7',
  listType: ListType.WHITE,
  storeId: 'default',
};

const exampleWithCookieNameCleanAllCookiesTrue: Expression = {
  ...exampleWithCookieName,
  cleanAllCookies: true,
  expression: 'exampleWithCookieNameCleanAllCookiesTrue.com',
  id: '8',
};

const exampleWithCookieNameGrey: Expression = {
  ...exampleWithCookieName,
  id: '9',
  listType: ListType.GREY,
  storeId: 'firefox-container-1',
};

const sampleState: State = {
  ...initialState,
  lists: {
    default: [
      wildCardGreyGit,
      wildCardWhiteListGoogle,
      whiteListYoutube,
      exampleWithCookieName,
      exampleWithCookieNameCleanAllCookiesTrue,
    ],
    'firefox-container-1': [
      wildCardGreyFacebook,
      greyMessenger,
      exampleWithCookieNameGrey,
    ],
  },
};

const mockCookie: CookiePropertiesCleanup = {
  domain: 'test.com',
  hostOnly: true,
  hostname: 'test.com',
  httpOnly: true,
  mainDomain: 'test.com',
  name: 'key',
  path: '/',
  preparedCookieDomain: 'https://test.com/',
  sameSite: 'no_restriction',
  secure: true,
  session: true,
  storeId: 'firefox-default',
  value: 'value',
};

const fileCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: '',
  hostname: 'file:///test/test.html',
  mainDomain: 'file:///test/test.html',
  path: 'file:///test/',
  preparedCookieDomain: 'file:///test/test.html',
};

const googleCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'google.com',
  name: 'NID',
  path: '/',
  secure: true,
};

const youtubeCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'youtube.com',
  name: 'SID',
  path: '/',
  secure: true,
};
const yahooCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'yahoo.com',
  name: 'BID',
  path: '/login',
  secure: false,
};

const openTabCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'sub.domain.com',
  name: 'openTab',
};

const githubCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'github.com',
  name: 'greylist',
};

const personalGoogleCookie: CookiePropertiesCleanup = {
  ...mockCookie,
  domain: 'google.com',
  name: 'NID',
  path: '/',
  secure: true,
  storeId: 'firefox-container-1',
};

describe('CleanupService', () => {
  beforeEach(() => {
    // For First Party Isolations not enabled
    when(global.browser.cookies.getAll)
      .calledWith({ domain: '' })
      .mockResolvedValue([] as never);
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' });
    when(global.browser.notifications.create)
      .calledWith(expect.any(String), expect.any(Object))
      .mockResolvedValue('testID' as never);
    when(global.browser.notifications.clear)
      .calledWith(expect.any(String))
      .mockResolvedValue(true as never);
  });
  afterEach(() => {
    clear();
  });
  describe('cleanCookies()', () => {
    const cookies = [
      googleCookie,
      personalGoogleCookie,
      openTabCookie,
      yahooCookie,
      youtubeCookie,
    ];

    const removeCookies: CleanReasonObject[] = cookies.map((cookie) => {
      return {
        cached: false,
        cleanCookie: true,
        cookie,
        reason: ReasonClean.NoMatchedExpression,
      } as CleanReasonObject;
    });

    beforeAll(() => {
      when(global.browser.i18n.getMessage)
        .calledWith(expect.any(String))
        .mockReturnValue('');
      when(global.browser.i18n.getMessage)
        .calledWith(expect.any(String), expect.any(Array))
        .mockReturnValue('');
    });

    it('should be called 5 times for cookies.remove', async () => {
      await cleanCookies(initialState, removeCookies);
      expect(global.browser.cookies.remove).toBeCalledTimes(5);
    });

    it('should throw an error for cookies.remove', async () => {
      when(global.browser.cookies.remove)
        .calledWith(expect.any(Object))
        .mockResolvedValueOnce(true as never)
        .mockRejectedValueOnce(new Error('test') as never);
      await expect(cleanCookies(initialState, removeCookies)).rejects.toThrow();
      expect(global.browser.cookies.remove.mock.results[2].value).toEqual(
        undefined,
      );
      expect(global.browser.cookies.remove.mock.results[3].value).toEqual(
        undefined,
      );
    });
  });

  describe('cleanCookiesOperation()', () => {
    const cleanupProperties: CleanupProperties = {
      greyCleanup: false,
      ignoreOpenTabs: false,
    };
    beforeEach(() => {
      when(global.browser.tabs.query)
        .calledWith(expect.any(Object))
        .mockResolvedValue([
          {
            cookieStoreId: 'firefox-default',
            url: 'https://google.com/search',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'http://facebook.com/search',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'http://sub.domain.com',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'moz-extension://test/settings/settings.html',
          },
        ] as never);
      advanceTo(new Date('2020-06-01 12:34:56'));
    });
    afterEach(() => {
      when(global.browser.extension.isAllowedIncognitoAccess)
        .calledWith()
        .mockResolvedValue(false as never);
      when(global.browser.cookies.getAll)
        .calledWith(expect.any(Object))
        .mockResolvedValue([] as never);
      when(global.browser.cookies.remove)
        .calledWith(expect.any(Object))
        .mockResolvedValue({} as never);
    });

    it('should not clean anything if browserDetect value is missing or is not Firefox or Chrome', async () => {
      const spyBrowserDetect = jest.spyOn(global, 'browserDetect');
      await cleanCookiesOperation(sampleState, cleanupProperties);
      expect(spyBrowserDetect).toHaveBeenCalledTimes(1);
      expect(global.browser.cookies.remove).not.toHaveBeenCalled();
    });

    describe('via Firefox Browser / Common Functions', () => {
      const firefoxState = {
        ...sampleState,
        cache: {
          browserDetect: browserName.Firefox,
          browserVersion: '77',
          platformOs: 'desktop',
        },
      };
      const firefoxDebugState = {
        ...firefoxState,
        settings: {
          ...firefoxState.settings,
          [SettingID.DEBUG_MODE]: {
            name: SettingID.DEBUG_MODE,
            value: true,
          },
        },
      };
      beforeEach(() => {
        when(global.browser.contextualIdentities.query)
          .calledWith({})
          .mockResolvedValue([
            { cookieStoreId: 'firefox-container-1' },
          ] as never);
        when(global.browser.cookies.getAllCookieStores)
          .calledWith()
          .mockResolvedValue([{ id: 'firefox-default' }] as never);
        when(global.browser.cookies.getAll)
          .calledWith({ storeId: 'firefox-default' })
          .mockResolvedValue([
            mockCookie, // no list
            googleCookie, // greylist, opentab
            youtubeCookie, // whitelist
            yahooCookie, // no list
            openTabCookie, // opentab
            githubCookie, // greylist
          ] as never);
      });

      it('Regular clean, exclude open tabs.', async () => {
        const ffResult = await cleanCookiesOperation(
          firefoxState,
          cleanupProperties,
        );
        expect(
          global.browser.contextualIdentities.query,
        ).not.toHaveBeenCalled();
        expect(
          global.browser.extension.isAllowedIncognitoAccess,
        ).toHaveBeenCalledTimes(1);
        expect(global.browser.cookies.getAllCookieStores).toHaveBeenCalledTimes(
          1,
        );
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: 'firefox-default',
        });
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: 'default',
        });
        expect(global.browser.cookies.remove).toHaveBeenCalledTimes(2);
        expect(global.browser.browsingData.remove).not.toHaveBeenCalled();
        expect(ffResult.cachedResults.dateTime.indexOf('12:34:56')).not.toBe(
          -1,
        );
        expect(ffResult.cachedResults.recentlyCleaned).toBe(2);
        expect(ffResult.setOfDeletedDomainCookies).toEqual([
          'test.com',
          'yahoo.com',
        ]);
      });

      it('If cleanupProperties is missing, presume Regular clean, exclude open tabs.', async () => {
        await cleanCookiesOperation(firefoxState);
        expect(global.browser.cookies.remove).toHaveBeenCalledTimes(2);
      });

      it('Browser Restart clean, exclude open tabs.', async () => {
        const ffResult = await cleanCookiesOperation(firefoxState, {
          ...cleanupProperties,
          greyCleanup: true,
        });
        expect(global.browser.cookies.remove).toHaveBeenCalledTimes(3);
        expect(ffResult.cachedResults.recentlyCleaned).toBe(3);
        expect(ffResult.setOfDeletedDomainCookies).toEqual([
          'test.com',
          'yahoo.com',
          'github.com',
        ]);
      });

      it('Browser Restart clean, include open tabs.', async () => {
        const ffResult = await cleanCookiesOperation(firefoxState, {
          greyCleanup: true,
          ignoreOpenTabs: true,
        });
        expect(global.browser.cookies.remove).toHaveBeenCalledTimes(5);
        expect(ffResult.cachedResults.recentlyCleaned).toBe(5);
        expect(ffResult.setOfDeletedDomainCookies).toEqual([
          'test.com',
          'google.com',
          'yahoo.com',
          'sub.domain.com',
          'github.com',
        ]);
      });

      it('Regular clean, include open tabs.', async () => {
        const ffResult = await cleanCookiesOperation(firefoxState, {
          ...cleanupProperties,
          ignoreOpenTabs: true,
        });
        expect(global.browser.cookies.remove).toHaveBeenCalledTimes(3);
        expect(ffResult.cachedResults.recentlyCleaned).toBe(3);
        expect(ffResult.setOfDeletedDomainCookies).toEqual([
          'test.com',
          'yahoo.com',
          'sub.domain.com',
        ]);
      });

      it('Regular clean, exclude open tabs, with only cookies in open tabs/whitelist.', async () => {
        when(global.browser.cookies.getAll)
          .calledWith({ storeId: 'firefox-default' })
          .mockResolvedValue([googleCookie, youtubeCookie] as never);
        const ffResult = await cleanCookiesOperation(
          firefoxState,
          cleanupProperties,
        );
        expect(global.browser.cookies.remove).not.toHaveBeenCalled();
        expect(ffResult.cachedResults.recentlyCleaned).toBe(0);
        expect(ffResult.setOfDeletedDomainCookies).toEqual([]);
      });

      it('Regular clean, exclude open tabs to catch errors during browser.cookies.getAll', async () => {
        when(global.browser.cookies.getAll)
          .calledWith(expect.any(Object))
          .mockRejectedValue(new Error('test') as never);
        await cleanCookiesOperation(firefoxState, cleanupProperties);
        expect(global.console.error).toHaveBeenCalledTimes(2);
      });

      it('Debug mode should sanitize cookie value', async () => {
        await cleanCookiesOperation(firefoxDebugState, cleanupProperties);
        // isSafeToCleanObjects Result: cookie.value sanitize (lines 498-507)
        expect(spyLib.cadLog.mock.calls[18][0].x[0].cookie.value).toBe('***');
        // markedForDeletion Result cookie.value sanitize (lines 517-526)
        expect(spyLib.cadLog.mock.calls[25][0].x[0].cookie.value).toBe('***');
      });

      it('Regular clean, exclude open tabs to include errors during cleanCookies / browser.cookies.remove', async () => {
        when(global.browser.cookies.remove)
          .calledWith(expect.any(Object))
          .mockRejectedValue(new Error('test') as never);
        await cleanCookiesOperation(firefoxState, cleanupProperties);
        expect(spyLib.throwErrorNotification).toHaveBeenCalledTimes(1);
      });

      it('should include private cookieStores if extension allowed in private browsing mode', async () => {
        when(global.browser.extension.isAllowedIncognitoAccess)
          .calledWith()
          .mockResolvedValue(true as never);
        await cleanCookiesOperation(firefoxState, cleanupProperties);
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: 'firefox-private',
        });
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: 'private',
        });
      });

      it('should not include sites from private containers in site data domains', async () => {
        when(global.browser.extension.isAllowedIncognitoAccess)
          .calledWith()
          .mockResolvedValue(true as never);
        when(global.browser.cookies.getAll)
          .calledWith({ storeId: 'firefox-private' })
          .mockResolvedValue([
            {
              ...mockCookie,
              domain: 'private.com',
              hostname: 'private.com',
              mainDomain: 'private.com',
              preparedCookieDomain: 'https://private.com/',
              storeId: 'firefox-private',
            },
          ] as never);
        const result = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_CACHE]: {
                name: SettingID.CLEANUP_CACHE,
                value: true,
              },
            },
            cache: {
              ...firefoxState.cache,
              browserVersion: '78',
            },
          },
          cleanupProperties,
        );
        expect(result.cachedResults.browsingDataCleanup.Cache).toEqual(
          expect.not.arrayContaining(['private.com']),
        );
      });

      it('should not clean containers if contextualIdentities is disabled', async () => {
        when(global.browser.cookies.getAllCookieStores)
          .calledWith()
          .mockResolvedValue([
            { id: 'firefox-default' },
            { id: 'firefox-container-1' },
          ] as never);
        await cleanCookiesOperation(firefoxState, cleanupProperties);
        expect(global.browser.cookies.getAll).not.toHaveBeenCalledWith({
          storeId: 'firefox-container-1',
        });
      });

      it('Regular clean, exclude open tabs with contextualIdentities enabled', async () => {
        const contextState = {
          ...firefoxState,
          settings: {
            ...firefoxState.settings,
            [SettingID.CONTEXTUAL_IDENTITIES]: {
              name: SettingID.CONTEXTUAL_IDENTITIES,
              value: true,
            },
          },
        };
        await cleanCookiesOperation(contextState, cleanupProperties);
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: 'firefox-container-1',
        });
      });

      it('should have youtube.com as part of domains that has cache cleared', async () => {
        const ffResult = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_CACHE]: {
                name: SettingID.CLEANUP_CACHE,
                value: true,
              },
            },
            cache: {
              ...firefoxState.cache,
              browserVersion: '78',
            },
          },
          cleanupProperties,
        );
        expect(
          ffResult.cachedResults.browsingDataCleanup[SiteDataType.CACHE],
        ).toEqual(expect.arrayContaining(['youtube.com']));
      });

      it('should have test.com as part of domains that has indexedDB cleared', async () => {
        const ffResult = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_INDEXEDDB]: {
                name: SettingID.CLEANUP_INDEXEDDB,
                value: true,
              },
            },
            cache: {
              ...firefoxState.cache,
              browserVersion: '78',
            },
          },
          cleanupProperties,
        );
        expect(
          ffResult.cachedResults.browsingDataCleanup[SiteDataType.INDEXEDDB],
        ).toEqual(expect.arrayContaining(['test.com']));
      });

      it('should have test.com as part of domains that has localstorage cleared', async () => {
        const ffResult = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_LOCALSTORAGE]: {
                name: SettingID.CLEANUP_LOCALSTORAGE,
                value: true,
              },
            },
          },
          cleanupProperties,
        );
        expect(
          ffResult.cachedResults.browsingDataCleanup[SiteDataType.LOCALSTORAGE],
        ).toEqual(expect.arrayContaining(['test.com']));
      });
      it('should have test.com as part of domains that has pluginData cleared', async () => {
        const ffResult = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_PLUGIN_DATA]: {
                name: SettingID.CLEANUP_PLUGIN_DATA,
                value: true,
              },
            },
            cache: {
              ...firefoxState.cache,
              browserVersion: '78',
            },
          },
          cleanupProperties,
        );
        expect(
          ffResult.cachedResults.browsingDataCleanup[SiteDataType.PLUGINDATA],
        ).toEqual(expect.arrayContaining(['test.com']));
      });
      it('should have test.com as part of domains that has serviceWorkers cleared', async () => {
        const ffResult = await cleanCookiesOperation(
          {
            ...firefoxState,
            settings: {
              ...firefoxState.settings,
              [SettingID.CLEANUP_SERVICE_WORKERS]: {
                name: SettingID.CLEANUP_SERVICE_WORKERS,
                value: true,
              },
            },
            cache: {
              ...firefoxState.cache,
              browserVersion: '78',
            },
          },
          cleanupProperties,
        );
        expect(
          ffResult.cachedResults.browsingDataCleanup[
            SiteDataType.SERVICEWORKERS
          ],
        ).toEqual(expect.arrayContaining(['test.com']));
      });
    });

    describe('via Chrome Browser (Only specifics)', () => {
      const chromeState = {
        ...sampleState,
        cache: {
          browserDetect: browserName.Chrome,
        },
      };
      const chromeCookies = [
        { ...mockCookie, storeId: '0' },
        { ...googleCookie, storeId: '0' },
        { ...youtubeCookie, storeId: '0' },
        { ...yahooCookie, storeId: '0' },
      ];

      beforeEach(() => {
        when(global.browser.cookies.getAllCookieStores)
          .calledWith()
          .mockResolvedValue([{ id: '0' }] as never);
        when(global.browser.cookies.getAll)
          .calledWith({ storeId: '0' })
          .mockResolvedValue(chromeCookies as never);
      });

      it('Regular clean, exclude open tabs (Chrome).', async () => {
        await cleanCookiesOperation(chromeState, cleanupProperties);
        expect(
          global.browser.extension.isAllowedIncognitoAccess,
        ).toHaveBeenCalledTimes(1);
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: '0',
        });
      });

      it('should include private cookieStores if extension allowed in incognito mode', async () => {
        when(global.browser.extension.isAllowedIncognitoAccess)
          .calledWith()
          .mockResolvedValue(true as never);
        await cleanCookiesOperation(chromeState, cleanupProperties);
        expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
          storeId: '1',
        });
      });
    });
  });

  describe('cleanSiteData()', () => {
    afterEach(() => {
      spyCleanupService.removeSiteData.mockRestore();
    });
    const mockCleanReasonObj: CleanReasonObject = {
      cached: false,
      cleanCookie: true,
      cookie: {
        ...youtubeCookie,
      },
      expression: {
        ...whiteListYoutube,
      },
      openTabStatus: OpenTabStatus.TabsWasNotIgnored,
      reason: ReasonClean.MatchedExpressionButNoCookieName,
    };
    const mockCleanReasonObjFile = {
      ...mockCleanReasonObj,
      cookie: {
        ...fileCookie,
      },
    };

    it('should return domains cleaned if there are domains to clean', async () => {
      const result = await cleanSiteData(
        sampleState,
        SiteDataType.CACHE,
        [
          {
            ...mockCleanReasonObj,
            expression: {
              ...whiteListYoutube,
            },
          },
        ],
        browserName.Firefox,
        false,
      );
      expect(result).toEqual(['youtube.com']);
    });

    it('should return empty array if no domains to clean', async () => {
      const result = await cleanSiteData(
        sampleState,
        SiteDataType.CACHE,
        [mockCleanReasonObjFile],
        browserName.Firefox,
        false,
      );
      expect(result).toEqual([]);
    });

    it('should return empty array if removeSiteData returned false', async () => {
      when(global.browser.browsingData.remove)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockRejectedValue(new Error('test') as never);
      const result = await cleanSiteData(
        sampleState,
        SiteDataType.CACHE,
        [
          {
            ...mockCleanReasonObj,
            expression: {
              ...whiteListYoutube,
            },
          },
        ],
        browserName.Firefox,
        false,
      );
      expect(result).toEqual([]);
    });

    it('should call browserDetect if one in cache is undefined', async () => {
      const spyBrowserDetect = jest.spyOn(global, 'browserDetect');
      await cleanSiteData(
        sampleState,
        SiteDataType.CACHE,
        [mockCleanReasonObj],
        undefined,
        false,
      );
      expect(spyBrowserDetect).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCookiesForThisDomain()', () => {
    afterEach(() => {
      global.browser.cookies.getAll.mockReset();
      global.browser.cookies.remove.mockReset();
      global.browser.notifications.create.mockReset();
    });
    const googleCookie2: CookiePropertiesCleanup = {
      ...googleCookie,
      name: 'SID',
    };

    const googleTab = {
      ...sampleTab,
      url: 'https://google.com',
    };

    beforeEach(() => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: '' })
        .mockResolvedValue([] as never);
      when(global.browser.i18n.getMessage)
        .calledWith(expect.any(String), [
          expect.any(Number),
          expect.any(Number),
        ])
        .mockReturnValue('0');
    });

    it('should clean all cookies for active tab domain and show notification.', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'google.com', storeId: 'firefox-default' })
        .mockResolvedValue([googleCookie, googleCookie2] as never);
      when(global.browser.cookies.remove)
        .calledWith(expect.anything())
        .mockResolvedValue({} as never);

      expect(await clearCookiesForThisDomain(initialState, googleTab)).toBe(
        true,
      );
      expect(global.browser.cookies.remove).toBeCalledTimes(2);
      expect(global.browser.notifications.create).toBeCalledTimes(1);
      expect(global.browser.i18n.getMessage.mock.calls[1][0]).toBe(
        'manualCleanSuccess',
      );
      expect(global.browser.i18n.getMessage.mock.calls[2][1]).toEqual([
        '2',
        '2',
      ]);
    });

    it('should just show notification if active tab domain has no cookies', async () => {
      when(global.browser.cookies.remove)
        .calledWith(expect.any(Object))
        .mockResolvedValue({} as never);
      when(global.browser.cookies.getAll)
        .calledWith(expect.any(Object))
        .mockResolvedValue([] as never);

      expect(await clearCookiesForThisDomain(initialState, googleTab)).toBe(
        false,
      );
      expect(global.browser.cookies.remove).toBeCalledTimes(0);
      expect(global.browser.notifications.create).toBeCalledTimes(1);
      expect(global.browser.i18n.getMessage.mock.calls[1][0]).toBe(
        'manualCleanNothing',
      );
    });

    it('should just show notification if active tab domain has only one cookie that for some reason cannot be cleared.', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'google.com', storeId: 'firefox-default' })
        .mockResolvedValue([googleCookie] as never);
      when(global.browser.cookies.remove)
        .calledWith(expect.any(Object))
        .mockResolvedValue(null as never);

      expect(await clearCookiesForThisDomain(initialState, googleTab)).toBe(
        false,
      );
      expect(global.browser.cookies.remove).toBeCalledTimes(1);
      expect(global.browser.notifications.create).toBeCalledTimes(1);
      expect(global.browser.i18n.getMessage.mock.calls[1][0]).toBe(
        'manualCleanSuccess',
      );
      // browser.i18n.getMessage for number of cookies cleaned.
      expect(global.browser.i18n.getMessage.mock.calls[2][1]).toEqual([
        '0',
        '1',
      ]);
    });
  });

  describe('clearLocalStorageForThisDomain()', () => {
    it('should clear localstorage from active tab (via tabs.executeScript)', async () => {
      when(global.browser.tabs.executeScript)
        .calledWith(undefined, expect.any(Object))
        .mockResolvedValue([{ local: 2, session: 0 }] as never);
      expect(
        await clearLocalStorageForThisDomain(initialState, sampleTab),
      ).toBe(true);
      expect(global.browser.tabs.executeScript).toBeCalledTimes(1);
      expect(global.browser.notifications.create).toBeCalledTimes(1);
    });
    it('should show error notification if browser.tabs.executeScript threw and error', async () => {
      when(global.browser.tabs.executeScript)
        .calledWith(undefined, expect.any(Object))
        .mockRejectedValue(new Error('test') as never);
      expect(
        await clearLocalStorageForThisDomain(initialState, sampleTab),
      ).toBe(false);
      expect(global.browser.tabs.executeScript).toBeCalledTimes(1);
      expect(spyLib.throwErrorNotification).toBeCalledTimes(1);
      expect(spyLib.showNotification).toBeCalledTimes(1);
    });
  });

  describe('clearSiteDataForThisDomain()', () => {
    it('should return false if hostname is empty', async () => {
      expect(await clearSiteDataForThisDomain(initialState, 'All', '')).toBe(
        false,
      );
    });
    it('should return false if hostname only has whitespaces', async () => {
      expect(
        await clearSiteDataForThisDomain(
          initialState,
          SiteDataType.CACHE,
          '  ',
        ),
      ).toBe(false);
    });
  });

  describe('filterSiteData()', () => {
    it('should return false for a blank cookie hostname', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
          hostname: '',
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonClean.NoMatchedExpression,
      };
      const result = filterSiteData(cleanReasonObj, SiteDataType.CACHE);
      expect(result).toBe(false);
    });

    it('should return true because of no matched expression', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonClean.NoMatchedExpression,
      };
      const result = filterSiteData(cleanReasonObj, SiteDataType.CACHE);
      expect(result).toBe(true);
    });

    it('should return false because of a matched expression but cleanLocalStorage was undefined', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...youtubeCookie,
        },
        expression: {
          ...whiteListYoutube,
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.MatchedExpression,
      };
      const result = filterSiteData(cleanReasonObj, SiteDataType.LOCALSTORAGE);
      expect(result).toBe(false);
    });

    it('should return true because of a matched expression but do not keep localstorage', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...youtubeCookie,
        },
        expression: {
          ...whiteListYoutube,
          cleanSiteData: [SiteDataType.LOCALSTORAGE],
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.MatchedExpression,
      };
      const result = filterSiteData(cleanReasonObj, SiteDataType.LOCALSTORAGE);
      expect(result).toBe(true);
    });

    it('should return false because of a matched expression but do not keep localstorage + in an open tab', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...youtubeCookie,
        },
        expression: {
          ...whiteListYoutube,
          cleanSiteData: [SiteDataType.LOCALSTORAGE],
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.OpenTabs,
      };
      const result = filterSiteData(cleanReasonObj, SiteDataType.LOCALSTORAGE);
      expect(result).toBe(false);
    });

    it('should not sanitize cookie value in cadLog if debug is off', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonClean.NoMatchedExpression,
      };
      filterSiteData(cleanReasonObj, SiteDataType.CACHE);
      expect(
        spyLib.cadLog.mock.calls[0][0].x.CleanReasonObject.cookie.value,
      ).toEqual('value');
    });
    it('should sanitize cookie value in cadLog if debug is on', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonClean.NoMatchedExpression,
      };
      filterSiteData(cleanReasonObj, SiteDataType.CACHE, true);
      expect(
        spyLib.cadLog.mock.calls[0][0].x.CleanReasonObject.cookie.value,
      ).toEqual('***');
    });
  });

  describe('isSafeToClean()', () => {
    const cleanupProperties = {
      cachedResults: {
        dateTime: '',
        recentlyCleaned: 0,
      },
      greyCleanup: false,
      hostnamesDeleted: new Set(),
      ignoreOpenTabs: false,
      openTabDomains: { 'firefox-default': ['example.com', 'mozilla.org'] },
      setOfDeletedDomainCookies: new Set(),
    };
    const expiredState = {
      ...sampleState,
      settings: {
        ...sampleState.settings,
        [SettingID.CLEAN_EXPIRED]: {
          name: SettingID.CLEAN_EXPIRED,
          value: true,
        },
      },
    };

    it('should return true for yahoo.com', () => {
      const cookieProperty: CookiePropertiesCleanup = {
        ...mockCookie,
        hostname: 'yahoo.com',
        mainDomain: 'yahoo.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.NoMatchedExpression);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for youtube.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'youtube.com',
        mainDomain: 'youtube.com',
      };
      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true for sub.youtube.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'sub.youtube.com',
        mainDomain: 'youtube.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.NoMatchedExpression);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for google.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'google.com',
        mainDomain: 'google.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return false for github.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'github.com',
        mainDomain: 'github.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true for twitter.com when using regular expressions whiteListAllExceptTwitter', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'twitter.com',
        mainDomain: 'twitter.com',
      };
      const sampleRegExpState = {
        ...sampleState,
        lists: {
          ...sampleState.lists,
          default: [...sampleState.lists.default, whiteListAllExceptTwitter],
        },
      };

      const result = isSafeToClean(sampleRegExpState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.NoMatchedExpression);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return true for google.com in Personal', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'google.com',
        mainDomain: 'google.com',
        storeId: 'firefox-container-1',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.NoMatchedExpression);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for sub.google.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'sub.google.com',
        mainDomain: 'google.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return false for example.com because of opentab', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'example.com',
        mainDomain: 'example.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.OpenTabs);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return false for sub.example.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'sub.example.com',
        mainDomain: 'example.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.OpenTabs);
      expect(result.openTabStatus).toBe(OpenTabStatus.TabsWasNotIgnored);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true for sub.example.com because tabs were ignored', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'sub.example.com',
        mainDomain: 'example.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        ignoreOpenTabs: true,
        openTabDomains: {},
      });
      expect(result.reason).toBe(ReasonClean.NoMatchedExpression);
      expect(result.openTabStatus).toBe(OpenTabStatus.TabsWereIgnored);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return true for Facebook in Personal onStartup with Facebook in the Greylist', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'facebook.com',
        mainDomain: 'facebook.com',
        storeId: 'firefox-container-1',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        greyCleanup: true,
      });
      expect(result.reason).toBe(ReasonClean.StartupCleanupAndGreyList);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return true for startup cleanup and no matched expression', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'nomatch.com',
        mainDomain: 'nomatch.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        greyCleanup: true,
      });
      expect(result.reason).toBe(ReasonClean.StartupNoMatchedExpression);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for examplewithcookiename.com because it has a cookie name in the list (keepAllCookies: false)', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'examplewithcookiename.com',
        mainDomain: 'examplewithcookiename.com',
        name: 'in-cookie-names',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true for examplewithcookiename.com because it does not have a cookie name in the list (keepAllCookies: false)', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'examplewithcookiename.com',
        mainDomain: 'examplewithcookiename.com',
        name: 'not-in-cookie-names',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.MatchedExpressionButNoCookieName);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for exampleWithCookieNameCleanAllCookiesTrue.com because of (keepAllCookies: true)', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'exampleWithCookieNameCleanAllCookiesTrue.com',
        mainDomain: 'exampleWithCookieNameCleanAllCookiesTrue.com',
        name: 'not-in-cookie-names',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return false for examplewithcookiename.com because it has a cookie name in the list (Startup)', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'examplewithcookiename.com',
        mainDomain: 'examplewithcookiename.com',
        name: 'in-cookie-names',
        storeId: 'firefox-container-1',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        greyCleanup: true,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true for examplewithcookiename.com because it does not have a cookie name in the list (Startup)', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'examplewithcookiename.com',
        mainDomain: 'examplewithcookiename.com',
        name: 'not-in-cookie-names',
        storeId: 'firefox-container-1',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        greyCleanup: true,
      });
      expect(result.reason).toBe(ReasonClean.StartupCleanupAndGreyList);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return true for expired cookie if cleanExpiredCookies is enabled', () => {
      const cookieProperty = {
        ...mockCookie,
        expirationDate: 12345,
        session: false,
      };

      const result = isSafeToClean(
        expiredState,
        cookieProperty,
        cleanupProperties,
      );
      expect(result.reason).toBe(ReasonClean.ExpiredCookie);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return false for session cookie if cleanExpiredCookies is enabled', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'sub.google.com',
        mainDomain: 'google.com',
      };

      const result = isSafeToClean(expiredState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return true if cookie was created through CAD with matching WHITE expression and at least one browsingData type for cleanup', () => {
      const cookieProperty = {
        ...mockCookie,
        name: CADCOOKIENAME,
        hostname: 'youtube.com',
        mainDomain: 'youtube.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonClean.CADSiteDataCookie);
      expect(result.cleanCookie).toBe(true);
    });

    it('should return true if cookie was created through CAD with matching GREY expression and at least one browsingData type for cleanup', () => {
      const cookieProperty = {
        ...mockCookie,
        name: CADCOOKIENAME,
        hostname: 'google.com',
        mainDomain: 'google.com',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        greyCleanup: true,
      });
      expect(result.reason).toBe(ReasonClean.CADSiteDataCookie);
      expect(result.cleanCookie).toBe(true);
    });
  });

  describe('otherBrowsingDataCleanup()', () => {
    const ffState = {
      ...initialState,
      cache: {
        browserDetect: browserName.Firefox,
        browserVersion: '77',
        platformOs: 'desktop',
      },
    };
    const cacheState = {
      ...ffState,
      settings: {
        ...initialState.settings,
        [SettingID.CLEANUP_CACHE]: {
          name: SettingID.CLEANUP_CACHE,
          value: true,
        },
      },
    };
    const indexedDBState = {
      ...ffState,
      settings: {
        ...initialState.settings,
        [SettingID.CLEANUP_INDEXEDDB]: {
          name: SettingID.CLEANUP_INDEXEDDB,
          value: true,
        },
      },
    };
    const localStorageState = {
      ...ffState,
      settings: {
        ...initialState.settings,
        [SettingID.CLEANUP_LOCALSTORAGE]: {
          name: SettingID.CLEANUP_LOCALSTORAGE,
          value: true,
        },
      },
    };
    const pluginDataState = {
      ...ffState,
      settings: {
        ...initialState.settings,
        [SettingID.CLEANUP_PLUGIN_DATA]: {
          name: SettingID.CLEANUP_PLUGIN_DATA,
          value: true,
        },
      },
    };
    const serviceWorkersState = {
      ...ffState,
      settings: {
        ...initialState.settings,
        [SettingID.CLEANUP_SERVICE_WORKERS]: {
          name: SettingID.CLEANUP_SERVICE_WORKERS,
          value: true,
        },
      },
    };

    beforeEach(() => {
      when(global.browser.browsingData.remove)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockResolvedValue(undefined as never);
    });

    it('should return empty object if no other browsingData cleanup setting was enabled.', async () => {
      await otherBrowsingDataCleanup(ffState, []);
      expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
    });

    describe('Cache', () => {
      it('should not call cleanSiteData for: Firefox 77, cacheCleanup true', async () => {
        await otherBrowsingDataCleanup(cacheState, []);
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should not call cleanSiteData for: Firefox 78, cacheCleanup false', async () => {
        await otherBrowsingDataCleanup(
          {
            ...ffState,
            cache: {
              ...ffState.cache,
              browserVersion: '78',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should call cleanSiteData for: Firefox 78, cacheCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...cacheState,
            cache: {
              ...ffState.cache,
              browserVersion: '78',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });

      it('should call cleanSiteData for: Chrome, cacheCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...cacheState,
            cache: {
              browserDetect: browserName.Chrome,
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });
    });

    describe('IndexedDB', () => {
      it('should not call cleanSiteData for: Firefox 76, indexedDBCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...indexedDBState,
            cache: {
              ...ffState.cache,
              browserVersion: '76',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should not call cleanSiteData for: Firefox 77, indexedDBCleanup false', async () => {
        await otherBrowsingDataCleanup(ffState, []);
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should call cleanSiteData for: Firefox 77, indexedDBCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...indexedDBState,
            cache: {
              ...ffState.cache,
              browserVersion: '77',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });

      it('should call cleanSiteData for: Chrome, indexedDBCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...indexedDBState,
            cache: {
              browserDetect: browserName.Chrome,
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });
    });

    describe('LocalStorage', () => {
      it('should not call cleanSiteData for: Firefox 57, localStorageCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...localStorageState,
            cache: {
              ...ffState.cache,
              browserVersion: '57',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should not call cleanSiteData for: Firefox 77, localStorageCleanup false', async () => {
        await otherBrowsingDataCleanup(ffState, []);
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should call cleanSiteData for: Firefox 77, localStorageCleanup true', async () => {
        await otherBrowsingDataCleanup(localStorageState, []);
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });

      it('should call cleanSiteData for: Chrome, localStorageCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...indexedDBState,
            cache: {
              browserDetect: browserName.Chrome,
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });
    });

    describe('PluginData', () => {
      it('should not call cleanSiteData for: Firefox 77, pluginDataCleanup true', async () => {
        await otherBrowsingDataCleanup(pluginDataState, []);
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should not call cleanSiteData for: Firefox 78, pluginDataCleanup false', async () => {
        await otherBrowsingDataCleanup(
          {
            ...ffState,
            cache: {
              ...ffState.cache,
              browserVersion: '78',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should call cleanSiteData for: Firefox 77, pluginDataCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...pluginDataState,
            cache: {
              ...ffState.cache,
              browserVersion: '78',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });

      it('should call cleanSiteData for: Chrome, pluginDataCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...pluginDataState,
            cache: {
              browserDetect: browserName.Chrome,
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });
    });

    describe('ServiceWorkers', () => {
      it('should not call cleanSiteData for: Firefox 76, serviceWorkersCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...serviceWorkersState,
            cache: {
              ...ffState.cache,
              browserVersion: '76',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should not call cleanSiteData for: Firefox 77, serviceWorkersCleanup false', async () => {
        await otherBrowsingDataCleanup(ffState, []);
        expect(spyCleanupService.cleanSiteData).not.toHaveBeenCalled();
      });

      it('should call cleanSiteData for: Firefox 77, serviceWorkersCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...serviceWorkersState,
            cache: {
              ...ffState.cache,
              browserVersion: '77',
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });

      it('should call cleanSiteData for: Chrome, serviceWorkersCleanup true', async () => {
        await otherBrowsingDataCleanup(
          {
            ...serviceWorkersState,
            cache: {
              browserDetect: browserName.Chrome,
            },
          },
          [],
        );
        expect(spyCleanupService.cleanSiteData).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('prepareCookie()', () => {
    it('should call all three relevant functions by default', () => {
      prepareCookie(mockCookie);
      expect(spyLib.prepareCookieDomain).toHaveBeenCalledTimes(1);
      expect(spyLib.getHostname).toHaveBeenCalledTimes(1);
      expect(spyLib.extractMainDomain).toHaveBeenCalledTimes(1);
    });

    it('should only call one function for all three properties if it is a local file', () => {
      const mockFileCookie = {
        ...mockCookie,
        domain: '',
        path: '/folder/file.html',
      };

      const result = prepareCookie(mockFileCookie);
      expect(spyLib.prepareCookieDomain).toHaveBeenCalledTimes(1);
      expect(spyLib.getHostname).not.toHaveBeenCalled();
      expect(spyLib.extractMainDomain).not.toHaveBeenCalled();

      expect(result.preparedCookieDomain).toBe('file:///folder/file.html');
      expect(result.hostname).toBe('file:///folder/file.html');
      expect(result.mainDomain).toBe('file:///folder/file.html');
    });
  });

  describe('removeSiteData()', () => {
    it('should use hostnames for domains if removal is in firefox', async () => {
      await removeSiteData(
        sampleState,
        SiteDataType.CACHE,
        browserName.Firefox,
        ['test'],
        false,
      );
      expect(global.browser.browsingData.remove).toHaveBeenCalledWith(
        expect.objectContaining({ hostnames: ['test'] }),
        expect.any(Object),
      );
    });

    it('should use origins for domains if removal is in Chrome', async () => {
      await removeSiteData(
        sampleState,
        SiteDataType.CACHE,
        browserName.Chrome,
        ['test'],
        false,
      );
      expect(global.browser.browsingData.remove).toHaveBeenCalledWith(
        expect.objectContaining({ origins: ['test'] }),
        expect.any(Object),
      );
    });
    it('should return false if an error occurred', async () => {
      when(global.browser.browsingData.remove)
        .calledWith(expect.any(Object), expect.any(Object))
        .mockRejectedValue(new Error('test') as never);
      expect(
        await removeSiteData(
          sampleState,
          SiteDataType.CACHE,
          browserName.Firefox,
          ['test'],
          false,
        ),
      ).toBe(false);
    });

    it('should call browserDetect if one in cache is undefined', async () => {
      const spyBrowserDetect = jest.spyOn(global, 'browserDetect');
      await removeSiteData(
        sampleState,
        SiteDataType.CACHE,
        undefined,
        ['test'],
        false,
      );
      expect(spyBrowserDetect).toHaveBeenCalledTimes(1);
    });
  });

  describe('returnContainersOfOpenTabDomains()', () => {
    beforeEach(() => {
      when(global.browser.tabs.query)
        .calledWith(expect.any(Object))
        .mockResolvedValue([
          {
            cookieStoreId: 'firefox-default',
            url: 'https://google.com/search',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'http://facebook.com/search',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'http://sub.domain.com',
          },
          {
            cookieStoreId: 'firefox-default',
            url: 'moz-extension://test/settings/settings.html',
          },
          {
            cookieStoreId: 'firefox-container-1',
            url: 'https://sub.domain.com',
          },
          {
            cookieStoreId: 'firefox-container-1',
            discarded: true,
            url: 'https://discarded.net',
          },
          {
            // Chrome Query doesn't have cookieStoreId
            url: 'https://chrome.link',
          },
          {
            // Chrome Query doesn't have cookieStoreId
            incognito: true,
            url: 'https://incognitochrome.link',
          },
        ] as never);
    });

    it('should return empty object if ignoreOpenTabs is true and cleanDiscardedTabs is false', () => {
      return returnContainersOfOpenTabDomains(true, false).then((results) => {
        expect(Object.keys(results).length).toEqual(0);
        return Promise.resolve();
      });
    });

    it('should return empty object if ignoreOpenTabs is true and cleanDiscardedTabs is true', () => {
      return returnContainersOfOpenTabDomains(true, true).then((results) => {
        expect(Object.keys(results).length).toEqual(0);
        return Promise.resolve();
      });
    });

    it('sort tab query result accordingly, cleanDiscardedTabs is false', () => {
      return returnContainersOfOpenTabDomains(false, false).then((results) => {
        expect(Object.keys(results).length).toBe(4);

        expect(results['firefox-default']).toHaveLength(3);
        expect(results['firefox-default']).toEqual([
          'google.com',
          'facebook.com',
          'domain.com',
        ]);
        expect(results['firefox-container-1']).toHaveLength(2);
        expect(results['firefox-container-1']).toEqual([
          'domain.com',
          'discarded.net',
        ]);

        // Chrome Regular cookieStore.
        expect(results['0']).toHaveLength(1);
        expect(results['0']).toEqual(['chrome.link']);

        // Chrome Incognito cookieStore.
        expect(results['1']).toHaveLength(1);
        expect(results['1']).toEqual(['incognitochrome.link']);
        return Promise.resolve();
      });
    });

    it('should not have youtube.com in any containers, cleanDiscardedTabs is false', () => {
      return returnContainersOfOpenTabDomains(false, false).then((results) => {
        expect(
          results['firefox-default'] &&
            results['firefox-default'].includes('youtube.com'),
        ).toBe(false);
        expect(
          results['firefox-container-1'] &&
            results['firefox-container-1'].includes('youtube.com'),
        ).toBe(false);
        expect(results['0'] && results['0'].includes('youtube.com')).toBe(
          false,
        );
        expect(results['1'] && results['1'].includes('youtube.com')).toBe(
          false,
        );
        return Promise.resolve();
      });
    });

    it('should not have discarded.net in firefox-container-1/Personal when cleanDiscardedTabs is true', () => {
      return returnContainersOfOpenTabDomains(false, true).then((results) => {
        expect(
          results['firefox-container-1'] &&
            results['firefox-container-1'].includes('discarded.net'),
        ).toBe(false);
        return Promise.resolve();
      });
    });
  });
});
