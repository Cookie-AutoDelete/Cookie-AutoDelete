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
import { Component } from 'react';
import { connect } from 'react-redux';
import ErrorBoundary from '../common_components/ErrorBoundary';
import About from './components/About';
import ActivityLog from './components/ActivityLog';
import Expressions from './components/Expressions';
import Settings from './components/Settings';
import SideBar from './components/SideBar';
import Welcome from './components/Welcome';

interface OwnProps {
  sizeSetting: number;
}

class App extends Component<OwnProps> {
  public state = {
    activeTab: 'tabWelcome',
    settingsURL: '',
    tabId: 0,
  };

  // Gets the url hash and switches to that sidebar tab
  public async componentDidMount() {
    document.documentElement.style.fontSize = `${
      (this.props.sizeSetting as number) || 16
    }px`;
    const tab = await browser.tabs.getCurrent();
    const tabURL = new URL(tab.url || '');
    this.setState({
      activeTab:
        tabURL.hash !== '' || undefined
          ? tabURL.hash.substring(1)
          : 'tabWelcome',
      settingsURL: tab.url,
      tabId: tab.id,
    });
  }

  // Switch tabs and appends the hash of the tab name in the url
  public switchTabs(newActiveTab: string) {
    this.setState({
      activeTab: newActiveTab,
    });
    const newUrl = new URL(this.state.settingsURL);
    newUrl.hash = newActiveTab;
    browser.tabs.update(this.state.tabId, {
      url: newUrl.href,
    });
  }

  public render() {
    const { activeTab } = this.state;
    return (
      <div id="layout" className="layout">
        <SideBar
          switchTabs={(tab) => this.switchTabs(tab)}
          activeTab={activeTab}
        />
        <ErrorBoundary>
          <div className="container">
            {activeTab === 'tabWelcome' ? <Welcome /> : ''}
            {activeTab === 'tabSettings' ? <Settings /> : ''}
            {activeTab === 'tabExpressionList' ? <Expressions /> : ''}
            {activeTab === 'tabCleanupLog' ? <ActivityLog /> : ''}
            {activeTab === 'tabAbout' ? <About /> : ''}
          </div>
        </ErrorBoundary>
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  const { settings } = state;
  return {
    sizeSetting: (settings[SettingID.SIZE_SETTING].value as number) || 16,
  };
};

export default connect(mapStateToProps)(App);
