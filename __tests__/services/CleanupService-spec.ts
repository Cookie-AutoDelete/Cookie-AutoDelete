import { when } from 'jest-when';
import { initialState } from '../../src/redux/State';
import {
  filterLocalstorage,
  isSafeToClean,
  returnSetOfOpenTabDomains,
} from '../../src/services/CleanupService';
import * as Lib from '../../src/services/Libs';
// ToDo: cleanCookiesOperation

jest.mock('../../src/services/Libs');

const wildCardWhiteListGoogle: Expression = {
  expression: '*.google.com',
  id: '1',
  listType: ListType.GREY,
  storeId: 'default',
};

const whiteListYoutube: Expression = {
  expression: 'youtube.com',
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

const greyMessenger: Expression = {
  expression: 'messenger.com',
  id: '4',
  listType: ListType.GREY,
  storeId: 'firefox-container-1',
};

const exampleWithCookieName: Expression = {
  cleanAllCookies: false,
  cookieNames: ['in-cookie-names'],
  expression: 'examplewithcookiename.com',
  id: '5',
  listType: ListType.WHITE,
  storeId: 'default',
};

const exampleWithCookieNameCleanAllCookiesTrue: Expression = {
  ...exampleWithCookieName,
  cleanAllCookies: true,
  expression: 'exampleWithCookieNameCleanAllCookiesTrue.com',
};

const exampleWithCookieNameGrey: Expression = {
  ...exampleWithCookieName,
  listType: ListType.GREY,
  storeId: 'firefox-container-1',
};

const sampleState: State = {
  ...initialState,
  lists: {
    default: [
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
  secure: true,
  session: true,
  storeId: 'firefox-default',
  value: 'value',
};

describe('CleanupService', () => {
  describe('returnSetOfOpenTabDomains()', () => {
    // const stub1 = sinon.stub(UsefulFunctions, 'getHostname');
    // stub1.withArgs('https://google.com/search').returns('google.com');
    // stub1.withArgs('http://facebook.com/search').returns('facebook.com');
    // stub1.withArgs('http://sub.domain.com').returns('sub.domain.com');

    // const stub2 = sinon.stub(UsefulFunctions, 'extractMainDomain');
    // stub2.withArgs('google.com').returns('google.com');
    // stub2.withArgs('facebook.com').returns('facebook.com');
    // stub2.withArgs('sub.domain.com').returns('domain.com');

    // const stub3 = sinon.stub(UsefulFunctions, 'isAWebpage');
    // stub3.withArgs('https://google.com/search').returns(true);
    // stub3.withArgs('http://facebook.com/search').returns(true);
    // stub3.withArgs('http://sub.domain.com').returns(true);
    // stub3
    //   .withArgs('moz-extension://test/settings/settings.html')
    //   .returns(false);

    beforeAll(() => {
      global.browser = {
        tabs: {
          query: () => [
            {
              url: 'https://google.com/search',
            },
            {
              url: 'http://facebook.com/search',
            },
            {
              url: 'http://sub.domain.com',
            },
            {
              url: 'moz-extension://test/settings/settings.html',
            },
          ],
        },
      };
      when(Lib.isAWebpage)
        .calledWith('https://google.com/search')
        .mockReturnValue(true);
      when(Lib.isAWebpage)
        .calledWith('http://facebook.com/search')
        .mockReturnValue(true);
      when(Lib.isAWebpage)
        .calledWith('http://sub.domain.com')
        .mockReturnValue(true);
      when(Lib.isAWebpage)
        .calledWith('moz-extension://test/settings/settings.html')
        .mockReturnValue(false);

      when(Lib.getHostname)
        .calledWith('https://google.com/search')
        .mockReturnValue('google.com');
      when(Lib.getHostname)
        .calledWith('http://facebook.com/search')
        .mockReturnValue('facebook.com');
      when(Lib.getHostname)
        .calledWith('http://sub.domain.com')
        .mockReturnValue('sub.domain.com');

      when(Lib.extractMainDomain)
        .calledWith('google.com')
        .mockReturnValue('google.com');
      when(Lib.extractMainDomain)
        .calledWith('facebook.com')
        .mockReturnValue('facebook.com');
      when(Lib.extractMainDomain)
        .calledWith('sub.domain.com')
        .mockReturnValue('domain.com');
    });

    it('should have google.com in set', () => {
      return returnSetOfOpenTabDomains(false).then(results => {
        expect(results.has('google.com')).toBe(true);
        return Promise.resolve();
      });
    });

    it('should have facebook.com in set', () => {
      return returnSetOfOpenTabDomains(false).then(results => {
        expect(results.has('facebook.com')).toBe(true);
        return Promise.resolve();
      });
    });

    it('should have domain.com in set', () => {
      return returnSetOfOpenTabDomains(false).then(results => {
        expect(results.has('domain.com')).toBe(true);
        return Promise.resolve();
      });
    });

    it('should have length 3 in set', () => {
      return returnSetOfOpenTabDomains(false).then(results => {
        expect(results.size).toBe(3);
        return Promise.resolve();
      });
    });

    it('should not have youtube.com in set', () => {
      return returnSetOfOpenTabDomains(false).then(results => {
        expect(results.has('youtube.com')).toBe(false);
        return Promise.resolve();
      });
    });

    afterAll(() => {
      delete global.browser;
    });
  });

  describe('isSafeToClean()', () => {
    const cleanupProperties: CleanupPropertiesInternal = {
      // @ts-ignore
      cachedResults: {
        dateTime: '',
        recentlyCleaned: 0,
      },
      greyCleanup: false,
      hostnamesDeleted: new Set(),
      ignoreOpenTabs: false,
      openTabDomains: new Set(['example.com', 'mozilla.org']),
      setOfDeletedDomainCookies: new Set(),
    };

    beforeAll(() => {
      global.browser = {
        i18n: {
          getMessage: () => '',
        },
      };
      when(Lib.undefinedIsTrue)
        .calledWith(undefined)
        .mockReturnValue(true);
      when(Lib.undefinedIsTrue)
        .calledWith(true)
        .mockReturnValue(true);
      when(Lib.undefinedIsTrue)
        .calledWith(false)
        .mockReturnValue(false);

      when(Lib.returnMatchedExpressionObject)
        .calledWith(sampleState, 'default', 'youtube.com')
        .mockReturnValue(whiteListYoutube);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(sampleState, 'default', 'google.com')
        .mockReturnValue(wildCardWhiteListGoogle);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(sampleState, 'default', 'sub.google.com')
        .mockReturnValue(wildCardWhiteListGoogle);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(sampleState, 'firefox-container-1', 'facebook.com')
        .mockReturnValue(wildCardGreyFacebook);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(sampleState, 'default', 'examplewithcookiename.com')
        .mockReturnValue(exampleWithCookieName);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(
          sampleState,
          'default',
          'exampleWithCookieNameCleanAllCookiesTrue.com',
        )
        .mockReturnValue(exampleWithCookieNameCleanAllCookiesTrue);
      when(Lib.returnMatchedExpressionObject)
        .calledWith(
          sampleState,
          'firefox-container-1',
          'examplewithcookiename.com',
        )
        .mockReturnValue(exampleWithCookieNameGrey);
    });

    it('should return true for yahoo.com', () => {
      const cookieProperty: CookiePropertiesCleanup = {
        ...mockCookie,
        hostname: 'yahoo.com',
        mainDomain: 'yahoo.com',
        storeId: 'default',
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
        storeId: 'default',
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
        storeId: 'default',
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
        storeId: 'default',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
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
        storeId: 'default',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
      });
      expect(result.reason).toBe(ReasonKeep.MatchedExpression);
      expect(result.cleanCookie).toBe(false);
    });

    it('should return false for example.com', () => {
      const cookieProperty = {
        ...mockCookie,
        hostname: 'example.com',
        mainDomain: 'example.com',
        storeId: 'default',
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
        storeId: 'default',
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
        storeId: 'default',
      };

      const result = isSafeToClean(sampleState, cookieProperty, {
        ...cleanupProperties,
        ignoreOpenTabs: true,
        openTabDomains: new Set<string>(),
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
        storeId: 'default',
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
        storeId: 'default',
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
        storeId: 'default',
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

    afterAll(() => {
      delete global.browser;
    });
  });

  describe('filterLocalstorage()', () => {
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
      const result = filterLocalstorage(cleanReasonObj);
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
      const result = filterLocalstorage(cleanReasonObj);
      expect(result).toBe(true);
    });

    it('should return false because of a matched expression', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        expression: {
          expression: '',
          listType: ListType.WHITE,
          storeId: 'default',
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.MatchedExpression,
      };
      const result = filterLocalstorage(cleanReasonObj);
      expect(result).toBe(false);
    });

    it('should return true because of a matched expression but do not keep localstorage', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        expression: {
          cleanLocalStorage: true,
          expression: '',
          listType: ListType.WHITE,
          storeId: 'default',
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.MatchedExpression,
      };
      const result = filterLocalstorage(cleanReasonObj);
      expect(result).toBe(true);
    });

    it('should return false because of a matched expression but do not keep localstorage + in an open tab', () => {
      const cleanReasonObj: CleanReasonObject = {
        cached: false,
        cleanCookie: true,
        cookie: {
          ...mockCookie,
        },
        expression: {
          cleanLocalStorage: true,
          expression: '',
          listType: ListType.WHITE,
          storeId: 'default',
        },
        openTabStatus: OpenTabStatus.TabsWasNotIgnored,
        reason: ReasonKeep.OpenTabs,
      };
      const result = filterLocalstorage(cleanReasonObj);
      expect(result).toBe(false);
    });
  });

  // describe('cleanCookies()', () => {
  //   beforeAll(() => {
  //     const cleanup = jest.genMockFromModule('../src/services/CleanupService');
  //     // @ts-ignore
  //     cleanup.isSafeToClean = jest.fn(() => false);
  //   });
  //   const googleCookie: CookiePropertiesCleanup = {
  //     ...mockCookie,
  //     domain: 'google.com',
  //     name: 'NID',
  //     path: '/',
  //     secure: true,
  //     storeId: 'firefox-default',
  //   };
  //   const youtubeCookie: CookiePropertiesCleanup = {
  //     ...mockCookie,
  //     domain: 'youtube.com',
  //     name: 'SID',
  //     path: '/',
  //     secure: true,
  //     storeId: 'firefox-default',
  //   };
  //   const yahooCookie: CookiePropertiesCleanup = {
  //     ...mockCookie,
  //     domain: 'yahoo.com',
  //     name: 'BID',
  //     path: '/login',
  //     secure: false,
  //     storeId: 'firefox-default',
  //   };

  //   const personalGoogleCookie: CookiePropertiesCleanup = {
  //     ...mockCookie,
  //     domain: 'google.com',
  //     name: 'NID',
  //     path: '/',
  //     secure: true,
  //     storeId: 'firefox-container-1',
  //   };

  //   const cookies = [
  //     googleCookie,
  //     youtubeCookie,
  //     yahooCookie,
  //     personalGoogleCookie,
  //   ];

  //   beforeAll(() => {
  //     global.browser = {
  //       cookies: {
  //         remove: jest.fn(),
  //       },
  //       i18n: {
  //         getMessage: () => null,
  //       },
  //     };
  //   });

  //   it('should be called twice for cookies.remove', () => {
  //     const cleanupProperties: CleanupPropertiesInternal = {
  //       cachedResults: {
  //         dateTime: '',
  //         recentlyCleaned: 0,
  //       },
  //       greyCleanup: false,
  //       hostnamesDeleted: new Set(),
  //       ignoreOpenTabs: false,
  //       openTabDomains: new Set(['example.com', 'mozilla.org']),
  //       setOfDeletedDomainCookies: new Set(),
  //     };

  //     cleanCookies(sampleState, cookies, cleanupProperties);
  //     expect(global.browser.cookies.remove).toBeCalledTimes(2);
  //   });

  //   afterAll(() => {
  //     delete global.browser;
  //   });
  // });

  // describe("cleanCookiesOperation()", () => {
  //
  //   let resolveStub = sinon.stub(browser.contextualIdentities, "query");
  // 	// let stub1;
  // 	// let stub2;
  //   //
  // 	beforeEach(() => {
  // 		// stub1 = sinon.stub(cleanupService, "cleanCookies");
  // 		// stub1.resolves(new Set(["facebook.com", "amazon.com"]));
  //     //
  // 		// stub2 = sinon.stub(cleanupService, "returnSetOfOpenTabDomains");
  // 		// stub2.resolves({});
  // 		browser.cookies.getAll.resolves({});
  //     resolveStub.resolves([{cookieStoreId: "firefox-container-1"}, {cookieStoreId: "firefox-container-2"}, {cookieStoreId: "firefox-container-3"}, {cookieStoreId: "firefox-container-4"}]);
  // 	});
  //
  //
  // 	it("should return 5 for call count of browser.cookies.getAll with contextualIdentities enabled", () => {
  // 		return cleanCookiesOperation(sampleState, {greyCleanup: false, ignoreOpenTabs: false})
  // 		.then((setOfDeletedDomainCookies) => {
  // 			assert.strictEqual(browser.cookies.getAll.callCount, 5);
  // 			return Promise.resolve();
  // 		});
  // 	});
  //
  // 	// after(() => {
  // 	// 	stub1.restore();
  // 	// });
  // });

  // afterEach(() => {
  //   browser.flush();
  // });
});
