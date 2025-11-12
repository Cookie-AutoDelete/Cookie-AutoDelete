/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import type { Cookies } from 'webextension-polyfill';
import type { Expression } from './Global';
import type {
  OpenTabStatus,
  ReasonClean,
  ReasonKeep,
  SiteDataType,
} from './Enums';

export interface CleanupProperties {
  greyCleanup: boolean;
  ignoreOpenTabs: boolean;
}

export type ActivityLog = {
  dateTime: string;
  recentlyCleaned: number;
  storeIds: {
    [storeId: string]: CleanReasonObject[];
  };
  browsingDataCleanup?: {
    [siteDataType in SiteDataType]?: string[];
  };
  siteDataCleaned: boolean;
};

export interface CleanupPropertiesInternal extends CleanupProperties {
  openTabDomains: { [k: string]: string[] };
}

export interface CleanReasonObject {
  cached: boolean;
  cleanCookie: boolean;
  reason: ReasonKeep | ReasonClean;
  openTabStatus: OpenTabStatus;
  expression?: Expression;
  cookie: CookiePropertiesCleanup;
}

export interface CookiePropertiesCleanup extends Cookies.Cookie {
  mainDomain: string;
  hostname: string;
  preparedCookieDomain: string;
}
