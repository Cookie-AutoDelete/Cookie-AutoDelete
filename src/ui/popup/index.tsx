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
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createUIStore } from 'redux-webext';
import { sleep } from '../../services/Libs';
import ErrorBoundary from '../common_components/ErrorBoundary';
import fontAwesomeImports from '../font-awesome-imports';
import App from './App';

fontAwesomeImports();

async function initApp() {
  let store = await createUIStore();
  while (!store.getState()) {
    await sleep(250);
    store = await createUIStore();
  }
  const mountNode = document.createElement('div');
  document.body.appendChild(mountNode);

  if (browserDetect() === 'Chrome') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  ReactDOM.render(
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>,
    mountNode,
  );
}

initApp();
