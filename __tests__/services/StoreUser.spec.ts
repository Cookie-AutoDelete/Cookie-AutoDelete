/**
 * Copyright (c) 2020 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { Store } from 'redux';
import { initialState } from '../../src/redux/State';
// tslint:disable-next-line: import-name
import createStore from '../../src/redux/Store';
import StoreUser from '../../src/services/StoreUser';
import { ReduxAction } from '../../src/typings/ReduxConstants';

describe('StoreUser Testing', () => {
  global.chrome = {
    runtime: {
      onConnect: {
        addListener: jest.fn()
      },
      onMessage: {
        addListener: jest.fn()
      }
    }
  };

  let store: Store<State, ReduxAction>;
  describe('StoreUser with no init', () => {
    it('No Store Init Test', () => {
      expect.assertions(2);
      class NoStoreUser extends StoreUser {
        public getStore() {
          return StoreUser.store;
        }
      }
      const r = new NoStoreUser();
      expect(r).toBeInstanceOf(StoreUser);
      expect(r.getStore()).toBe(undefined);
    });
  });

  describe('StoreUser with Store/initialState', () => {
    beforeAll(() => {
      store = createStore(initialState);
      StoreUser.init(store);
    });
    it('StoreUser Initialize Test', () => {
      expect.assertions(2);
      class TestStoreUser extends StoreUser {
        public getStore() {
          return StoreUser.store;
        }
      }
      const r = new TestStoreUser();
      expect(r).toBeInstanceOf(StoreUser);
      expect(r.getStore()).toEqual(store);
    });
  });
});
