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
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import {
  addExpressionUI,
  cookieCleanupUI,
  updateSetting,
} from '../../redux/Actions';
import {
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
  clearSiteDataForThisDomain,
} from '../../services/CleanupService';
import {
  CADCOOKIENAME,
  extractMainDomain,
  getAllCookiesForDomain,
  getHostname,
  getSetting,
  isAnIP,
  isChrome,
  isFirefoxNotAndroid,
  localFileToRegex,
  parseCookieStoreId,
} from '../../services/Libs';
import { FilterOptions } from '../../typings/Enums';
import { ReduxAction } from '../../typings/ReduxConstants';
import ActivityTable from '../common_components/ActivityTable';
import IconButton from '../common_components/IconButton';
import FilteredExpression from './components/FilteredExpression';

interface DispatchProps {
  onUpdateSetting: (newSetting: Setting) => void;
  onNewExpression: (payload: Expression) => void;
  onCookieCleanup: (payload: CleanupProperties) => void;
}

interface StateProps {
  contextualIdentities: boolean;
  state: State;
}

class InitialState {
  public cookieCount = 0;
  public tab: browser.tabs.Tab | undefined = undefined;
  public storeId = 'default';
}

type PopupAppComponentProps = DispatchProps & StateProps;

class App extends React.Component<PopupAppComponentProps, InitialState> {
  public state = new InitialState();
  public port: browser.runtime.Port | null = null;
  private cleanButtonContainerRef: React.ReactInstance | null = null;

  public async componentDidMount() {
    document.documentElement.style.fontSize = `${
      (this.props.state.settings.sizePopup.value as number) || 16
    }px`;
    if (isChrome(this.props.state.cache)) {
      // Chrome requires min width otherwise the layout is messed up
      document.documentElement.style.minWidth = `${
        430 +
        (((this.props.state.settings.sizePopup.value as number) || 16) - 10) *
          35
      }px`;
    }
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    this.setState({
      storeId: parseCookieStoreId(
        this.props.contextualIdentities,
        tabs[0].cookieStoreId,
      ),
      tab: tabs[0],
    });
  }

  public componentWillUnmount() {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

  public animateFlash(ref: React.ReactInstance | null, success: boolean) {
    if (ref) {
      try {
        // eslint-disable-next-line react/no-find-dom-node
        const domNode = findDOMNode(ref) as Element;
        if (domNode) {
          domNode.classList.add(
            success ? 'successAnimated' : 'failureAnimated',
          );
          setTimeout(() => {
            domNode.classList.remove(
              success ? 'successAnimated' : 'failureAnimated',
            );
          }, 1500);
        }
      } catch (e) {
        // Ignore, we just won't animate anything.
      }
    }
  }

  public createSiteDataButton(
    siteData: SiteDataType | 'All',
    hostname: string,
  ): Partial<HTMLButtonElement> {
    return (
      <button
        className="dropdown-item"
        onClick={async () => {
          const success = await this.cleanSiteDataUI(siteData, hostname);
          this.animateFlash(this.cleanButtonContainerRef, success);
        }}
        title={browser.i18n.getMessage(`manualCleanSiteData${siteData}Domain`, [
          hostname,
        ])}
        type="button"
      >
        {browser.i18n.getMessage(`manualCleanSiteData${siteData}`)}
      </button>
    );
  }

  public async cleanSiteDataUI(
    siteData: SiteDataType | 'All',
    hostname: string,
  ): Promise<boolean> {
    const { state } = this.props;
    if (!hostname) return false;
    let result = await clearSiteDataForThisDomain(state, siteData, hostname);
    if (siteData === 'All') {
      const { tab } = this.state;
      if (!tab) return false;
      const success = await clearCookiesForThisDomain(state, tab);
      result = result || success;
    }
    return result;
  }

  public async setPopupCookieCount() {
    const { state } = this.props;
    const { tab } = this.state;
    if (!tab || !tab.url) return;
    const cookies = await getAllCookiesForDomain(state, tab);

    this.setState({
      cookieCount: cookies
        ? cookies.length -
          cookies.filter((cookie) => cookie.name === CADCOOKIENAME).length
        : 0,
    });
  }

  public render() {
    const { tab, storeId } = this.state;
    if (!tab) {
      return 'Loading';
    }
    const {
      onNewExpression,
      onCookieCleanup,
      onUpdateSetting,
      contextualIdentities,
      state,
    } = this.props;
    const { cache, settings } = state;
    const hostname = getHostname(tab.url);
    const mainDomain = extractMainDomain(hostname);
    const addableHostnames = [
      hostname === mainDomain ? undefined : `*.${mainDomain}`,
      hostname,
    ].filter(Boolean) as string[];
    if (hostname !== '' && !isAnIP(tab.url) && !hostname.startsWith('file:')) {
      addableHostnames.push(`*.${hostname}`);
    }

    if (!this.port) {
      if (hostname) {
        this.port = browser.runtime.connect({
          name: `popupCAD_${hostname},${storeId.replace(',', '-')}`,
        });
        this.port.onMessage.addListener((m) => {
          const msg = m as CookieCountMsg;
          if (msg.cookieUpdated !== undefined && msg.cookieUpdated) {
            this.setPopupCookieCount();
          }
        });
        this.port.onDisconnect.addListener((p) => {
          if (p.error) {
            // eslint-disable-next-line no-console
            console.error(
              `Disconnected due to an error: ${browser.runtime.lastError}`,
            );
          }
          this.port = null;
        });
      }
    }

    return (
      <div
        id="cadPopup"
        className="container-fluid"
        style={{
          overflow: 'auto',
        }}
      >
        <div
          className="row"
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            justifyContent: 'center',
            paddingTop: '8px',
          }}
        >
          <span id="CADTitle">{browser.i18n.getMessage('extensionName')}</span>
          &nbsp;
          <span id="CADVersion" style={{ fontWeight: 'bold' }}>
            {browser.runtime.getManifest().version}
          </span>
        </div>
        <div
          className="row"
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            justifyContent: 'center',
            padding: '4px 4px 8px 4px',
          }}
        >
          <IconButton
            iconName="power-off"
            className={settings.activeMode.value ? 'btn-success' : 'btn-danger'}
            onClick={() =>
              onUpdateSetting({
                ...settings.activeMode,
                value: !settings.activeMode.value,
              })
            }
            title={
              settings.activeMode.value
                ? browser.i18n.getMessage('disableAutoDeleteText')
                : browser.i18n.getMessage('enableAutoDeleteText')
            }
            text={
              settings.activeMode.value
                ? browser.i18n.getMessage('autoDeleteEnabledText')
                : browser.i18n.getMessage('autoDeleteDisabledText')
            }
          />

          <IconButton
            iconName={
              settings.showNotificationAfterCleanup.value
                ? 'bell'
                : 'bell-slash'
            }
            className={
              settings.showNotificationAfterCleanup.value
                ? 'btn-success'
                : 'btn-danger'
            }
            onClick={() =>
              onUpdateSetting({
                ...settings.showNotificationAfterCleanup,
                value: !settings.showNotificationAfterCleanup.value,
              })
            }
            title={browser.i18n.getMessage('toggleNotificationText')}
            text={
              settings.showNotificationAfterCleanup.value
                ? browser.i18n.getMessage('notificationEnabledText')
                : browser.i18n.getMessage('notificationDisabledText')
            }
          />

          <div
            className="btn-group"
            ref={(e) => {
              this.cleanButtonContainerRef = e;
            }}
            style={{
              margin: '0 4px',
            }}
          >
            <IconButton
              iconName="eraser"
              className="btn-warning"
              onClick={() => {
                onCookieCleanup({
                  greyCleanup: false,
                  ignoreOpenTabs: false,
                });
                this.animateFlash(this.cleanButtonContainerRef, true);
              }}
              title={browser.i18n.getMessage('cookieCleanupText')}
              text={browser.i18n.getMessage('cleanText')}
            />

            <button
              aria-haspopup="true"
              aria-expanded="false"
              className="btn btn-warning dropdown-toggle dropdown-toggle-split"
              data-toggle="dropdown"
              data-disabled="true"
              role="menu"
              style={{
                borderLeftColor: 'rgb(176, 132, 0)',
                transform: 'translate3d(-3px, 0px, 0px)',
              }}
            >
              <span className="sr-only">
                {browser.i18n.getMessage('dropdownAdditionalCleaningOptions')}
              </span>
            </button>
            <div className="dropdown-menu dropdown-menu-right">
              <button
                className="dropdown-item"
                onClick={() => {
                  onCookieCleanup({
                    greyCleanup: false,
                    ignoreOpenTabs: true,
                  });
                  this.animateFlash(this.cleanButtonContainerRef, true);
                }}
                title={browser.i18n.getMessage(
                  'cookieCleanupIgnoreOpenTabsText',
                )}
                type="button"
              >
                {browser.i18n.getMessage('cleanIgnoringOpenTabsText')}
              </button>
              <h6 className="dropdown-header">
                {browser.i18n.getMessage('cleanupActionsBypass')}
              </h6>
              {this.createSiteDataButton('All', hostname)}
              {this.createSiteDataButton(SiteDataType.CACHE, hostname)}
              <button
                className="dropdown-item"
                onClick={async () => {
                  const success = await clearCookiesForThisDomain(state, tab);
                  this.animateFlash(this.cleanButtonContainerRef, success);
                }}
                title={browser.i18n.getMessage(
                  'manualCleanSiteDataCookiesDomain',
                  [hostname],
                )}
                type="button"
              >
                {browser.i18n.getMessage('manualCleanSiteDataCookies')}
              </button>
              {this.createSiteDataButton(SiteDataType.INDEXEDDB, hostname)}
              <button
                className="dropdown-item"
                onClick={async () => {
                  const success = await clearLocalStorageForThisDomain(
                    state,
                    tab,
                  );
                  this.animateFlash(this.cleanButtonContainerRef, success);
                }}
                title={browser.i18n.getMessage(
                  `manualCleanSiteData${SiteDataType.LOCALSTORAGE}Domain`,
                  [hostname],
                )}
                type="button"
              >
                {browser.i18n.getMessage(
                  `manualCleanSiteData${SiteDataType.LOCALSTORAGE}`,
                )}
              </button>
              {this.createSiteDataButton(SiteDataType.PLUGINDATA, hostname)}
              {this.createSiteDataButton(SiteDataType.SERVICEWORKERS, hostname)}
            </div>
          </div>
          <IconButton
            iconName="cog"
            className="btn-info"
            onClick={() => {
              if (isFirefoxNotAndroid(cache)) {
                browser.tabs.create({
                  cookieStoreId: tab.cookieStoreId,
                  index: tab.index + 1,
                  url: '/settings/settings.html#tabSettings',
                });
              } else {
                browser.tabs.create({
                  index: tab.index + 1,
                  url: '/settings/settings.html#tabSettings',
                });
              }
              window.close();
            }}
            title={browser.i18n.getMessage('preferencesText')}
            text={browser.i18n.getMessage('preferencesText')}
          />
        </div>

        <div
          className="row no-gutters"
          style={{
            alignItems: 'center',
            margin: '8px 0',
          }}
        >
          {tab.favIconUrl && !tab.favIconUrl.startsWith('chrome:') && (
            <img
              alt={'favIcon'}
              src={tab.favIconUrl}
              style={{
                height: '20px',
                marginRight: '7px',
                verticalAlign: 'middle',
                width: '20px',
              }}
            />
          )}
          <div className="col">
            <span
              style={{
                fontSize: '1.25em',
                marginRight: '8px',
                verticalAlign: 'middle',
              }}
            >
              {
                // Temporary fix until contextualIdentities events land
              }
              {!contextualIdentities
                ? `${hostname}`
                : `${hostname} ${
                    cache[storeId] !== undefined ? `(${cache[storeId]})` : ''
                  }`}
            </span>
          </div>
          <div
            className="col-3"
            style={{
              fontSize: '1.1em',
              textAlign: 'center',
            }}
          >
            <span id="CADCookieText">
              {browser.i18n.getMessage('popupCookieCountText')}
            </span>
            :&nbsp;
            <span
              id="CADCookieCount"
              style={{
                fontWeight: 'bold',
              }}
            >
              {this.state.cookieCount}
            </span>
          </div>
        </div>

        {addableHostnames.map((addableHostname) => (
          <div
            key={addableHostname}
            style={{
              alignItems: 'center',
              display: 'flex',
              margin: '8px 0',
            }}
            className="row"
          >
            <div
              style={{
                flex: 1,
              }}
            >
              {addableHostname}
            </div>
            <div
              className="btn-group"
              style={{
                marginLeft: '8px',
              }}
            >
              <IconButton
                className="btn-secondary"
                onClick={() => {
                  onNewExpression({
                    expression: localFileToRegex(addableHostname),
                    listType: ListType.GREY,
                    storeId,
                  });
                }}
                iconName="plus"
                title={browser.i18n.getMessage('toGreyListText')}
                text={browser.i18n.getMessage('greyListWordText')}
              />

              <IconButton
                className="btn-primary"
                onClick={() => {
                  onNewExpression({
                    expression: localFileToRegex(addableHostname),
                    listType: ListType.WHITE,
                    storeId,
                  });
                }}
                iconName="plus"
                title={browser.i18n.getMessage('toWhiteListText')}
                text={browser.i18n.getMessage('whiteListWordText')}
              />
            </div>
          </div>
        ))}

        <div
          className="row"
          style={{
            margin: '8px 0',
          }}
        >
          <FilteredExpression url={hostname} storeId={storeId} />
        </div>
        <ActivityTable numberToShow={3} decisionFilter={FilterOptions.CLEAN} />
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  return {
    contextualIdentities: getSetting(
      state,
      `${SettingID.CONTEXTUAL_IDENTITIES}`,
    ) as boolean,
    state,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onUpdateSetting(newSetting: Setting) {
    dispatch(updateSetting(newSetting));
  },
  onNewExpression(payload: Expression) {
    dispatch(addExpressionUI(payload));
  },
  onCookieCleanup(payload: CleanupProperties) {
    dispatch(cookieCleanupUI(payload));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
