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
  eventListenerActions,
  extractMainDomain,
  getAllCookiesForDomain,
  getContainerExpressionDefault,
  getHostname,
  getMatchedExpressions,
  getSearchResults,
  getSetting,
  getStoreId,
  globExpressionToRegExp,
  isAnIP,
  isAWebpage,
  isChrome,
  isFirefox,
  isFirefoxAndroid,
  isFirefoxNotAndroid,
  isFirstPartyIsolate,
  localFileToRegex,
  matchIPInExpression,
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
  validateExpressionDomain,
} from '../../src/services/Libs';

import ipaddr from 'ipaddr.js';

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
        .mockReturnValue({ version: '0.12.34' });
    });

    const origDebug = console.debug; // eslint-disable-line no-console
    const origError = console.error; // eslint-disable-line no-console
    const origInfo = console.info; // eslint-disable-line no-console
    const origLog = console.log; // eslint-disable-line no-console
    const origWarn = console.warn; // eslint-disable-line no-console

    afterEach(() => {
      console.debug = origDebug; // eslint-disable-line no-console
      console.error = origError; // eslint-disable-line no-console
      console.info = origInfo; // eslint-disable-line no-console
      console.log = origLog; // eslint-disable-line no-console
      console.warn = origWarn; // eslint-disable-line no-console
    });

    const consoleOutput = [] as { type: string; msg: string }[];
    const mockedDebug = (msg: string) =>
      consoleOutput.push({ type: 'debug', msg });
    const mockedError = (msg: string) =>
      consoleOutput.push({ type: 'error', msg });
    const mockedInfo = (msg: string) =>
      consoleOutput.push({ type: 'info', msg });
    const mockedLog = (msg: string) => consoleOutput.push({ type: 'log', msg });
    const mockedWarn = (msg: string) =>
      consoleOutput.push({ type: 'warn', msg });

    beforeEach(() => {
      console.debug = mockedDebug; // eslint-disable-line no-console
      console.error = mockedError; // eslint-disable-line no-console
      console.info = mockedInfo; // eslint-disable-line no-console
      console.log = mockedLog; // eslint-disable-line no-console
      console.warn = mockedWarn; // eslint-disable-line no-console
      consoleOutput.length = 0;
    });

    it('should do nothing if output=false', () => {
      expect.assertions(1);
      cadLog({ msg: 'nothing' }, false);
      expect(consoleOutput.length).toBe(0);
    });

    it('should format the Log Header with manifest version', () => {
      expect.assertions(1);
      cadLog({ msg: 'headerTest' }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - headerTest\n' },
      ]);
    });

    it('should output to debug when no type is given', () => {
      expect.assertions(1);
      cadLog({ msg: 'noType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - noType\n' },
      ]);
    });
    it('should output to debug when type is debug', () => {
      expect.assertions(1);
      cadLog({ type: 'debug', msg: 'debugType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - debugType\n' },
      ]);
    });
    it('should output to error when type is error', () => {
      expect.assertions(1);
      cadLog({ type: 'error', msg: 'errorType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'error', msg: 'CAD_0.12.34 - error - errorType\n' },
      ]);
    });
    it('should output to info when type is info', () => {
      expect.assertions(1);
      cadLog({ type: 'info', msg: 'infoType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'info', msg: 'CAD_0.12.34 - info - infoType\n' },
      ]);
    });
    it('should output to log when type is log', () => {
      expect.assertions(1);
      cadLog({ type: 'log', msg: 'logType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'log', msg: 'CAD_0.12.34 - log - logType\n' },
      ]);
    });
    it('should output to warn when type is warn', () => {
      expect.assertions(1);
      cadLog({ type: 'warn', msg: 'warnType' }, true);
      expect(consoleOutput).toEqual([
        { type: 'warn', msg: 'CAD_0.12.34 - warn - warnType\n' },
      ]);
    });
    it('should default back to debug type when invalid type is given', () => {
      expect.assertions(1);
      cadLog({ type: 'invalid', msg: 'invalidType' }, true);
      expect(consoleOutput).toEqual([
        {
          type: 'error',
          msg:
            'CAD_0.12.34 - Invalid Console Output Type given [ invalid ].  Using [debug] instead.',
        },
        { type: 'debug', msg: 'CAD_0.12.34 - debug - invalidType\n' },
      ]);
    });

    it('should display supplied string accordingly', () => {
      expect.assertions(1);
      cadLog({ msg: 'withObject', x: 'test.' }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - withObject\ntest.' },
      ]);
    });

    it('should attempt to parse function as string for display', () => {
      expect.assertions(1);
      cadLog({ msg: 'objectFunction', x: RegExp.toString }, true);
      expect(consoleOutput).toEqual([
        {
          type: 'warn',
          msg:
            'CAD_0.12.34 - Received unexpected typeof [ function ].  Attempting to display it...',
        },
        {
          type: 'debug',
          msg:
            'CAD_0.12.34 - debug - objectFunction\nfunction toString() { [native code] }',
        },
      ]);
    });

    it('should parse object for display', () => {
      expect.assertions(1);
      cadLog({ msg: 'objectString', x: { a: 'abc' } }, true);
      expect(consoleOutput).toEqual([
        {
          type: 'debug',
          msg: 'CAD_0.12.34 - debug - objectString\n{\n  "a": "abc"\n}',
        },
      ]);
    });

    it('should parse number as string.', () => {
      expect.assertions(1);
      cadLog({ msg: 'numberString', x: 123 }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - numberString\n123' },
      ]);
    });

    it('should parse boolean as string.', () => {
      expect.assertions(1);
      cadLog({ msg: 'booleanString', x: true }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - booleanString\ntrue' },
      ]);
    });

    it('should parse string as string.', () => {
      expect.assertions(1);
      cadLog({ msg: 'stringString', x: 'test' }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - stringString\ntest' },
      ]);
    });

    it('should parse undefined as empty string.', () => {
      expect.assertions(1);
      cadLog({ msg: 'undefinedString', x: undefined }, true);
      expect(consoleOutput).toEqual([
        { type: 'debug', msg: 'CAD_0.12.34 - debug - undefinedString\n' },
      ]);
    });

    it('should not output to console on empty input object (no message), even if output=true', () => {
      expect.assertions(1);
      cadLog({}, true);
      expect(consoleOutput.length).toEqual(0);
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
      windowId: 1,
    };
    it('should extract information relevant to debug in Firefox', () => {
      expect(createPartialTabInfo(testTab)).toMatchObject({
        cookieStoreId: 'firefox-default',
        discarded: false,
        id: 1,
        incognito: false,
        status: 'complete',
        url: 'https://test.cad',
        windowId: 1,
      });
    });
    it('should extract information relevant to debug in Chrome', () => {
      expect(
        createPartialTabInfo({ ...testTab, cookieStoreId: undefined }),
      ).toMatchObject({
        discarded: false,
        id: 1,
        incognito: false,
        status: 'complete',
        url: 'https://test.cad',
        windowId: 1,
      });
    });
  });

  describe('eventListenerActions()', () => {
    it('should do nothing if an event was not passed in', () => {
      expect(() => {
        eventListenerActions(
          undefined as any,
          Function,
          EventListenerAction.ADD,
        );
      }).not.toThrowError();
      // Unexpected error would be TypeError: "cannot read property 'hasListener' of undefined"
    });

    it('should do nothing if an "event" passed in is not an Event Listener', () => {
      expect(() => {
        eventListenerActions({} as any, Function, EventListenerAction.REMOVE);
      }).not.toThrowError();
    });

    it('should add the event listener', () => {
      eventListenerActions(
        browser.cookies.onChanged,
        Function,
        EventListenerAction.ADD,
      );
      expect(
        global.browser.cookies.onChanged.addListener,
      ).toHaveBeenCalledTimes(1);
    });

    it('should not add the event listener again if it already exists', () => {
      when(global.browser.cookies.onChanged.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(true);
      eventListenerActions(
        browser.cookies.onChanged,
        Function,
        EventListenerAction.ADD,
      );
      expect(
        global.browser.cookies.onChanged.addListener,
      ).not.toHaveBeenCalled();
    });

    it('should remove the listener', () => {
      when(global.browser.cookies.onChanged.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(true);
      eventListenerActions(
        browser.cookies.onChanged,
        Function,
        EventListenerAction.REMOVE,
      );
      expect(
        global.browser.cookies.onChanged.removeListener,
      ).toHaveBeenCalledTimes(1);
    });

    it('should not remove a non-existent listener', () => {
      when(global.browser.cookies.onChanged.hasListener)
        .calledWith(expect.any(Function))
        .mockReturnValue(false);
      eventListenerActions(
        browser.cookies.onChanged,
        Function,
        EventListenerAction.REMOVE,
      );
      expect(
        global.browser.cookies.onChanged.removeListener,
      ).not.toHaveBeenCalled();
    });
  });

  describe('extractMainDomain()', () => {
    it('should return itself from file:///home/user/file.html', () => {
      expect(extractMainDomain('file:///home/user/file.html')).toEqual(
        'file:///home/user/file.html',
      );
    });

    it('should return workplace.com from work-12345678.workplace.com', () => {
      expect(extractMainDomain('work-12345678.workplace.com')).toEqual(
        'workplace.com',
      );
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

  describe('getAllCookiesForDomain()', () => {
    beforeAll(() => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: expect.any(String), storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: expect.any(String),
          firstPartyDomain: expect.any(String),
          storeId: 'firefox-default',
        })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ storeId: 'firefox-default' })
        .mockResolvedValue([
          testCookie,
          { ...testCookie, domain: '', path: '/test/' },
        ] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ storeId: 'firefox-default', firstPartyDomain: undefined })
        .mockResolvedValue([
          testCookie,
          { ...testCookie, domain: '', path: '/test/' },
        ] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ domain: '' })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'domain.com', storeId: 'firefox-default' })
        .mockResolvedValue([testCookie] as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '10.1.1.1',
          firstPartyDomain: '10.1.1.1',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([testCookie] as never);
    });

    const testCookie: browser.cookies.Cookie = {
      domain: 'domain.com',
      hostOnly: true,
      httpOnly: true,
      name: 'blah',
      path: '/',
      sameSite: 'no_restriction',
      secure: true,
      session: true,
      storeId: 'firefox-default',
      value: 'test value',
    };

    const sampleTab: browser.tabs.Tab = {
      active: true,
      cookieStoreId: 'firefox-default',
      discarded: false,
      hidden: false,
      highlighted: false,
      incognito: false,
      index: 0,
      isArticle: false,
      isInReaderMode: false,
      lastAccessed: 12345678,
      pinned: false,
      selected: true,
      url: 'https://www.example.com',
      windowId: 1,
    };

    const chromeState: State = {
      ...initialState,
      cache: {
        browserDetect: browserName.Chrome,
      },
    };

    const firefoxState: State = {
      ...initialState,
      cache: {
        browserDetect: browserName.Firefox,
      },
    };

    it('should do nothing if url is an internal page', async () => {
      const result = await getAllCookiesForDomain(chromeState, {
        ...sampleTab,
        url: 'about:home',
      });
      const result2 = await getAllCookiesForDomain(chromeState, {
        ...sampleTab,
        url: 'chrome:newtab',
      });
      expect(result).toBeUndefined();
      expect(result2).toBeUndefined();
    });

    it('should do nothing if url is empty string', async () => {
      const result = await getAllCookiesForDomain(chromeState, {
        ...sampleTab,
        url: '',
      });
      expect(result).toBeUndefined();
    });

    it('should do nothing if url is undefined', async () => {
      const result = await getAllCookiesForDomain(chromeState, {
        ...sampleTab,
        url: undefined,
      });
      expect(result).toBeUndefined();
    });

    it('should do nothing if url is not valid', async () => {
      const result = await getAllCookiesForDomain(firefoxState, {
        ...sampleTab,
        url: 'bad',
      });
      expect(result).toBeUndefined();
    });

    // Test in Chrome, though both FF and Chrome should return same thing.
    it('should work on local files', async () => {
      const result = await getAllCookiesForDomain(chromeState, {
        ...sampleTab,
        url: 'file:///test/file.html',
      });
      expect(result).toStrictEqual(
        expect.arrayContaining([{ ...testCookie, domain: '', path: '/test/' }]),
      );
    });

    it('should fetch additional FPI Cookies (use_site enabled) as needed', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '',
        })
        .mockRejectedValueOnce(new Error('firstPartyDomain') as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: 'domain.com',
          firstPartyDomain: 'domain.com',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([{ ...testCookie, name: 'old FPI' }] as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: 'domain.com',
          firstPartyDomain: '(https,domain.com)',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([{ ...testCookie, name: 'FPI_use_case' }] as never);
      const result = await getAllCookiesForDomain(firefoxState, {
        ...sampleTab,
        url: 'https://domain.com',
      });
      expect(result).toStrictEqual([
        { ...testCookie, name: 'old FPI' },
        { ...testCookie, name: 'FPI_use_case' },
      ]);
    });
    it('should fetch additional FPI Cookies (use_site enabled) with a port in URL as needed', async () => {
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '',
        })
        .mockRejectedValueOnce(new Error('firstPartyDomain') as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '10.1.1.1',
          firstPartyDomain: '10.1.1.1',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([testCookie] as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '10.1.1.1',
          firstPartyDomain: '(https,10.1.1.1)',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({
          domain: '10.1.1.1',
          firstPartyDomain: '(https,10.1.1.1,8080)',
          storeId: 'firefox-default',
        })
        .mockResolvedValue([
          { ...testCookie, name: 'FPI_usecase_port' },
        ] as never);
      const result = await getAllCookiesForDomain(firefoxState, {
        ...sampleTab,
        url: 'https://10.1.1.1:8080',
      });
      expect(result).toStrictEqual([
        testCookie,
        { ...testCookie, name: 'FPI_usecase_port' },
      ]);
    });
  });

  describe('getContainerExpressionDefault()', () => {
    const mockExpression: Expression = {
      expression: '',
      listType: ListType.WHITE,
      storeId: '',
    };
    it('should return default expression if list does not contain storeId given', () => {
      expect(
        getContainerExpressionDefault(initialState, 'default', ListType.WHITE),
      ).toEqual(mockExpression);
    });
    it('should return default expression if existing list does not contain default expression key', () => {
      expect(
        getContainerExpressionDefault(
          { ...initialState, lists: { default: [mockExpression] } },
          'default',
          ListType.WHITE,
        ),
      ).toEqual(mockExpression);
    });
    it('should return customized default expression if existing list contains default expression key', () => {
      expect(
        getContainerExpressionDefault(
          {
            ...initialState,
            lists: {
              default: [
                {
                  expression: `_Default:${ListType.WHITE}`,
                  cleanSiteData: [SiteDataType.PLUGINDATA],
                  listType: ListType.WHITE,
                  storeId: 'default',
                },
              ],
            },
          },
          'default',
          ListType.WHITE,
        ),
      ).toEqual(
        expect.objectContaining({ cleanSiteData: [SiteDataType.PLUGINDATA] }),
      );
    });
    it('should return customized default expression for non-default container from default container if non-default container is missing defaults', () => {
      expect(
        getContainerExpressionDefault(
          {
            ...initialState,
            settings: {
              ...initialState.settings,
              [SettingID.CONTEXTUAL_IDENTITIES]: {
                name: SettingID.CONTEXTUAL_IDENTITIES,
                value: true,
              },
            },
            lists: {
              default: [
                {
                  expression: `_Default:${ListType.WHITE}`,
                  cleanSiteData: [SiteDataType.PLUGINDATA],
                  listType: ListType.WHITE,
                  storeId: 'default',
                },
              ],
            },
          },
          'firefox-container-1',
          ListType.WHITE,
        ),
      ).toEqual(
        expect.objectContaining({ cleanSiteData: [SiteDataType.PLUGINDATA] }),
      );
    });
    it('should return default expression for non-default container if non-default and default container is missing defaults', () => {
      expect(
        getContainerExpressionDefault(
          {
            ...initialState,
            settings: {
              ...initialState.settings,
              [SettingID.CONTEXTUAL_IDENTITIES]: {
                name: SettingID.CONTEXTUAL_IDENTITIES,
                value: true,
              },
            },
          },
          'firefox-container-1',
          ListType.WHITE,
        ),
      ).toEqual(mockExpression);
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
      expect(getHostname('file:///home/user/folder/file.html')).toEqual(
        'file:///home/user/folder',
      );
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

  describe('getMatchedExpressions()', () => {
    const defaultExpression: Expression = {
      expression: '*.expression.com',
      listType: ListType.WHITE,
      storeId: 'default',
    };
    const lists: StoreIdToExpressionList = {
      default: [
        defaultExpression,
        {
          ...defaultExpression,
          expression: '192.168.1.1',
        },
        {
          ...defaultExpression,
          expression: 'fd12:3456:789a:1::1',
        },
        {
          ...defaultExpression,
          expression: '192.168.10.0/24',
        },
        {
          ...defaultExpression,
          expression: 'fd12:3456:7890:1::/64',
        },
        {
          ...defaultExpression,
          expression: '192.168.10.256/22',
        },
      ],
    };
    it('should return empty array if lists have no storeId', () => {
      expect(getMatchedExpressions(lists, 'test')).toEqual([]);
    });
    it('should return entire storeId list if no input was given.', () => {
      expect(getMatchedExpressions(lists, 'default')).toEqual([
        ...lists['default'],
      ]);
    });
    it('should return entire storeId list if input was only whitespaces', () => {
      expect(getMatchedExpressions(lists, 'default', '  ')).toEqual([
        ...lists['default'],
      ]);
    });
    it('should not match 192.168.1.1 with 0xc0.168.1.1 as not valid IPv4 Four-Part Decimal format', () => {
      // 0xc0 = 192
      expect(getMatchedExpressions(lists, 'default', '0xc0.168.1.1')).toEqual(
        [],
      );
    });
    it('should return expressions with matching IPv4 Address', () => {
      expect(getMatchedExpressions(lists, 'default', '192.168.1.1')).toEqual([
        lists['default'][1],
      ]);
    });
    it('should return expressions with matching IPv6 Address', () => {
      expect(
        getMatchedExpressions(lists, 'default', 'fd12:3456:789a:1::1'),
      ).toEqual([lists['default'][2]]);
    });
    it('should return expressions with matching IPv4 Address with CIDR', () => {
      expect(getMatchedExpressions(lists, 'default', '192.168.10.5')).toEqual([
        lists['default'][3],
      ]);
    });
    it('should return expressions with matching IPv6 Address with CIDR', () => {
      expect(
        getMatchedExpressions(lists, 'default', 'fd12:3456:7890:1:5555::'),
      ).toEqual([lists['default'][4]]);
    });
    it('should return partial matched expressions when searching', () => {
      expect(getMatchedExpressions(lists, 'default', 'express', true)).toEqual([
        lists['default'][0],
      ]);
    });
  });

  describe('getSearchResults()', () => {
    it('should return false if string is not matched', () => {
      expect(getSearchResults('*.expression.com', 'test')).toEqual(false);
    });
    it('should return true if string was partially matched', () => {
      expect(getSearchResults('*.expression.com', 'express')).toEqual(true);
    });
    it('should return true if string was exactly matched', () => {
      expect(getSearchResults('test', 'test')).toEqual(true);
    });
    it('should return false if string is invalid regex', () => {
      expect(getSearchResults('abc(x', 'abc')).toEqual(false);
    });
  });

  describe('getSetting()', () => {
    it('should return value of false for activeMode in default settings', () => {
      expect(getSetting(initialState, SettingID.ACTIVE_MODE)).toEqual(false);
    });
  });

  describe('getStoreId()', () => {
    const contextualIdentitiesFalseChrome = {
      ...initialState,
      cache: {
        browserDetect: browserName.Chrome,
      },
      settings: {
        [SettingID.CONTEXTUAL_IDENTITIES]: {
          id: 7,
          name: SettingID.CONTEXTUAL_IDENTITIES,
          value: false,
        },
      },
    };
    const contextualIdentitiesFalseFF = {
      ...initialState,
      cache: {
        browserDetect: browserName.Firefox,
      },
      settings: {
        [SettingID.CONTEXTUAL_IDENTITIES]: {
          id: 7,
          name: SettingID.CONTEXTUAL_IDENTITIES,
          value: false,
        },
      },
    };
    const contextualIdentitiesTrue = {
      ...initialState,
      cache: {
        browserDetect: browserName.Firefox,
      },
      settings: {
        [SettingID.CONTEXTUAL_IDENTITIES]: {
          id: 7,
          name: SettingID.CONTEXTUAL_IDENTITIES,
          value: true,
        },
      },
    };

    // Default storeIds
    it('should return default from firefox-default', () => {
      expect(
        getStoreId(contextualIdentitiesFalseFF, 'firefox-default'),
      ).toEqual('default');
    });

    it('should return default from Chrome and storeId 0', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '0')).toEqual(
        'default',
      );
    });

    it('should return default from Chrome and storeId 0', () => {
      expect(
        getStoreId(
          {
            ...contextualIdentitiesFalseChrome,
            cache: {
              browserDetect: browserName.Opera,
            },
          },
          '0',
        ),
      ).toEqual('default');
    });

    // Private storeIds
    it('should return firefox-private from Firefox and storeId firefox-private (private)', () => {
      expect(
        getStoreId(contextualIdentitiesFalseFF, 'firefox-private'),
      ).toEqual('firefox-private');
    });

    it('should return firefox-private from Firefox and storeId firefox-private (private) with containers', () => {
      expect(getStoreId(contextualIdentitiesTrue, 'firefox-private')).toEqual(
        'firefox-private',
      );
    });

    it('should return private from Chrome and storeId 1 (private)', () => {
      expect(getStoreId(contextualIdentitiesFalseChrome, '1')).toEqual(
        'private',
      );
    });

    // Containers
    it('should return firefox-container-1 from Firefox and Containers on', () => {
      expect(
        getStoreId(contextualIdentitiesTrue, 'firefox-container-1'),
      ).toEqual('firefox-container-1');
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
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toEqual(
        true,
      );
    });
    it('should match [2a03:4000:6:310e:216:3eff:fe53:99b3] with itself', () => {
      const regExp = new RegExp(
        globExpressionToRegExp('[2a03:4000:6:310e:216:3eff:fe53:99b3]'),
      );
      expect(regExp.test('[2a03:4000:6:310e:216:3eff:fe53:99b3]')).toEqual(
        true,
      );
    });
    it('should match github.com with /^git[hub]{3}.com$/', () => {
      const regExp = new RegExp(globExpressionToRegExp('/^git[hub]{3}.com$/'));
      expect(regExp.test('github.com')).toEqual(true);
    });
    it('should escape all backslash properly. (should only fail on pre-3.6.0)', () => {
      expect(globExpressionToRegExp('test\\abc')).toEqual('^test\\\\abc$');
    });
    it('should parse *. only in the beginning as (^|.).  Otherwise as wildcard before dot.', () => {
      const regExp = new RegExp(globExpressionToRegExp('*.test*.com'));
      expect(regExp.test('sub.testcom.com')).toEqual(true);
      expect(regExp.test('tests.com')).toEqual(true);
      expect(regExp.test('test.com')).toEqual(true);
      expect(regExp.test('a.test.com')).toEqual(true);
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
      expect(isAnIP('moz-extension://test/settings/settings.html')).toEqual(
        false,
      );
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

  describe('isChrome()', () => {
    it('should return false if browserDetect is undefined', () => {
      expect(isChrome({})).toBe(false);
    });
    it('should return false if browserDetect is not Chrome', () => {
      expect(isChrome({ browserDetect: browserName.Unknown })).toBe(false);
    });
    it('should return true if browserDetect is Chrome', () => {
      expect(isChrome({ browserDetect: browserName.Chrome })).toBe(true);
    });
  });

  describe('isFirefox()', () => {
    it('should return false if browserDetect is undefined', () => {
      expect(isFirefox({})).toBe(false);
    });
    it('should return false if browserDetect is not Firefox', () => {
      expect(isFirefox({ browserDetect: browserName.Unknown })).toBe(false);
    });
    it('should return true if browserDetect is Firefox', () => {
      expect(isFirefox({ browserDetect: browserName.Firefox })).toBe(true);
    });
  });

  describe('isFirefoxAndroid()', () => {
    it('should return false if platformOs is undefined', () => {
      expect(isFirefoxAndroid({})).toBe(false);
    });
    it('should return false if platformOs is not android', () => {
      expect(
        isFirefoxAndroid({
          browserDetect: browserName.Unknown,
          platformOs: 'linux',
        }),
      ).toBe(false);
    });
    it('should return true if platformOs is android', () => {
      expect(
        isFirefoxAndroid({
          browserDetect: browserName.Firefox,
          platformOs: 'android',
        }),
      ).toBe(true);
    });
  });

  describe('isFirefoxNotAndroid()', () => {
    it('should return false if platformOs is undefined', () => {
      expect(isFirefoxNotAndroid({ browserDetect: browserName.Unknown })).toBe(
        false,
      );
    });
    it('should return true if platformOs is not android', () => {
      expect(
        isFirefoxNotAndroid({
          browserDetect: browserName.Firefox,
          platformOs: 'linux',
        }),
      ).toBe(true);
    });
    it('should return false if platformOs is android', () => {
      expect(
        isFirefoxNotAndroid({
          browserDetect: browserName.Firefox,
          platformOs: 'android',
        }),
      ).toBe(false);
    });
  });

  describe('isFirstPartyIsolate()', () => {
    beforeEach(() => {
      when(global.browser.cookies.getAll)
        .calledWith({ domain: '' })
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
    });
  });

  describe('localFileToRegex()', () => {
    it('should return itself if not a local file url (https://example.com)', () => {
      expect(localFileToRegex('https://example.com')).toEqual(
        'https://example.com',
      );
    });

    it('should return an escaped file url from url with RegExp special characters', () => {
      expect(localFileToRegex('file:///home/[u]ser')).toEqual(
        'file:///home/\\[u\\]ser',
      );
    });

    it('should return empty string from empty hostname', () => {
      expect(localFileToRegex('')).toEqual('');
    });
  });

  describe('matchIPInExpression()', () => {
    const ipv4Test = ipaddr.parse('1.1.1.1');
    it('should return undefined if Expression is not an IP', () => {
      expect(matchIPInExpression('test', ipv4Test)).toBeUndefined();
    });
    it('should return false if IP type is mismatched', () => {
      expect(matchIPInExpression('fd12:3456:7890:1:5555::', ipv4Test)).toEqual(
        false,
      );
    });
    it('should return undefined if CIDR notation format is not as expected', () => {
      expect(matchIPInExpression('1.1/1/1', ipv4Test)).toBeUndefined();
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
      expect(parseCookieStoreId(true, 'test-container')).toEqual(
        'test-container',
      );
    });

    it('should return default if contextualIdentities is true but cookieStoreId was undefined', () => {
      expect(parseCookieStoreId(true, undefined)).toEqual('default');
    });
  });

  describe('prepareCleanupDomains()', () => {
    it('should return empty array for empty domain', () => {
      expect(prepareCleanupDomains('', browserName.Firefox)).toEqual([]);
    });

    it('should return empty array for domains with only whitespaces', () => {
      expect(prepareCleanupDomains(' ', browserName.Firefox)).toEqual([]);
    });

    it('should return cleanup domains from www.example.com', () => {
      expect(
        prepareCleanupDomains('www.example.com', browserName.Firefox),
      ).toEqual(['www.example.com', '.www.example.com']);
    });

    it('should return cleanup domains from .example.com', () => {
      expect(
        prepareCleanupDomains('.example.com', browserName.Firefox),
      ).toEqual([
        'example.com',
        '.example.com',
        'www.example.com',
        '.www.example.com',
      ]);
    });

    it('should return cleanup domains from example.com', () => {
      expect(
        prepareCleanupDomains('example.com', browserName.Firefox),
      ).toEqual([
        'example.com',
        '.example.com',
        'www.example.com',
        '.www.example.com',
      ]);
    });

    it('should return cleanup domains from example.com for Chrome', () => {
      expect(prepareCleanupDomains('example.com', browserName.Chrome)).toEqual([
        'http://example.com',
        'https://example.com',
        'http://.example.com',
        'https://.example.com',
        'http://www.example.com',
        'https://www.example.com',
        'http://.www.example.com',
        'https://.www.example.com',
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
      expect(
        prepareCookieDomain({ ...mockCookie, domain: '', path: '/home/user' }),
      ).toEqual('file:///home/user');
    });

    it('should return domain ending with a dot if supplied', () => {
      expect(
        prepareCookieDomain({
          ...mockCookie,
          domain: 'example.com.',
          secure: true,
        }),
      ).toEqual('https://example.com./');
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
      expect(results).toEqual(
        expect.objectContaining({ expression: '*.expression.com' }),
      );
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
    it('should return an object with an undefined firstPartyDomain if browser was Firefox and firstPartyDomain was not already defined.', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: browserName.Firefox,
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

    it('should return an object the same object with a firstPartyDomain if browser was firefox and firstPartyDomain was given', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: browserName.Firefox,
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

    it('should return an object with no firstPartyDomain (Browser other than FF)', () => {
      const state = {
        ...initialState,
        cache: {
          browserDetect: browserName.Chrome,
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
      expect(results).not.toHaveProperty('firstPartyDomain');
    });
  });

  describe('showNotification()', () => {
    beforeAll(() => {
      when(global.browser.notifications.create)
        .calledWith(expect.any(String), expect.any(Object))
        .mockResolvedValue('testID' as never);
      when(global.browser.notifications.clear)
        .calledWith(expect.any(String))
        .mockResolvedValue(true as never);
      when(global.browser.i18n.getMessage)
        .calledWith('manualActionNotification')
        .mockReturnValue('manual');
      when(global.browser.runtime.getManifest)
        .calledWith()
        .mockReturnValue({ version: '3.99.99' });
      when(global.browser.runtime.getURL)
        .calledWith(expect.anything())
        .mockReturnValue('');
    });
    afterAll(() => {
      global.browser.i18n.getMessage.clearMocks();
      global.browser.runtime.getManifest.clearMocks();
      global.browser.runtime.getURL.clearMocks();
      jest.clearAllTimers();
    });

    it('should expect one call to browser.notifications.create with default title', async () => {
      const spyTimeout = jest.spyOn(global, 'setTimeout');
      showNotification({ duration: 1, msg: 'Test Notification' });
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][0]).toEqual(
        expect.stringContaining('CAD-notification-'),
      );
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          message: 'Test Notification',
          title: 'CAD 3.99.99 - manual',
          type: 'basic',
        }),
      );
      expect(spyTimeout).toHaveBeenCalled();
      expect(spyTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

      jest.runAllTimers();
      expect(browser.notifications.clear).toHaveBeenCalledTimes(1);
    });

    it('should expect one call to browser.notifications.create with custom title', async () => {
      showNotification({
        duration: 1,
        msg: 'Test Notification',
        title: 'custom',
      });
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          message: 'Test Notification',
          title: 'CAD 3.99.99 - custom',
          type: 'basic',
        }),
      );
    });

    it('should not show notification if display was false', async () => {
      showNotification(
        {
          duration: 1,
          msg: 'Unshown Notification',
        },
        false,
      );
      expect(global.browser.notifications.create).not.toHaveBeenCalled();
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
      const result = sleep(1).then((r) => expect(r).toEqual(undefined));
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 250ms if input was 100', () => {
      expect.assertions(3);
      const result = sleep(100).then((r) => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
      });
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 1500ms if input was 1500', () => {
      expect.assertions(3);
      const result = sleep(1500).then((r) => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
      });
      jest.runAllTimers();
      return result;
    });

    it('setTimeout in Promise should be set to 2147483500ms if input was greater than 2147483500', () => {
      expect.assertions(3);
      const result = sleep(2345678901).then((r) => {
        expect(r).toEqual(undefined);
        expect(spySetTimeout).toBeCalledTimes(1);
        expect(spySetTimeout).toHaveBeenCalledWith(
          expect.any(Function),
          2147483500,
        );
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
      when(global.browser.notifications.create)
        .calledWith(expect.any(String), expect.any(Object))
        .mockResolvedValue('testID' as never);
      when(global.browser.notifications.clear)
        .calledWith(expect.any(String))
        .mockResolvedValue(true as never);
      when(global.browser.i18n.getMessage)
        .calledWith('errorText')
        .mockReturnValue('Error!');
      when(global.browser.runtime.getManifest)
        .calledWith()
        .mockReturnValue({ version: '3.99.99' });
      when(global.browser.runtime.getURL)
        .calledWith(expect.anything())
        .mockReturnValue('');
    });
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout');
    });
    afterEach(() => {
      jest.clearAllTimers();
    });
    afterAll(() => {
      global.browser.i18n.getMessage.clearMocks();
      global.browser.runtime.getManifest.clearMocks();
      global.browser.runtime.getURL.clearMocks();
    });

    it('should expect one call to browser.notifications.create', () => {
      throwErrorNotification({ name: 'Test Error', message: 'An ERROR!' }, 1);
      expect(global.browser.notifications.create).toHaveBeenCalled();
      expect(global.browser.notifications.create.mock.calls[0][0]).toEqual(
        expect.stringContaining('CAD-notification-failed-'),
      );
      expect(global.browser.notifications.create.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          message: 'An ERROR!',
          title: 'Error!',
          type: 'basic',
        }),
      );
      expect(setTimeout).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      jest.runAllTimers();
      expect(browser.notifications.clear).toHaveBeenCalledTimes(1);
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

  describe('validateExpressionDomain()', () => {
    when(global.browser.i18n.getMessage)
      .calledWith(expect.any(String))
      .mockReturnValue('message');
    when(global.browser.i18n.getMessage)
      .calledWith(expect.any(String), expect.any(Array))
      .mockReturnValue(`message with substitution array`);
    it('should return invalid message on "" input', () => {
      validateExpressionDomain('');
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'inputErrorEmpty',
      );
    });
    it('should return invalid message on invalid RegExp', () => {
      validateExpressionDomain('/abc(def]/');
      expect(
        global.browser.i18n.getMessage,
      ).toHaveBeenCalledWith('inputErrorRegExp', [expect.any(String)]);
    });
    it('should return invalid message on start slash missing end slash', () => {
      validateExpressionDomain('/abc');
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'inputErrorSlashStartMissingEnd',
      );
    });
    it('should return invalid message on end slash missing start slash', () => {
      validateExpressionDomain('abc/');
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'inputErrorSlashEndMissingStart',
      );
    });
    it('should return invalid message on comma usage outside of RegExp', () => {
      validateExpressionDomain('a,b');
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'inputErrorComma',
      );
    });
    it('should return invalid message on spaces between words.', () => {
      validateExpressionDomain('test expression');
      expect(global.browser.i18n.getMessage).toHaveBeenCalledWith(
        'inputErrorSpace',
      );
    });
    it('should return empty string if valid domain expression', () => {
      const r = validateExpressionDomain('test');
      expect(global.browser.i18n.getMessage).not.toHaveBeenCalled();
      expect(r).toEqual('');
    });
    it('should return empty string if valid RegExp', () => {
      const r = validateExpressionDomain('/[Rr]eg[Ee]xp.com/');
      expect(global.browser.i18n.getMessage).not.toHaveBeenCalled();
      expect(r).toEqual('');
    });
  });
});
