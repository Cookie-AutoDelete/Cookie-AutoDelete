import shortid from 'shortid';
import AlarmEvents from './AlarmEvents';
import {
  checkIfProtected,
  showNumberOfCookiesInIcon,
} from './BrowserActionService';
import {
  extractMainDomain,
  getHostname,
  getSetting,
  isAWebpage,
  returnOptionalCookieAPIAttributes,
} from './Libs';
import StoreUser from './StoreUser';

export default class TabEvents extends StoreUser {
  public static onTabUpdate(
    tabId: number,
    changeInfo: any,
    tab: browser.tabs.Tab,
  ) {
    if (tab.status === 'complete') {
      checkIfProtected(TabEvents.store.getState(), tab);
      if (!TabEvents.onTabUpdateDelay) {
        TabEvents.onTabUpdateDelay = true;
        setTimeout(() => {
          TabEvents.getAllCookieActions(tab);
          TabEvents.onTabUpdateDelay = false;
        }, 750);
      }
    }
  }

  public static onDomainChange(
    tabId: number,
    changeInfo: any,
    tab: browser.tabs.Tab,
  ) {
    if (tab.status === 'complete') {
      const mainDomain = extractMainDomain(getHostname(tab.url));
      if (TabEvents.tabToDomain[tabId] === undefined && mainDomain !== '') {
        TabEvents.tabToDomain[tabId] = mainDomain;
      } else if (
        TabEvents.tabToDomain[tabId] !== mainDomain &&
        mainDomain !== ''
      ) {
        TabEvents.tabToDomain[tabId] = mainDomain;
        if (getSetting(StoreUser.store.getState(), 'domainChangeCleanup')) {
          TabEvents.cleanFromFromTabEvents();
        }
      }
    }
  }

  public static onDomainChangeRemove(tabId: number) {
    delete TabEvents.tabToDomain[tabId];
  }

  public static cleanFromFromTabEvents = async () => {
    if (getSetting(StoreUser.store.getState(), 'activeMode')) {
      const alarm = await browser.alarms.get('activeModeAlarm');
      // This is to resolve differences between Firefox and Chrome implementation of browser.alarms.get()
      // in chrome, it returns an array
      if (
        StoreUser.store.getState().cache.browserDetect === 'Firefox' &&
        !alarm
      ) {
        AlarmEvents.createActiveModeAlarm();
      } else if (alarm && alarm.name !== 'activeModeAlarm') {
        AlarmEvents.createActiveModeAlarm();
      }
    }
  };

  public static async getAllCookieActions(tab: browser.tabs.Tab) {
    const hostname = getHostname(tab.url);
    const cookies = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(StoreUser.store.getState(), {
        domain: hostname,
        firstPartyDomain: extractMainDomain(hostname),
        storeId: tab.cookieStoreId,
      }),
    );
    let cookieLength = cookies.length;
    if (
      cookies.length === 0 &&
      getSetting(AlarmEvents.store.getState(), 'localstorageCleanup') &&
      isAWebpage(tab.url)
    ) {
      browser.cookies.set(
        // @ts-ignore
        returnOptionalCookieAPIAttributes(StoreUser.store.getState(), {
          expirationDate: Math.floor(Date.now() / 1000 + 31557600),
          firstPartyDomain: extractMainDomain(getHostname(tab.url)),
          name: 'CookieAutoDelete',
          path: `/${shortid.generate()}`,
          storeId: tab.cookieStoreId,
          url: tab.url,
          value: 'cookieForLocalstorageCleanup',
        }),
      );
      cookieLength = 1;
    }
    if (getSetting(StoreUser.store.getState(), 'showNumOfCookiesInIcon')) {
      showNumberOfCookiesInIcon(tab, cookieLength);
    } else {
      browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: '',
      });
    }
  }
  // Add a delay to prevent multiple spawns of the localstorage cookie
  private static onTabUpdateDelay = false;

  private static tabToDomain: { [key: number]: string } = {};
}
