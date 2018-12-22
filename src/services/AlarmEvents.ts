import { cookieCleanup } from '../redux/Actions';
import { getSetting } from './Libs';
import StoreUser from './StoreUser';

export default class AlarmEvents extends StoreUser {
  public static activeModeAlarm(alarmInfo: browser.alarms.Alarm) {
    // console.log(alarmInfo.name);
    if (alarmInfo.name === 'activeModeAlarm') {
      this.store.dispatch(
        // @ts-ignore
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
      this.alarmFlag = false;
      browser.alarms.clear(alarmInfo.name);
    }
  }

  public static createActiveModeAlarm() {
    const seconds = parseInt(
      getSetting(this.store.getState(), 'delayBeforeClean') as string,
      10,
    );
    const minutes = seconds / 60;
    const milliseconds = seconds * 1000;
    if (this.alarmFlag) {
      return;
    }
    this.alarmFlag = true;
    if (seconds < 1) {
      setTimeout(() => {
        this.store.dispatch(
          // @ts-ignore
          cookieCleanup({
            greyCleanup: false,
            ignoreOpenTabs: false,
          }),
        );
        this.alarmFlag = false;
      }, 500);
    } else if (
      browserDetect() === 'Firefox' ||
      (browserDetect() === 'Chrome' && seconds >= 60)
    ) {
      browser.alarms.create('activeModeAlarm', {
        delayInMinutes: minutes,
      });
    } else {
      setTimeout(() => {
        if (getSetting(this.store.getState(), 'activeMode')) {
          this.store.dispatch(
            // @ts-ignore
            cookieCleanup({
              greyCleanup: false,
              ignoreOpenTabs: false,
            }),
          );
        }
        this.alarmFlag = false;
      }, milliseconds);
    }
  }
  // Create an alarm delay or use setTimeout before cookie cleanup
  private static alarmFlag = false;
}
