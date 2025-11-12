/* istanbul ignore file: React-redux init */

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
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { applyMiddleware, Store } from 'webext-redux';
import { isChrome } from '../../services/Libs';
import ErrorBoundary from '../common_components/ErrorBoundary';
import fontAwesomeImports from '../font-awesome-imports';
import App from './App';
import { configureStore } from '@reduxjs/toolkit';
import type { State } from '../../redux/Store';

import 'bootstrap';
import './scss/popup.scss';

fontAwesomeImports();

let store: Store<State>;

// Just for middleware registration
configureStore({
  reducer: () => {},
  middleware(getDefaultMiddleware) {
    const middleware = getDefaultMiddleware();
    store = applyMiddleware(new Store(), ...middleware);
    return middleware;
  },
});

async function initApp() {
  await store.ready();

  const mountNode = document.createElement('div');
  document.body.appendChild(mountNode);

  if (isChrome(store.getState().cache)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  createRoot(mountNode).render(
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>,
  );
}

initApp();
