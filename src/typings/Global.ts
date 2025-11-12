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

import { BrowserName, type ListType, type SiteDataType } from './Enums';

export type StoreIdToExpressionList = Readonly<{
  [storeId: string]: ReadonlyArray<Expression>;
}>;

export type MapToSettingObject = Readonly<{ [setting: string]: Setting }>;

export type CacheMap = Readonly<{
  [key: string]: unknown;
  browserDetect?: BrowserName;
}>;

export type Expression = Readonly<{
  expression: string;
  cleanAllCookies?: boolean;
  // Deprecated as of 3.5.0, but kept for backwards-compatibility for pre-3.4.0.
  cleanLocalStorage?: boolean;
  cleanSiteData?: SiteDataType[];
  listType: ListType;
  storeId: string;
  id?: string;
  cookieNames?: string[];
}>;

export type Setting = Readonly<{
  id?: string | number;
  name: string;
  value: boolean | number | string;
}>;

export interface ReleaseNote {
  readonly version: string;
  readonly notes: string[];
}

export type CookieCountMsg = Readonly<{
  popupHostname?: string;
  cookieUpdated?: boolean;
}>;

export type CADLogItem = Readonly<{
  type?: string;
  level?: number;
  msg?: string;
  x?: any;
}>;
