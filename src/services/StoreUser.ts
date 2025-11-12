/* istanbul ignore file: Redux init. */

/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import type { Store } from '@reduxjs/toolkit';
import type { configureWrapStore, State } from '../redux/Store';
import { sleep } from './Libs';

// StoreUser is a static-only class used to hold a shared Redux store across services.
// To minimize changes and keep the current inheritance/usage pattern, we intentionally disable this rule here.
// Future refactoring should consider using a different pattern, such as dependency injection or a singleton service.

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class StoreUser {
  public static withStoreReady<
    P extends unknown[],
    R,
    F extends (
      store: ReturnType<typeof configureWrapStore>,
    ) => (...args: P) => R,
  >(createStoreFunction: F) {
    let withStore: (...args: P) => R;
    return async (...args: P) => {
      if (!withStore) {
        while (!StoreUser.store) {
          await sleep(250);
        }
        withStore = createStoreFunction(StoreUser.store);
      }

      return withStore(...args);
    };
  }

  public static init(store: Store<State>): void {
    StoreUser.store = store;
  }

  protected static store: ReturnType<typeof configureWrapStore>;
}
