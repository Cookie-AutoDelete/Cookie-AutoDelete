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
      id: 1,
    },
    delayBeforeClean: {
      name: 'delayBeforeClean',
      value: 15,
      id: 2,
    },
    statLogging: {
      name: 'statLogging',
      value: true,
      id: 3,
    },
    showNumOfCookiesInIcon: {
      name: 'showNumOfCookiesInIcon',
      value: true,
      id: 4,
    },
    showNotificationAfterCleanup: {
      name: 'showNotificationAfterCleanup',
      value: true,
      id: 5,
    },
    cleanCookiesFromOpenTabsOnStartup: {
      name: 'cleanCookiesFromOpenTabsOnStartup',
      value: false,
      id: 6,
    },
    contextualIdentities: {
      name: 'contextualIdentities',
      value: false,
      id: 7,
    },
    localstorageCleanup: {
      name: 'localstorageCleanup',
      value: false,
      id: 8,
    },
    notificationOnScreen: {
      name: 'notificationOnScreen',
      value: 3,
      id: 9,
    },
    domainChangeCleanup: {
      name: 'domainChangeCleanup',
      value: false,
      id: 10,
    },
  },
  activityLog: [],
  cache: {},
};
