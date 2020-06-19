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

declare module '*.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare const global: any;
declare const browserDetect: () => string;

type StoreIdToExpressionList = Readonly<{
  [storeId: string]: ReadonlyArray<Expression>;
}>;

type MapToSettingObject = Readonly<{ [setting: string]: Setting }>;

type CacheMap = Readonly<
  { [browserDetect: string]: string } & { [key: string]: any }
>;

type GetState = () => State;

type State = Readonly<{
  lists: StoreIdToExpressionList;
  cookieDeletedCounterTotal: number;
  cookieDeletedCounterSession: number;
  settings: MapToSettingObject;
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
}>;

type Expression = Readonly<{
  expression: string;
  cleanLocalStorage?: boolean;
  cleanAllCookies?: boolean;
  listType: ListType;
  storeId: string;
  id?: string;
  cookieNames?: string[];
}>;

type Setting = Readonly<{
  id?: string | number;
  name: string;
  value: boolean | number | string;
}>;

declare const enum ListType {
  WHITE = 'WHITE',
  GREY = 'GREY',
}

interface ReleaseNote {
  readonly version: string;
  readonly notes: string[];
}

type CookieCountMsg = Readonly<{
  popupHostname?: string;
  cookieUpdated?: boolean;
}>;

type CADLogItem = Readonly<{
  type?: string;
  level?: number;
  msg?: string;
  x?: any;
}>;
