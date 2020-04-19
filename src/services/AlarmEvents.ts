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

import { cookieCleanup } from '../redux/Actions';
import { getSetting, sleep } from './Libs';
import StoreUser from './StoreUser';

export default class AlarmEvents extends StoreUser {
  public static async createActiveModeAlarm() {
    const seconds = parseInt(
      getSetting(this.store.getState(), 'delayBeforeClean') as string,
      10,
    );
    const milliseconds = (seconds > 0 ? seconds : 0.5) * 1000;
    if (this.alarmFlag) {
      return;
    }
    this.alarmFlag = true;
    await sleep(milliseconds);
    if (getSetting(this.store.getState(), 'activeMode')) {
      this.store.dispatch<any>(
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
    }
    this.alarmFlag = false;
  }
  // Create an alarm delay or use setTimeout before cookie cleanup
  private static alarmFlag = false;
}
