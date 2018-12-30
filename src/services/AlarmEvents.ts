import { cookieCleanup } from '../redux/Actions';
import { getSetting, sleep } from './Libs';
import StoreUser from './StoreUser';

export default class AlarmEvents extends StoreUser {
  public static async createActiveModeAlarm() {
    const seconds = parseInt(
      getSetting(this.store.getState(), 'delayBeforeClean') as string,
      10,
    );
    const milliseconds = seconds * 1000;
    if (this.alarmFlag) {
      return;
    }
    this.alarmFlag = true;
    if (seconds < 1) {
      await sleep(500);
      this.store.dispatch<any>(
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
      this.alarmFlag = false;
    } else {
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
  }
  // Create an alarm delay or use setTimeout before cookie cleanup
  private static alarmFlag = false;
}
