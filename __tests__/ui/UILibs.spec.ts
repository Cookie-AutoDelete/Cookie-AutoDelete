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
import { exportAppendTimestamp } from '../../src/ui/UILibs';

describe('exportAppendTimestamp() Testing', () => {
  afterEach(() => {
    clear();
  })
  it('should return formatted filename into the HTML Download attribute.', () => {
    expect.assertions(2);
    const a = document.createElement('a');
    expect(a.download).toEqual('');
    advanceTo(new Date("2020-05-01 12:34:56"));
    exportAppendTimestamp(a);
    expect(a.download).toEqual('CAD_Expressions_2020-05-01_12.34.56.json');
  });
});
