/**
 * Copyright (c) 2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { when } from 'jest-when';
import { initialState } from '../../src/redux/State';
import {
  cadLog,
  convertVersionToNumber,
  createPartialTabInfo,
  extractMainDomain,
  getHostname,
  getSetting,
  getStoreId,
  globExpressionToRegExp,
  isAnIP,
  isAWebpage,
  isFirstPartyIsolate,
  localFileToRegex,
  parseCookieStoreId,
  prepareCleanupDomains,
  prepareCookieDomain,
  returnMatchedExpressionObject,
  returnOptionalCookieAPIAttributes,
  showNotification,
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
  describe('cadLog()', () => {
    beforeAll(() => {
      when(global.browser.runtime.getManifest)
        .calledWith()
        .mockReturnValue({version: '0.12.34'});
    });

    const origDebug = console.debug;
    const origError = console.error;
    const origInfo = console.info;
    // tslint:disable-next-line:no-console
    const origLog = console.log;
    const origWarn = console.warn;

    afterEach(() => {
      console.debug = origDebug;
      console.error = origError;
      console.info = origInfo;
      // tslint:disable-next-line:no-console
      console.log = origLog;
      console.warn = origWarn;
    });

    const consoleOutput = [] as {type: string, msg: string}[];
    const mockedDebug = (msg: string) => consoleOutput.push({type: 'debug', msg});
    const mockedError = (msg:string) => consoleOutput.push({type: 'error', msg});
    const mockedInfo = (msg:string) => consoleOutput.push({type: 'info', msg});
    const mockedLog = (msg:string) => consoleOutput.push({type: 'log', msg});
    const mockedWarn = (msg:string) => consoleOutput.push({type: 'warn', msg});

    beforeEach(() => {
      console.debug = mockedDebug;
      console.error = mockedError;
      console.info = mockedInfo;
      // tslint:disable-next-line:no-console
      console.log = mockedLog;
      console.warn = mockedWarn;
      consoleOutput.length = 0;
    });

    it('should format the Log Header with manifest version', () => {
      expect.assertions(2);
      cadLog({msg: 'headerTest'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - headerTest\n'},
      ]);
    });

    it('should output to debug when no type is given', () => {
      expect.assertions(2);
      cadLog({msg: 'noType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - noType\n'},
      ]);
    });
    it('should output to debug when type is debug', () => {
      expect.assertions(2);
      cadLog({type: 'debug', msg: 'debugType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - debugType\n'},
      ]);
    });
    it('should output to error when type is error', () => {
      expect.assertions(2);
      cadLog({type: 'error', msg: 'errorType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'error', msg: 'CAD_0.12.34 - error - errorType\n'},
      ]);
    });
    it('should output to info when type is info', () => {
      expect.assertions(2);
      cadLog({type: 'info', msg: 'infoType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'info', msg: 'CAD_0.12.34 - info - infoType\n'},
      ]);
    });
    it('should output to log when type is log', () => {
      expect.assertions(2);
      cadLog({type: 'log', msg: 'logType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'log', msg: 'CAD_0.12.34 - log - logType\n'},
      ]);
    });
    it('should output to warn when type is warn', () => {
      expect.assertions(2);
      cadLog({type: 'warn', msg: 'warnType'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'warn', msg: 'CAD_0.12.34 - warn - warnType\n'},
      ]);
    });
    it('should default back to debug type when invalid type is given', () => {
      expect.assertions(2);
      cadLog({type: 'invalid', msg: 'invalidType'});
      expect(consoleOutput.length).toEqual(2);
      expect(consoleOutput).toEqual([
        {type: 'error', msg: 'CAD_0.12.34 - Invalid Console Output Type given [ invalid ].  Using [debug] instead.'},
        {type: 'debug', msg: 'CAD_0.12.34 - debug - invalidType\n'}
      ]);
    });

    it('should display supplied string accordingly', () => {
      expect.assertions(2);
      cadLog({msg: 'withObject', x: 'test.'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - withObject\ntest.'},
      ]);
    });

    it('should attempt to parse function as string for display', () => {
      expect.assertions(2);
      cadLog({msg: 'objectFunction', x: RegExp.toString});
      expect(consoleOutput.length).toEqual(2);
      expect(consoleOutput).toEqual([
        {type: 'warn', msg: 'CAD_0.12.34 - Received unexpected typeof [ function ].  Attempting to display it...'},
        {type: 'debug', msg: 'CAD_0.12.34 - debug - objectFunction\nfunction toString() { [native code] }'},
      ]);
    });

    it('should parse object for display', () => {
      expect.assertions(2);
      cadLog({msg: 'objectString', x: {a: 'abc'}});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - objectString\n{\n  "a": "abc"\n}'},
      ]);
    });

    it('should parse number as string.', () =>{
      expect.assertions(2);
      cadLog({msg: 'numberString', x: 123});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - numberString\n123'},
      ]);
    });

    it('should parse boolean as string.', () =>{
      expect.assertions(2);
      cadLog({msg: 'booleanString', x: true});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - booleanString\ntrue'},
      ]);
    });

    it('should parse string as string.', () =>{
      expect.assertions(2);
      cadLog({msg: 'stringString', x: 'test'});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - stringString\ntest'},
      ]);
    });

    it('should parse undefined as empty string.', () =>{
      expect.assertions(2);
      cadLog({msg: 'undefinedString', x: undefined});
      expect(consoleOutput.length).toEqual(1);
      expect(consoleOutput).toEqual([
        {type: 'debug', msg: 'CAD_0.12.34 - debug - undefinedString\n'},
      ]);
    });

    it('should not output to console on empty input object (no message)', () => {
      expect.assertions(2);
      cadLog({});
      expect(consoleOutput.length).toEqual(0);
      expect(consoleOutput).toEqual([]);
    });
  });

  describe('convertVersionToNumber()', () => {
    it('should return 123 from 1.2.3', () => {
      const results = convertVersionToNumber('1.2.3');
      expect(results).toEqual(123);
    });
    it('should return -1 from ()', () => {
      const results = convertVersionToNumber();
      expect(results).toEqual(-1);
    });
    it('should return 300 from 3.0.0', () => {
      const results = convertVersionToNumber('3.0.0');
      expect(results).toEqual(300);
    });
  });

  describe('createPartialTabInfo()', () => {
    const testTab: Partial<browser.tabs.Tab> = {
      active: true,
      cookieStoreId: 'firefox-default',
      discarded: false,
      height: 123,
      hidden: false,
      highlighted: false,
      id: 1,
      incognito: false,
      index: 0,
      pinned: false,
      status: 'complete',
      title: 'TabTitle',
      url: 'https://test.cad',
      width: 321,
      windowId: 1
    };
    it('should extract information relevant to debug in Firefox', () => {
      expect(createPartialTabInfo(testTab)).toMatchObject({
        cookieStoreId: 'firefox-default',
        discarded: false,
        id: 1,
        incognito: false,
        status: 'complete',
        url: 'https://test.cad',
        windowId: 1
      });
    });
    it('should extract information relevant to debug in Chrome', () => {
      expect(createPartialTabInfo({...testTab, cookieStoreId: undefined})).toMatchObject({
        discarded: false,
        id: 1,
        incognito: false,
        status: 'complete',
        url: 'https://test.cad',
        windowId: 1
      });
    });

  });

  describe('extractMainDomain()', () => {
    it('should return itself from file:///home/user/file.html', () => {
      expect(extractMainDomain('file:///home/user/file.html')).toEqual('file:///home/user/file.html');
    });

    it('should return workplace.com from work-12345678.workplace.com', () => {
      expect(extractMainDomain('work-12345678.workplace.com')).toEqual('workplace.com');
    });

    it('should return domain.com from domain.com', () => {
      expect(extractMainDomain('domain.com')).toEqual('domain.com');
    });

    it('should return domain.com from sub.domain.com', () => {
      expect(extractMainDomain('sub.domain.com')).toEqual('domain.com');
    });

    it('should return domain.com from sub.sub.domain.com', () => {
      expect(extractMainDomain('sub.sub.domain.com')).toEqual('domain.com');
    });

    it('should return domain.com from sub.sub.sub.domain.com', () => {
      expect(extractMainDomain('sub.sub.sub.domain.com')).toEqual('domain.com');
    });

    it('should return example.co.uk from sub.example.co.uk', () => {
      expect(extractMainDomain('sub.example.co.uk')).toEqual('example.co.uk');
    });

    it('should return example.co.uk. from sub.example.com.uk.', () => {
      expect(extractMainDomain('sub.example.co.uk.')).toEqual('example.co.uk.');
    });

    it('should return example.com.br from sub.example.com.br', () => {
      expect(extractMainDomain('sub.example.com.br')).toEqual('example.com.br');
    });

    it('should return the ip address from an ip address', () => {
      expect(extractMainDomain('127.0.0.1')).toEqual('127.0.0.1');
    });

    it('should return the srv-test01 from an srv-test01', () => {
      expect(extractMainDomain('srv-test01')).toEqual('srv-test01');
    });

    it('should return the test.i2p from an test.i2p', () => {
      expect(extractMainDomain('test.i2p')).toEqual('test.i2p');
    });

    it('should return domain.com. from .domain.com.', () => {
      expect(extractMainDomain('.domain.com.')).toEqual('domain.com.');
    });

    it('should return domain.com from .domain.com', () => {
      expect(extractMainDomain('.domain.com')).toEqual('domain.com');
    });

    it('should return local from local', () => {
      expect(extractMainDomain('local')).toEqual('local');
    });

    it('should return nothing on empty string', () => {
      expect(extractMainDomain('')).toEqual('');
    });

  });

  describe('getHostname()', () => {
    it('should return en.wikipedia.org from https://en.wikipedia.org/wiki/Cat', () => {
      expect(getHostname('https://en.wikipedia.org/wiki/Cat')).toEqual(
        'en.wikipedia.org',
      );
    });

    it('should return yahoo.com from http://yahoo.com', () => {
      expect(getHostname('http://yahoo.com')).toEqual('yahoo.com');
    });

    it('should return scotiaonline.scotiabank.com from https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns', () => {
      expect(
        getHostname(
          'https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns',
        ),
      ).toEqual('scotiaonline.scotiabank.com');
    });

    it('should return mint.com from https://wwws.mint.com', () => {
      expect(getHostname('https://wwws.mint.com')).toEqual('mint.com');
    });

    it('should return file:///home/user/folder from file:///home/user/folder/file.html', () => {
      expect(getHostname('file:///home/user/folder/file.html')).toEqual('file:///home/user/folder');
    });

    it('should return file:///C: from file:///C:/test.html', () => {
      expect(getHostname('file:///C:/test.html')).toEqual('file:///C:');
    });

    it('should return an empty string from empty URLs', () => {
      expect(getHostname('')).toEqual('');
    });

    it('should return an empty string from invalid URLs', () => {
      expect(getHostname('test')).toEqual('');
    });
  });

  describe('getSetting()', () => {
    it('should return value of false for activeMode in default settings', () => {
      expect(getSetting(initialState, 'activeMode')).toEqual(false);
    })
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
      expect(getStoreId(contextualIdentitiesFalseFF, 'firefox-default')).toEqual(
        'default',
      );
    });

    it('should return default from Chrome and storeId 0', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '0')).toEqual('default');
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
      ).toEqual('default');
    });

    // Private storeIds
    it('should return firefox-private from Firefox and storeId firefox-private (private)', () => {
      expect(getStoreId(contextualIdentitiesFalseFF, 'firefox-private')).toEqual(
        'firefox-private',
      );
    });

    it('should return firefox-private from Firefox and storeId firefox-private (private) with containers', () => {
      expect(getStoreId(contextualIdentitiesTrue, 'firefox-private')).toEqual(
        'firefox-private',
      );
    });

    it('should return private from Chrome and storeId 1 (private)', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '1')).toEqual('private');
    });

    // Containers
    it('should return firefox-container-1 from Firefox and Containers on', () => {
      expect(getStoreId(contextualIdentitiesTrue, 'firefox-container-1')).toEqual(
        'firefox-container-1',
      );
    });

    it('should return default from Firefox and storeId firefox-container-1 with Containers off', () => {
      expect(
        getStoreId(contextualIdentitiesFalseFF, 'firefox-container-1'),
      ).toEqual('default');
    });
  });

  describe('globExpressionToRegExp', () => {
    it('should match example.com for example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('example.com'));
      expect(regExp.test('example.com')).toEqual(true);
    });
    it('should not match badexample.com for example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('example.com'));
      expect(regExp.test('badexample.com')).toEqual(false);
    });
    it('should match example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('example.com')).toEqual(true);
    });
    it('should match a.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.example.com')).toEqual(true);
    });
    it('should match a.b.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b.example.com')).toEqual(true);
    });
    it('should match a.b-c.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b-c.example.com')).toEqual(true);
    });
    it('should match a.b_c.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('a.b_c.example.com')).toEqual(true);
    });
    it('should match sub-with-strage_chars.example.another.sub.example.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(
        regExp.test('sub-with-strage_chars.example.another.sub.example.com'),
      ).toEqual(true);
    });
    it('should not match badexample.com for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('badexample.com')).toEqual(false);
    });
    it('should not match bad.example.com.others.org for *.example.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.example.com'));
      expect(regExp.test('bad.example.com.others.org')).toEqual(false);
    });
    it('should equal ^.*$ for just *', () => {
      const regExp = new RegExp(globExpressionToRegExp('*'));
      expect(regExp.toString()).toEqual('/^.*$/');
    });
    it('should match github.com with git*b.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('git*b.com'));
      expect(regExp.test('github.com')).toEqual(true);
    });
    it('should match sub.gitlab.com with *.git*b.com', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.git*b.com'));
      expect(regExp.test('sub.gitlab.com')).toEqual(true);
    });
    it('should match [2a03:4000:6:310e:216:3eff:fe53:99b3] with [*]', () => {
      const regExp = new RegExp(globExpressionToRegExp('[*]'));
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toEqual(true);
    });
    it('should match [2a03:4000:6:310e:216:3eff:fe53:99b3] with itself', () => {
      const regExp = new RegExp(
        globExpressionToRegExp('[2a03:4000:6:310e:216:3eff:fe53:99b3]'),
      );
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toEqual(true);
    });
    it('should match github.com with /^git[hub]{3}\.com$/', () => {
      const regExp = new RegExp(globExpressionToRegExp('/^git[hub]{3}\.com$/'));
      expect(regExp.test('github.com')).toEqual(true);
    });
  });

  describe('isAnIP()', () => {
    it('should return false from https://work-12345678.workplace.com', () => {
      expect(isAnIP('https://work-12345678.workplace.com')).toEqual(false);
    });

    it('should return false from https://en.wikipedia.org/wiki/Cat', () => {
      expect(isAnIP('https://en.wikipedia.org/wiki/Cat')).toEqual(false);
    });

    it('should return false from http://yahoo.com', () => {
      expect(isAnIP('http://yahoo.com')).toEqual(false);
    });

    it('should return false from random', () => {
      expect(isAnIP('random')).toEqual(false);
    });

    it('should return false from extension page', () => {
      expect(isAnIP('moz-extension://test/settings/settings.html')).toEqual(false);
    });

    it('should return true from http ip', () => {
      expect(isAnIP('http://192.168.1.1/')).toEqual(true);
    });

    it('should return true from https ip', () => {
      expect(isAnIP('https://192.168.1.1/')).toEqual(true);
    });

    it('should return true from IPv6 Address', () => {
      expect(isAnIP('https://[2607:f8b0:4006:81a:0:0:0:200e]')).toEqual(true);
    });

    it('should return true from Google DNS IPv6 Address', () => {
      expect(isAnIP('https://[2001:4860:4860::8888]')).toEqual(true);
    });

    it('should return false from undefined', () => {
      expect(isAnIP(undefined)).toEqual(false);
    });
  });

  describe('isAWebpage()', () => {
    it('should return true from https://en.wikipedia.org/wiki/Cat', () => {
      expect(isAWebpage('https://en.wikipedia.org/wiki/Cat')).toEqual(true);
    });

    it('should return true from http://yahoo.com', () => {
      expect(isAWebpage('http://yahoo.com')).toEqual(true);
    });

    it('should return false from random', () => {
      expect(isAWebpage('random')).toEqual(false);
    });

    it('should return false from extension page', () => {
      expect(isAWebpage('moz-extension://test/settings/settings.html')).toEqual(
        false,
      );
    });

    it('should return true from local file file:///home/user/test.html', () => {
      expect(isAWebpage('file:///home/user/test.html')).toEqual(true);
    });

    it('should return false from undefined', () => {
      expect(isAWebpage(undefined)).toEqual(false);
    });
  });

  describe('isFirstPartyIsolate()', () => {
    beforeEach(() => {
      when(global.browser.cookies.getAll)
        .calledWith({domain: ''})
        .mockResolvedValueOnce([] as never)
        .mockRejectedValueOnce(new Error('firstPartyDomain') as never)
        .mockRejectedValueOnce(new Error('Error') as never);
    });
    it('should return false if no error was caught', () => {
      return expect(isFirstPartyIsolate()).resolves.toEqual(false);
    });
    it('should return true if error was caught and message contained "firstPartyDomain"', () => {
      return expect(isFirstPartyIsolate()).resolves.toEqual(true);
    });
    it('should return false if error was caught and message did not contain "firstPartyIsolate"', () => {
      return expect(isFirstPartyIsolate()).resolves.toEqual(false);
    })
  });

  describe('localFileToRegex()', () => {
    it('should return itself if not a local file url (https://example.com)', () => {
      expect(localFileToRegex('https://example.com')).toEqual('https://example.com');
    });

    it('should return an escaped file url from url with RegExp special characters', () => {
      expect(localFileToRegex('file:///home/[u]ser')).toEqual('file:///home/\\[u\\]ser');
    });

    it('should return empty string from empty hostname', () => {
      expect(localFileToRegex('')).toEqual('');
    });
  });

  describe('parseCookieStoreId()', () => {
    it('should return default if contextualIdentities is false', () => {
      expect(parseCookieStoreId(false, 'abcde')).toEqual('default');
    });

    it('should return default if contextualIdentities is true and cookieStoreId is "firefox-default"', () => {
      expect(parseCookieStoreId(true, 'firefox-default')).toEqual('default');
    });

    it('should return specified cookieStoreId if contextualIdentities is true and cookieStoreId is not "firefox-default"', () => {
      expect(parseCookieStoreId(true, 'test-container')).toEqual('test-container');
    });

    it('should return default if contextualIdentities is true but cookieStoreId was undefined', () => {
      expect(parseCookieStoreId(true, undefined)).toEqual('default');
    });
  });

  describe('prepareCleanupDomains()', () => {
    it('should return empty array for empty domain', () => {
      expect(prepareCleanupDomains('')).toEqual([]);
    });

    it('should return empty array for domains with only whitespaces', () => {
      expect(prepareCleanupDomains(' ')).toEqual([]);
    });

    it('should return cleanup domains from www.example.com', () => {
      expect(prepareCleanupDomains('www.example.com')).toEqual([
        'www.example.com',
        '.www.example.com',
      ]);
    });

    it('should return cleanup domains from .example.com', () => {
      expect(prepareCleanupDomains('.example.com')).toEqual([
        'example.com',
        '.example.com',
        'www.example.com',
        '.www.example.com',
      ]);
    });

    it('should return cleanup domains from example.com', () => {
      expect(prepareCleanupDomains('example.com')).toEqual([
        'example.com',
        '.example.com',
        'www.example.com',
        '.www.example.com',
      ]);
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
      ).toEqual('https://google.com/');
    });

    it('should return a wrapped ivp6 ip cookie domain in brackets', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          path: '/',
          secure: true,
        }),
      ).toEqual('https://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]/');
    });

    it('should return http://google.com with a removed leading .', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: '.google.com',
          path: '/test',
          secure: false,
        }),
      ).toEqual('http://google.com/test');
    });

    it('should return local file path for cookie from local file', () => {
      expect(prepareCookieDomain({...mockCookie, domain: '', path: '/home/user'})).toEqual('file:///home/user');
    });

    it('should return domain ending with a dot if supplied', () => {
      expect(prepareCookieDomain({...mockCookie, domain: 'example.com.', secure: true})).toEqual('https://example.com./');
    });
  });

  describe('returnMatchedExpressionObject()', () => {
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
      expect(results!.expression).toEqual('*.expression.com');
    });
    it('should return undefined', () => {
      const results = returnMatchedExpressionObject(
        state,
        'firefox-container-1',
        'expression.com',
      );
      expect(results).toEqual(undefined);
    });
  });

  describe('returnOptionalCookieAPIAttributes()', () => {
    it('should return an object with an undefined firstPartyDomain when firstPartyIsolate is true and firstPartyDomain was not already defined.', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        domain: 'example.com',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
        true,
      );
      expect(results).toEqual(
        expect.objectContaining({
          domain: 'example.com',
          firstPartyDomain: null,
        }),
      );
    });

    it('should return an object the same object with a firstPartyDomain if firstPartyIsolate was true', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
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
        true,
      );
      expect(results).toEqual(
        expect.objectContaining({
          domain: 'example.com',
          firstPartyDomain: 'example.com',
        }),
      );
    });

    it('should return an object with no firstPartyDomain if firstPartyIsolate was false', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Firefox',
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        firstPartyDomain: '',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
        false,
      );
      expect(results).toEqual(
        expect.not.objectContaining({
          firstPartyDomain: '',
        }),
      );
    });

    it('should return an object with no firstPartyDomain (Browser other than FF) (firstPartyIsolate is false)', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: 'Chrome',
        },
      };
      const cookieAPIAttributes = {
        ...mockCookie,
        firstPartyDomain: '',
      };
      const results = returnOptionalCookieAPIAttributes(
        state,
        cookieAPIAttributes,
        false,
      );
      expect(results).toEqual(
        expect.not.objectContaining({
          firstPartyDomain: '',
        }),
      );
    });
  });

  describe('showNotification()', () => {
    beforeAll(() => {
      when(global.browser.i18n.getMessage)
        .calledWith('manualActionNotification')
        .mockReturnValue('manual');
      when(global.browser.runtime.getManifest)
        .calledWith()
        .mockReturnValue({version: '3.99.99'});
      when(global.browser.runtime.getURL)
        .calledWith(expect.anything())
        .mockReturnValue('');
    });
    afterAll(() => {
      global.browser.i18n.getMessage.clearMocks();
      global.browser.runtime.getManifest.clearMocks();
      global.browser.runtime.getURL.clearMocks();
    })
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout');
    });

    it('should expect one call to browser.notifications.create with default title', async () => {
      showNotification({duration:1,msg: 'Test Notification'});
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][0]).toEqual(expect.stringContaining('manual-'));
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(expect.objectContaining({
        "message": "Test Notification",
        "title": "CAD 3.99.99 - manual",
        "type": "basic",
      }));
      expect(setTimeout).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should expect one call to browser.notifications.create with custom title', async () => {
      showNotification({duration:1,msg: 'Test Notification', title: 'custom'});
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][0]).toEqual(expect.stringContaining('manual-'));
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(expect.objectContaining({
        "message": "Test Notification",
        "title": "CAD 3.99.99 - custom",
        "type": "basic",
      }));
      expect(setTimeout).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
  });

  describe('sleep()', () => {
    jest.useFakeTimers();
    const spySetTimeout = jest.spyOn(global, 'setTimeout');
    afterEach(() => {
      spySetTimeout.mockClear();
      jest.clearAllTimers();
    });

    it('should return undefined as result', () => {
      expect.assertions(1);
      const result = sleep(1).then(r => expect(r).toEqual(undefined));
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 250ms if input was 100', () => {
      expect.assertions(3);
      const result = sleep(100).then(r => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
      })
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 1500ms if input was 1500', () => {
      expect.assertions(3);
      const result = sleep(1500).then(r => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
      });
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 2147483500ms if input was greater than 2147483500', () => {
      expect.assertions(3);
      const result = sleep(2345678901).then(r => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 2147483500);
      });
      jest.runAllTimers();
      return result;
    });

  });

  describe('trimDot()', () => {
    it('should return example.com with no leading dots', () => {
      const results = trimDot('.example.com');
      expect(results).toEqual('example.com');
    });
    it('should return example.com with no leading and ending dots', () => {
      const results = trimDot('.example.com.');
      expect(results).toEqual('example.com');
    });
  });

  describe('throwErrorNotification()', () => {
    beforeAll(() => {
      when(global.browser.i18n.getMessage)
        .calledWith('errorText')
        .mockReturnValue('Error!');
      when(global.browser.runtime.getManifest)
        .calledWith()
        .mockReturnValue({version: '3.99.99'});
      when(global.browser.runtime.getURL)
        .calledWith(expect.anything())
        .mockReturnValue('');
    });
    afterAll(() => {
      global.browser.i18n.getMessage.clearMocks();
      global.browser.runtime.getManifest.clearMocks();
      global.browser.runtime.getURL.clearMocks();
    })

    it('should expect one call to browser.notifications.create', () => {
      throwErrorNotification({ name: 'Test Error', message: 'An ERROR!' });
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][0]).toEqual('failed-notification');
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(expect.objectContaining({
        "message": "An ERROR!",
        "title": "Error!",
        "type": "basic",
      }));
    });
  });

  describe('undefinedIsTrue()', () => {
    it('should return true for undefined', () => {
      expect(undefinedIsTrue(undefined)).toEqual(true);
    });
    it('should return true for true', () => {
      expect(undefinedIsTrue(true)).toEqual(true);
    });
    it('should return false for false', () => {
      expect(undefinedIsTrue(false)).toEqual(false);
    });
  });
});
