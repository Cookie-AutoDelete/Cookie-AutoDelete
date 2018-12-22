/**
 * Copyright (c) 2017 Kenny Do
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Store } from 'redux';
import {
  cacheCookieStoreIdNames,
  cookieCleanup,
  validateSettings,
} from './redux/Actions';
// tslint:disable-next-line:import-name
import createStore from './redux/Store';
import AlarmEvents from './services/AlarmEvents';
import { getSetting } from './services/Libs';
import StoreUser from './services/StoreUser';
import TabEvents from './services/TabEvents';
import { ReduxAction, ReduxConstants } from './typings/ReduxConstants';

let store: Store<State, ReduxAction>;
let currentSettings: { [setting: string]: Setting };

// Delay saving to disk to queue up actions
let delaySave = false;
const saveToStorage = () => {
  if (!delaySave) {
    delaySave = true;
    setTimeout(() => {
      delaySave = false;
      return browser.storage.local.set({
        state: JSON.stringify(store.getState()),
      });
    }, 1000);
  }
};

const onSettingsChange = () => {
  const previousSettings = currentSettings;
  currentSettings = store.getState().settings;
  // Container Mode enabled
  if (
    !previousSettings.contextualIdentities.value &&
    currentSettings.contextualIdentities.value
  ) {
    // @ts-ignore
    store.dispatch(cacheCookieStoreIdNames());
  }

  // Localstorage support enabled
  if (
    !previousSettings.localstorageCleanup.value &&
    currentSettings.localstorageCleanup.value
  ) {
    browser.browsingData.removeLocalStorage({
      since: 0,
    });
  }

  if (previousSettings.activeMode.value && !currentSettings.activeMode.value) {
    browser.alarms.clear('activeModeAlarm');
  }
};

const onStartUp = async () => {
  const storage = await browser.storage.local.get();
  let stateFromStorage;
  try {
    if (storage.state) {
      stateFromStorage = JSON.parse(storage.state as string);
    } else {
      stateFromStorage = {};
    }
  } catch (err) {
    stateFromStorage = {};
  }
  store = createStore(stateFromStorage);
  // @ts-ignore
  store.dispatch(validateSettings());
  store.dispatch({
    type: ReduxConstants.ON_STARTUP,
  });
  // Store the FF version in cache
  if (browserDetect() === 'Firefox') {
    const browserInfo = await browser.runtime.getBrowserInfo();
    const browserVersion = browserInfo.version.split('.')[0];
    store.dispatch({
      payload: {
        key: 'browserVersion',
        value: browserVersion,
      },
      type: ReduxConstants.ADD_CACHE,
    });
    // Store whether firstPartyIsolate is true or false
    if (browserVersion >= '58') {
      // @ts-ignore
      const setting = await browser.privacy.websites.firstPartyIsolate.get({});
      store.dispatch({
        payload: {
          key: 'firstPartyIsolateSetting',
          value: setting.value,
        },
        type: ReduxConstants.ADD_CACHE,
      });
    }
  }
  // Store which browser environment in cache
  store.dispatch({
    payload: {
      key: 'browserDetect',
      value: browserDetect(),
    },
    type: ReduxConstants.ADD_CACHE,
  });

  // Temporary fix until contextualIdentities events land
  if (getSetting(store.getState(), 'contextualIdentities')) {
    // @ts-ignore
    store.dispatch(cacheCookieStoreIdNames());
  }
  if (getSetting(store.getState(), 'activeMode')) {
    store.dispatch(
      // @ts-ignore
      cookieCleanup({
        greyCleanup: true,
        ignoreOpenTabs: getSetting(
          store.getState(),
          'cleanCookiesFromOpenTabsOnStartup',
        ),
      }),
    );
  }
  currentSettings = store.getState().settings;
  store.subscribe(onSettingsChange);
  store.subscribe(saveToStorage);

  // This is important to initialize the Store for all classes that extend from this
  StoreUser.init(store);

  browser.tabs.onUpdated.addListener(TabEvents.onDomainChange);
  browser.tabs.onUpdated.addListener(TabEvents.onTabUpdate);
  browser.tabs.onRemoved.addListener(TabEvents.onDomainChangeRemove);
  browser.tabs.onRemoved.addListener(TabEvents.cleanFromFromTabEvents);

  // Alarm event handler for Active Mode
  browser.alarms.onAlarm.addListener(AlarmEvents.activeModeAlarm);
};

onStartUp();
