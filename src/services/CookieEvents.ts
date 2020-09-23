/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { extractMainDomain, getHostname } from './Libs';
import StoreUser from './StoreUser';
import TabEvents from './TabEvents';

export default class CookieEvents extends StoreUser {
  public static async onCookieChanged(changeInfo: {
    removed: boolean;
    cookie: browser.cookies.Cookie;
    cause: browser.cookies.OnChangedCause;
  }): Promise<void> {
    // Truncate cookie value (purely for debug)
    changeInfo.cookie.value = '***';
    // Get the current active tab(s)
    const tabQuery = await browser.tabs.query({
      active: true,
      windowType: 'normal',
    });
    tabQuery.forEach((tab) => {
      // Tabs.id with tabs.TAB_ID_NONE do not host content tabs
      // Tabs.url is always present as we already have the 'tabs' permission.
      if (!tab.id || !tab.url) return;
      if (
        extractMainDomain(getHostname(tab.url)) ===
        extractMainDomain(changeInfo.cookie.domain)
      ) {
        // Force Tab Update function
        TabEvents.onTabUpdate(tab.id, { cookieChanged: changeInfo }, tab);
      }
    });
  }
}
