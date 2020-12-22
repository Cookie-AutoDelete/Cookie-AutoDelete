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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
const styles = {
  hamburger: {
    color: 'white',
  },
};

const sideBarTabs = [
  {
    tabId: 'tabWelcome',
    tabText: browser.i18n.getMessage('welcomeText'),
  },
  {
    tabId: 'tabSettings',
    tabText: browser.i18n.getMessage('settingsText'),
  },
  {
    tabId: 'tabExpressionList',
    tabText: browser.i18n.getMessage('expressionListText'),
  },
  {
    tabId: 'tabCleanupLog',
    tabText: browser.i18n.getMessage('cleanupLogText'),
  },
  {
    tabId: 'tabAbout',
    tabText: browser.i18n.getMessage('aboutText'),
  },
];

interface OwnProps {
  activeTab: string;
  switchTabs: (id: string) => void;
}

class SideBar extends React.Component<OwnProps> {
  // Switches tabs
  public toggleClass(element: HTMLElement | null, className: string): void {
    if (!element) return;
    const classes = element.className.split(/\s+/);
    const length = classes.length;

    for (let i = 0; i < length; i += 1) {
      if (classes[i] === className) {
        classes.splice(i, 1);
        break;
      }
    }
    // The className is not found
    if (length === classes.length) {
      classes.push(className);
    }

    element.className = classes.join(' ');
  }

  // Toggles the sidebar
  public toggleAll(): void {
    const active = 'active';
    const layout = document.getElementById('layout');
    const menu = document.getElementById('menu');
    const menuLink = document.getElementById('menuLink');
    this.toggleClass(layout, active);
    this.toggleClass(menu, active);
    this.toggleClass(menuLink, active);
  }
  public render(): React.ReactNode {
    const { activeTab, switchTabs } = this.props;
    return (
      <div>
        <div
          onClick={() => this.toggleAll()}
          id="menuLink"
          className="menu-link"
        >
          <FontAwesomeIcon size={'lg'} style={styles.hamburger} icon="bars" />
          <br />
          <div id="menuLinkText" className="menuLinkText">
            {browser.i18n.getMessage('menuText')}
          </div>
        </div>

        <div id="menu" className="menu">
          <div className="pure-menu nav flex-column">
            <div className="sidebar-version">
              {browser.i18n.getMessage('versionNumberText', ['CAD'])}
              <br />
              <b>{browser.runtime.getManifest().version}</b>
            </div>
            {sideBarTabs.map((element) => (
              <div
                key={element.tabId}
                id={`${element.tabId}`}
                onClick={() => switchTabs(element.tabId)}
                className={`pure-menu-item ${
                  activeTab === element.tabId ? 'pure-menu-selected' : ''
                }`}
              >
                <span>{`${element.tabText}`}</span>
              </div>
            ))}
            <br />
            <a
              className={`pure-menu-item`}
              href="https://liberapay.com/CAD_Developers/"
              target="_blank"
              rel="noreferrer"
            >
              <span>{browser.i18n.getMessage('contributeText')}</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default SideBar;
