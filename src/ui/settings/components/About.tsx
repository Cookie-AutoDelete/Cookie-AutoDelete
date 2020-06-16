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
import * as React from 'react';
interface OwnProps {
  style?: React.CSSProperties;
}
const About: React.FunctionComponent<OwnProps> = (props) => {
  const { style } = props;
  return (
    <div style={style}>
      <h1>{browser.i18n.getMessage('aboutText')}</h1>
      <h5>
        {browser.i18n.getMessage('versionNumberText', ['CAD'])}:
        <br />
        <b>{browser.runtime.getManifest().version}</b>
      </h5>
      <a href="https://github.com/mrdokenny/Cookie-AutoDelete/issues">
        {browser.i18n.getMessage('reportIssuesText')}
      </a>{' '}
      <br />
      <br />
      <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation">
        <span>{`${browser.i18n.getMessage('documentationText')}`}</span>
      </a>
      <br />
      <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/FAQ:-Common-Questions-and-Issues">
        <span>{`${browser.i18n.getMessage('faqText')}`}</span>
      </a>
      <br />
      <br />{' '}
      <a
        href="https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh"
        target="_blank"
        rel="noreferrer"
      >
        <span>{`${browser.i18n.getMessage('versionText', [
          'Google Chrome',
        ])}`}</span>{' '}
      </a>
      <br />
      <a
        href="https://microsoftedge.microsoft.com/addons/detail/djkjpnciiommncecmdefpdllknjdmmmo"
        target="_blank"
        rel="noreferrer"
      >
        <span>{`${browser.i18n.getMessage('versionText', [
          'Microsoft Edge Chromium',
        ])}`}</span>{' '}
      </a>{' '}
      <br />
      <a
        href="https://addons.mozilla.org/firefox/addon/cookie-autodelete/"
        target="_blank"
        rel="noreferrer"
      >
        <span>{`${browser.i18n.getMessage('versionText', [
          'Mozilla Firefox',
        ])}`}</span>{' '}
      </a>{' '}
      <br />
      <br />
      <span>{`${browser.i18n.getMessage('contributorsText')}`}:</span>
      <ul>
        <li>Kenny Do (Creator)</li>
        <li>
          seansfkelley (UI Redesign of Expression Table Settings and Popup)
        </li>
        <li>kennethtran93 (UI bug fixes and then some)</li>
        <li>
          <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors">
            GitHub Contributors
          </a>
        </li>
        <li>
          <a href="https://crowdin.com/project/cookie-autodelete">
            Crowdin Contributors
          </a>
        </li>
      </ul>
    </div>
  );
};

export default About;
