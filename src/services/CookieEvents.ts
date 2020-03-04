import { extractMainDomain, getHostname } from './Libs';
import StoreUser from './StoreUser';
import TabEvents from './TabEvents';

export default class CookieEvents extends StoreUser {

  public static async onCookieChanged(
    changeInfo: {
      removed: boolean,
      cookie:  browser.cookies.Cookie,
      cause: browser.cookies.OnChangedCause,
    }
  ) {
    // Get the current active tab of current window
    const tabQuery = await browser.tabs.query({active: true, currentWindow: true,});
    const tab = tabQuery[0];
    if (extractMainDomain(getHostname(tab.url || '')) === extractMainDomain(changeInfo.cookie.domain)) {
      // Force Tab Update function
      TabEvents.onTabUpdate(tab.id || 0, {cookieChanged: changeInfo}, tab);
    }
  }
}
