/**
 * Copyright (c) 2020-2022 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import browser from 'webextension-polyfill';

import { EventListenerAction, SettingID } from '../typings/Enums';
import { cadLog, eventListenerActions, getSetting } from './Libs';
import StoreUser from './StoreUser';
import { addCache } from '../redux/CacheSlice';
import { removeList } from '../redux/ListsSlice';

export default class ContextualIdentitiesEvents extends StoreUser {
  public static init(): void {
    if (
      !browser.contextualIdentities ||
      (!getSetting(
        StoreUser.store.getState(),
        SettingID.CONTEXTUAL_IDENTITIES,
      ) as boolean) ||
      ContextualIdentitiesEvents.isInitialized
    )
      return;
    ContextualIdentitiesEvents.isInitialized = true;
    eventListenerActions(
      browser.contextualIdentities.onCreated,
      ContextualIdentitiesEvents.onContainerCreated,
      EventListenerAction.ADD,
    );
    eventListenerActions(
      browser.contextualIdentities.onRemoved,
      ContextualIdentitiesEvents.onContainerRemoved,
      EventListenerAction.ADD,
    );
    eventListenerActions(
      browser.contextualIdentities.onUpdated,
      ContextualIdentitiesEvents.onContainerUpdated,
      EventListenerAction.ADD,
    );
    cadLog(
      {
        msg: `ContextualIdentitiesEvents.deInit:  Container Events have been added.`,
      },
      getSetting(StoreUser.store.getState(), SettingID.DEBUG_MODE) as boolean,
    );
  }

  /**
   * This removes all related event listeners and attempts to 'un-define' existing containers.
   */
  public static async deInit(): Promise<void> {
    if (!ContextualIdentitiesEvents.isInitialized) return;
    eventListenerActions(
      browser.contextualIdentities.onCreated,
      ContextualIdentitiesEvents.onContainerCreated,
      EventListenerAction.REMOVE,
    );
    eventListenerActions(
      browser.contextualIdentities.onRemoved,
      ContextualIdentitiesEvents.onContainerRemoved,
      EventListenerAction.REMOVE,
    );
    eventListenerActions(
      browser.contextualIdentities.onUpdated,
      ContextualIdentitiesEvents.onContainerUpdated,
      EventListenerAction.REMOVE,
    );
    ContextualIdentitiesEvents.isInitialized = false;
    const existingContainers = await browser.contextualIdentities.query({});
    for (const ci of existingContainers) {
      StoreUser.store.dispatch(
        addCache({
          key: ci.cookieStoreId,
          value: undefined,
        }),
      );
    }
    cadLog(
      {
        msg: `ContextualIdentitiesEvents.deInit:  Container Events have been removed.`,
      },
      getSetting(StoreUser.store.getState(), SettingID.DEBUG_MODE) as boolean,
    );
  }

  /**
   * This will add the new container mapping to the cache.
   * @param changeInfo The ContextualIdentity object that was created.
   */
  public static onContainerCreated(
    changeInfo: browser.ContextualIdentities.OnCreatedChangeInfoType,
  ): void {
    StoreUser.store.dispatch(
      addCache({
        key: changeInfo.contextualIdentity.cookieStoreId,
        value: changeInfo.contextualIdentity.name,
      }),
    );
  }

  /**
   * This should remove the related cookieStoreId/container when removed in Firefox.
   * @param changeInfo The ContextualIdentity Object that was removed.
   */
  public static onContainerRemoved(
    changeInfo: browser.ContextualIdentities.OnRemovedChangeInfoType,
  ): void {
    // Only remove expression list id if setting is enabled.
    if (
      getSetting(
        StoreUser.store.getState(),
        SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
      )
    ) {
      StoreUser.store.dispatch(
        removeList(changeInfo.contextualIdentity.cookieStoreId),
      );
    }

    StoreUser.store.dispatch(
      addCache({
        key: changeInfo.contextualIdentity.cookieStoreId,
        value: undefined,
      }),
    );
  }

  /**
   * This should update the cache if a container was updated in Firefox.
   * @param changeInfo The ContextualIdentity Object that was updated.
   */
  public static onContainerUpdated(
    changeInfo: browser.ContextualIdentities.OnUpdatedChangeInfoType,
  ): void {
    const cache = StoreUser.store.getState().cache;
    if (
      cache[changeInfo.contextualIdentity.cookieStoreId] &&
      cache[changeInfo.contextualIdentity.cookieStoreId] !==
        changeInfo.contextualIdentity.name
    ) {
      StoreUser.store.dispatch(
        addCache({
          key: changeInfo.contextualIdentity.cookieStoreId,
          value: changeInfo.contextualIdentity.name,
        }),
      );
    }
  }

  // Map the cookieStoreId to their actual names and store in cache
  public static async cacheCookieStoreIdNames(): Promise<void> {
    const contextualIdentitiesObjects =
      await browser.contextualIdentities.query({});
    StoreUser.store.dispatch(
      addCache({
        key: 'default',
        value: 'Default',
      }),
    );
    StoreUser.store.dispatch(
      addCache({
        key: 'firefox-default',
        value: 'Default',
      }),
    );
    StoreUser.store.dispatch(
      addCache({
        key: 'firefox-private',
        value: 'Private',
      }),
    );
    contextualIdentitiesObjects.forEach((object) =>
      StoreUser.store.dispatch(
        addCache({
          key: object.cookieStoreId,
          value: object.name,
        }),
      ),
    );
  }

  protected static isInitialized = false;
}
