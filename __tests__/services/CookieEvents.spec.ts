/**
 * Copyright (c) 2020 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import CookieEvents from '../../src/services/CookieEvents';
import * as Lib from '../../src/services/Libs';
import TabEvents from '../../src/services/TabEvents';

jest.requireActual('../../src/services/Libs');
const spyLib: JestSpyObject = global.generateSpies(Lib);

const defaultCookie: browser.cookies.Cookie = {
  domain: 'domain.com',
  hostOnly: false,
  httpOnly: false,
  name: 'CookieName',
  path: '/',
  sameSite: 'no_restriction',
  secure: false,
  session: true,
  storeId: 'firefox-default',
  value: 'CookieValue',
};

const defaultTab: browser.tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-container-00',
  hidden: false,
  highlighted: false,
  incognito: false,
  id: 1,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  selected: true,
  url: 'https://domain.com',
  windowId: 1,
};

describe('CookieEvents', () => {
  when(global.browser.tabs.query)
    .calledWith({ active: true, windowType: 'normal' })
    .mockResolvedValue([
      defaultTab,
      { ...defaultTab, url: 'https://example.com' },
    ] as never);

  describe('onCookieChanged()', () => {
    const spyTabUpdate = jest.spyOn(TabEvents, 'onTabUpdate');

    it('should do nothing if cookie is not part of any active tabs', async () => {
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: { ...defaultCookie, domain: '1.1.1.1' },
        cause: 'overwrite',
      });
      expect(spyTabUpdate).not.toHaveBeenCalled();
    });

    it('should force update that active tab if the domain matches', async () => {
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyTabUpdate).toHaveBeenCalledTimes(1);
      expect(spyTabUpdate.mock.calls[0][1].cookieChanged).toHaveProperty(
        'cookie.value',
        '***',
      );
    });

    it('should not force tab update if tab url is undefined', async () => {
      when(global.browser.tabs.query)
        .calledWith({ active: true, windowType: 'normal' })
        .mockResolvedValue([{ ...defaultTab, url: undefined }] as never);
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyLib.getHostname).not.toHaveBeenCalled();
    });

    it('should not force tab update if tab id is undefined', async () => {
      when(global.browser.tabs.query)
        .calledWith({ active: true, windowType: 'normal' })
        .mockResolvedValue([{ ...defaultTab, id: undefined }] as never);
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyLib.getHostname).not.toHaveBeenCalled();
    });
  });
});
