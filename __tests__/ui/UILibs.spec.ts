/**
 * @jest-environment jsdom
 *
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

import { advanceTo, clear } from 'jest-date-mock';
import {
  appendDynamicTimestamp,
  downloadObjectAsJSON,
} from '../../src/ui/UILibs';

describe('appendDynamicTimestamp', () => {
  afterEach(() => {
    clear();
  });
  it('should return dynamically generated timestamp.', () => {
    expect.assertions(2);
    advanceTo(new Date('2020-05-01 12:34:56'));
    expect(appendDynamicTimestamp()).toEqual('2020-05-01_12.34.56');
    advanceTo(new Date('2345-12-31 23:59:59'));
    expect(appendDynamicTimestamp()).toEqual('2345-12-31_23.59.59');
  });
});

describe('downloadObjectAsJSON', () => {
  afterEach(() => {
    clear();
  });
  it('should use default Export Name if one is not supplied', () => {
    expect.assertions(1);
    advanceTo(new Date('2020-05-08 01:23:45'));
    expect(downloadObjectAsJSON({})).toEqual({
      downloadHref: 'data:text/json;charset=urf-8,%7B%7D',
      downloadName: 'CAD_ExportedData_2020-05-08_01.23.45.json',
      status: true,
    });
  });
  it('should parse the object for downloading.', () => {
    expect.assertions(1);
    advanceTo(new Date('2020-05-08 01:23:45'));
    expect(
      downloadObjectAsJSON(
        { test: 'string', foo: 'bar', export: true, number: 123 },
        'TestExport',
      ),
    ).toEqual({
      downloadHref:
        'data:text/json;charset=urf-8,%7B%0A%20%20%22test%22%3A%20%22string%22%2C%0A%20%20%22foo%22%3A%20%22bar%22%2C%0A%20%20%22export%22%3A%20true%2C%0A%20%20%22number%22%3A%20123%0A%7D',
      downloadName: 'CAD_TestExport_2020-05-08_01.23.45.json',
      status: true,
    });
  });
});
