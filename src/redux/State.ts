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

// tslint:disable:object-literal-sort-keys

export const initialState: State = {
  lists: {},
  cookieDeletedCounterTotal: 0,
  cookieDeletedCounterSession: 0,
  settings: {
    activeMode: {
      name: 'activeMode',
      value: false,
    },
    cleanCookiesFromOpenTabsOnStartup: {
      name: 'cleanCookiesFromOpenTabsOnStartup',
      value: false,
    },
    contextMenus: {
      name: 'contextMenus',
      value: false,
    },
    contextualIdentities: {
      name: 'contextualIdentities',
      value: false,
    },
    debugMode: {
      name: 'debugMode',
      value: false,
    },
    delayBeforeClean: {
      name: 'delayBeforeClean',
      value: 15,
    },
    discardedCleanup: {
      name: 'discardedCleanup',
      value: false,
    },
    domainChangeCleanup: {
      name: 'domainChangeCleanup',
      value: false,
    },
    enableGreyListCleanup: {
      name: 'enableGreyListCleanup',
      value: true,
    },
    enableNewVersionPopup: {
      name: 'enableNewVersionPopup',
      value: false,
    },
    greyCleanLocalstorage: {
      name: 'greyCleanLocalstorage',
      value: false,
    },
    keepDefaultIcon: {
      name: 'keepDefaultIcon',
      value: false,
    },
    localstorageCleanup: {
      name: 'localstorageCleanup',
      value: false,
    },
    notificationOnScreen: {
      name: 'notificationOnScreen',
      value: 3,
    },
    showNotificationAfterCleanup: {
      name: 'showNotificationAfterCleanup',
      value: true,
    },
    showNumOfCookiesInIcon: {
      name: 'showNumOfCookiesInIcon',
      value: true,
    },
    sizePopup: {
      name: 'sizePopup',
      value: 16,
    },
    sizeSetting: {
      name: 'sizeSetting',
      value: 16,
    },
    statLogging: {
      name: 'statLogging',
      value: true,
    },
    whiteCleanLocalstorage: {
      name: 'whiteCleanLocalstorage',
      value: false,
    },
  },
  activityLog: [],
  cache: {},
};
