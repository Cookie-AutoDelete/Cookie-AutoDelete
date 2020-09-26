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
  public static createActiveModeAlarm = async (): Promise<void> => {
    const seconds = parseInt(
      getSetting(StoreUser.store.getState(), SettingID.CLEAN_DELAY) as string,
      10,
    );
    const milliseconds = (seconds > 0 ? seconds : 0.5) * 1000;
    if (AlarmEvents.alarmFlag) {
      return;
    }
    AlarmEvents.alarmFlag = true;
    await sleep(milliseconds);
    if (getSetting(StoreUser.store.getState(), SettingID.ACTIVE_MODE)) {
      StoreUser.store.dispatch<any>(
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
    }
    AlarmEvents.alarmFlag = false;
  };
  // Create an alarm delay or use setTimeout before cookie cleanup
  private static alarmFlag = false;
}
