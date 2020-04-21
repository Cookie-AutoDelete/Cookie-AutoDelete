import { initialState } from '../../src/redux/State';
import {
  convertVersionToNumber,
  extractMainDomain,
  getHostname,
  getStoreId,
  globExpressionToRegExp,
  isAnIP,
  isAWebpage,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  sleep,
  throwErrorNotification,
  trimDot,
  undefinedIsTrue,
} from '../../src/services/Libs';

const mockCookie: browser.cookies.Cookie = {
  domain: 'domain.com',
  hostOnly: true,
  httpOnly: true,
  name: 'blah',
  path: '/',
  sameSite: 'no_restriction',
  secure: true,
  session: true,
  storeId: 'default',
  value: 'test value',
};

describe('Library Functions', () => {
  describe('extractMainDomain()', () => {
    it('should return workplace.com from work-12345678.workplace.com', () => {
      expect(extractMainDomain('work-12345678.workplace.com')).toBe('workplace.com');
    });

    it('should return domain.com from domain.com', () => {
      expect(extractMainDomain('domain.com')).toBe('domain.com');
    });

    it('should return domain.com from sub.domain.com', () => {
      expect(extractMainDomain('sub.domain.com')).toBe('domain.com');
    });

    it('should return domain.com from sub.sub.domain.com', () => {
      expect(extractMainDomain('sub.sub.domain.com')).toBe('domain.com');
    });

    it('should return domain.com from sub.sub.sub.domain.com', () => {
      expect(extractMainDomain('sub.sub.sub.domain.com')).toBe('domain.com');
    });

    it('should return example.co.uk from sub.example.co.uk', () => {
      expect(extractMainDomain('sub.example.co.uk')).toBe('example.co.uk');
    });

    it('should return example.com.br from sub.example.com.br', () => {
      expect(extractMainDomain('sub.example.com.br')).toBe('example.com.br');
    });

    it('should return the ip address from an ip address', () => {
      expect(extractMainDomain('127.0.0.1')).toBe('127.0.0.1');
    });

    it('should return the srv-test01 from an srv-test01', () => {
      expect(extractMainDomain('srv-test01')).toBe('srv-test01');
    });

    it('should return the test.i2p from an test.i2p', () => {
      expect(extractMainDomain('test.i2p')).toBe('test.i2p');
    });

    it('should return domain.com from .domain.com.', () => {
      expect(extractMainDomain('domain.com.')).toBe('domain.com');
    });

    it('should return local from local', () => {
      expect(extractMainDomain('local')).toBe('local');
    });

    it('should return nothing on empty string', () => {
      expect(extractMainDomain('')).toBe('');
    });
  });

  describe('prepareCookieDomain()', () => {
    it('should return https://google.com', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: 'google.com',
          path: '/',
          secure: true,
        }),
      ).toBe('https://google.com/');
    });

    it('should return a wrapped ivp6 ip cookie domain in brackets', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          path: '/',
          secure: true,
        }),
      ).toBe('https://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]/');
    });

    it('should return http://google.com with a removed leading .', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: '.google.com',
          path: '/test',
          secure: false,
        }),
      ).toBe('http://google.com/test');
    });
  });

  describe('getStoreId()', () => {
    const contextualIdentitiesFalseChrome = {
      ...initialState,
      cache: {
        browserDetect: 'Chrome',
      },
      settings: {
        contextualIdentities: {
          id: 7,
          name: 'contextualIdentities',
          value: false,
        },
      },
    };
    const contextualIdentitiesFalseFF = {
      ...initialState,
      cache: {
        browserDetect: 'Firefox',
      },
      settings: {
        contextualIdentities: {
          id: 7,
          name: 'contextualIdentities',
          value: false,
        },
      },
    };
    const contextualIdentitiesTrue = {
      ...initialState,
      cache: {
        browserDetect: 'Firefox',
      },
      settings: {
        contextualIdentities: {
          id: 7,
          name: 'contextualIdentities',
          value: true,
        },
      },
    };

    // Default storeIds
    it('should return default from firefox-default', () => {
      expect(getStoreId(contextualIdentitiesFalseFF, 'firefox-default')).toBe(
        'default',
      );
    });

    it('should return default from Chrome and storeId 0', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '0')).toBe('default');
    });

    it('should return default from Chrome and storeId 0', () => {
      expect(
        getStoreId(
          {
            ...contextualIdentitiesFalseChrome,
            cache: {
              browserDetect: 'Opera',
            },
          },
          '0',
        ),
      ).toBe('default');
    });

    // Private storeIds
    it('should return firefox-private from Firefox and storeId firefox-private (private)', () => {
      expect(getStoreId(contextualIdentitiesFalseFF, 'firefox-private')).toBe(
        'firefox-private',
      );
    });

    it('should return firefox-private from Firefox and storeId firefox-private (private) with containers', () => {
      expect(getStoreId(contextualIdentitiesTrue, 'firefox-private')).toBe(
        'firefox-private',
      );
    });

    it('should return private from Chrome and storeId 1 (private)', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '1')).toBe('private');
    });

    // Containers
    it('should return firefox-container-1 from Firefox and Containers on', () => {
      expect(getStoreId(contextualIdentitiesTrue, 'firefox-container-1')).toBe(
        'firefox-container-1',
      );
    });

    it('should return default from Firefox and storeId firefox-container-1 with Containers off', () => {
      expect(
        getStoreId(contextualIdentitiesFalseFF, 'firefox-container-1'),
      ).toBe('default');
    });
  });

  describe('getHostname()', () => {
    it('should return en.wikipedia.org from https://en.wikipedia.org/wiki/Cat', () => {
      expect(getHostname('https://en.wikipedia.org/wiki/Cat')).toBe(
        'en.wikipedia.org',
      );
    });

    it('should return yahoo.com from http://yahoo.com', () => {
      expect(getHostname('http://yahoo.com')).toBe('yahoo.com');
    });

    it('should return scotiaonline.scotiabank.com from https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns', () => {
      expect(
        getHostname(
          'https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns',
        ),
      ).toBe('scotiaonline.scotiabank.com');
    });

    it('should return mint.com from https://wwws.mint.com', () => {
      expect(getHostname('https://wwws.mint.com')).toBe('mint.com');
    });

    it('should return an empty string from invalid URLs', () => {
      expect(getHostname('')).toBe('');
    });
  });

  describe('isAWebpage()', () => {
    it('should return true from https://en.wikipedia.org/wiki/Cat', () => {
      expect(isAWebpage('https://en.wikipedia.org/wiki/Cat')).toBe(true);
    });

    it('should return true from http://yahoo.com', () => {
      expect(isAWebpage('http://yahoo.com')).toBe(true);
    });

    it('should return false from random', () => {
      expect(isAWebpage('random')).toBe(false);
    });

    it('should return false from extension page', () => {
      expect(isAWebpage('moz-extension://test/settings/settings.html')).toBe(
        false,
      );
    });
    it('should return false from undefined', () => {
      expect(isAWebpage(undefined)).toBe(false);
    });
  });

  describe('isAnIP()', () => {
    it('should return false from https://work-12345678.workplace.com', () => {
      expect(isAnIP('https://work-12345678.workplace.com')).toBe(false);
    });

    it('should return false from https://en.wikipedia.org/wiki/Cat', () => {
      expect(isAnIP('https://en.wikipedia.org/wiki/Cat')).toBe(false);
    });

    it('should return false from http://yahoo.com', () => {
      expect(isAnIP('http://yahoo.com')).toBe(false);
    });

    it('should return false from random', () => {
      expect(isAnIP('random')).toBe(false);
    });

    it('should return false from extension page', () => {
      expect(isAnIP('moz-extension://test/settings/settings.html')).toBe(false);
    });

    it('should return true from http ip', () => {
      expect(isAnIP('http://192.168.1.1/')).toBe(true);
    });

    it('should return true from https ip', () => {
      expect(isAnIP('https://192.168.1.1/')).toBe(true);
    });
    it('should return false from undefined', () => {
      expect(isAnIP(undefined)).toBe(false);
    });
  });

  describe('globExpressionToRegExp', () => {
    it('should match example.com for example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('example.com'));
      expect(regExp.test('example.com')).toBe(true);
    });
    it('should not match badexample.com for example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('example.com'));
      expect(regExp.test('badexample.com')).toBe(false);
    });
    it('should match example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('example.com')).toBe(true);
    });
    it('should match a.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.example.com')).toBe(true);
    });
    it('should match a.b.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b.example.com')).toBe(true);
    });
    it('should match a.b-c.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b-c.example.com')).toBe(true);
    });
    it('should match a.b_c.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b_c.example.com')).toBe(true);
    });
    it('should match sub-with-strage_chars.example.another.sub.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(
        regExp.test('sub-with-strage_chars.example.another.sub.example.com'),
      ).toBe(true);
    });
    it('should not match badexample.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('badexample.com')).toBe(false);
    });
    it('should not match bad.example.com.others.org for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('bad.example.com.others.org')).toBe(false);
    });
    it('should equal ^.*$ for just *', () => {
      const regExp = new RegExp(globExpressionToRegExp('*'));
      expect(regExp.toString()).toBe('/^.*$/');
    });
    it('should match github.com with git*b.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('git*b.com'));
      expect(regExp.test('github.com')).toBe(true);
    });
    it('should match sub.gitlab.com with *.git*b.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.git*b.com'));
      expect(regExp.test('sub.gitlab.com')).toBe(true);
    });
    it('should match [2a03:4000:6:310e:216:3eff:fe53:99b3] with [*]', () => {
      const regExp = new RegExp(globExpressionToRegExp('[*]'));
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toBe(true);
    });
    it('should match [2a03:4000:6:310e:216:3eff:fe53:99b3] with itself', () => {
      const regExp = new RegExp(
        globExpressionToRegExp('[2a03:4000:6:310e:216:3eff:fe53:99b3]'),
      );
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toBe(true);
    });
    it('should match github.com with /^git[hub]{3}\.com$/', () => {
      const regExp = new RegExp(globExpressionToRegExp('/^git[hub]{3}\.com$/'));
      expect(regExp.test('github.com')).toBe(true);
    });
  });

  describe('returnMatchedExpressionObject ()', () => {
    const state: State = {
      ...initialState,
      lists: {
        default: [
          {
            expression: '*.expression.com',
            listType: ListType.WHITE,
            storeId: 'default',
          },
        ],
      },
    };
    it('should return a matched expression', () => {
      const results = returnMatchedExpressionObject(
        state,
        'default',
        'expression.com',
      );
      expect(results!.expression).toBe('*.expression.com');
    });
    it('should return undefined', () => {
      const results = returnMatchedExpressionObject(
        state,
        'firefox-container-1',
        'expression.com',
      );
      expect(results).toBe(undefined);
    });
  });

  describe('undefinedIsTrue()', () => {
    it('should return true for undefined', () => {
      expect(undefinedIsTrue(undefined)).toBe(true);
    });
    it('should return true for true', () => {
      expect(undefinedIsTrue(true)).toBe(true);
    });
    it('should return false for false', () => {
      expect(undefinedIsTrue(false)).toBe(false);
    });
  });

  describe('returnOptionalCookieAPIAttributes()', () => {
    it('should return an object with an undefined firstPartyDomain', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
          firstPartyIsolateSetting: true,
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        domain: 'example.com',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
      );
      expect(results).toEqual(
        expect.objectContaining({
          domain: 'example.com',
          firstPartyDomain: undefined,
        }),
      );
    });

    it('should return an object the same object with a firstPartyDomain', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
          firstPartyIsolateSetting: true,
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        domain: 'example.com',
        firstPartyDomain: 'example.com',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
      );
      expect(results).toEqual(
        expect.objectContaining({
          domain: 'example.com',
          firstPartyDomain: 'example.com',
        }),
      );
    });

    it('should return an object with no firstPartyDomain (Setting false)', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
          firstPartyIsolateSetting: false,
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        firstPartyDomain: '',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
      );
      expect(results).toEqual(
        expect.not.objectContaining({
          firstPartyDomain: '',
        }),
      );
    });

    it('should return an object with no firstPartyDomain (Browser other than FF)', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Chrome',
          firstPartyIsolateSetting: false,
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        firstPartyDomain: '',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
      );
      expect(results).toEqual(
        expect.not.objectContaining({
          firstPartyDomain: '',
        }),
      );
    });
  });

  describe('convertVersionToNumber()', () => {
    it('should return 123', () => {
      const results = convertVersionToNumber('1.2.3');
      expect(results).toBe(123);
    });
    it('should return -1', () => {
      const results = convertVersionToNumber();
      expect(results).toBe(-1);
    });
    it('should return 3.0.0', () => {
      const results = convertVersionToNumber('3.0.0');
      expect(results).toBe(300);
    });
  });

  describe('trimDot()', () => {
    it('should return example.com with no leading dots', () => {
      const results = trimDot('.example.com');
      expect(results).toBe('example.com');
    });
    it('should return example.com with no leading and ending dots', () => {
      const results = trimDot('.example.com.');
      expect(results).toBe('example.com');
    });
  });

  describe('sleep()', () => {
    it('should return undefined', async () => {
      expect.assertions(1);
      const result = await sleep(1);
      expect(result).toBe(undefined);
    });
    it('should return after 1.5 seconds (max 15 ms past)', () => {
      expect.assertions(3);
      const start = new Date().getTime();
      const result = sleep(1500);
      return result.then(data => {
        const duration = new Date().getTime() - start;
        expect(duration).toBeGreaterThanOrEqual(1500);
        expect(duration).toBeLessThan(1515);
        expect(data).toBe(undefined);
      })
    })
  });

  describe('throwErrorNotification()', () => {
    beforeAll(() => {
      global.browser = {
        extension: {
          getURL: jest.fn(),
        },
        i18n: {
          getMessage: jest.fn(),
        },
        notifications: {
          create: jest.fn(),
        },
      };
    });
    it('should expect one call to browser.notifications.create', () => {
      throwErrorNotification({ name: 'Test Error', message: 'An ERROR!' });
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create).toHaveBeenCalledWith(
        'failed-notification',
        {
          message: 'An ERROR!',
          type: 'basic',
        },
      );
    });
  });
});
