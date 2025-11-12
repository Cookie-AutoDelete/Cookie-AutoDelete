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
import { Component } from 'react';
import { connect } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  CADCOOKIENAME,
  extractMainDomain,
  getAllCookiesForDomain,
  getHostname,
  getSetting,
  isAnIP,
  isChrome,
  localFileToRegex,
  parseCookieStoreId,
} from '../../services/Libs';
import { FilterOptions, ListType, SettingID } from '../../typings/Enums';
import ActivityTable from '../common_components/ActivityTable';
import IconButton from '../common_components/IconButton';
import CleanCollapseGroup from './components/CleanCollapseGroup';
import FilteredExpression from './components/FilteredExpression';
import { animateFlash } from './popupLib';
import type { CleanupProperties } from '../../typings/Cleanup';
import type { Setting, Expression, CookieCountMsg } from '../../typings/Global';
import type { Dispatch, State } from '../../redux/Store';
import { updateSetting } from '../../redux/SettingsSlice';
import { addExpressionUI, cookieCleanupUI } from '../../redux/UIActions';

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
  public tab: browser.Tabs.Tab | undefined = undefined;
  public storeId = 'default';
}

type PopupAppComponentProps = DispatchProps & StateProps;

class App extends Component<PopupAppComponentProps, InitialState> {
  public state = new InitialState();
  public port: browser.Runtime.Port | null = null;

  public async componentDidMount() {
    document.documentElement.style.fontSize = `${
      (this.props.state.settings[SettingID.SIZE_POPUP].value as number) || 16
    }px`;
    if (isChrome(this.props.state.cache)) {
      // Chrome requires min width otherwise the layout is messed up
      document.documentElement.style.minWidth = `${
        430 +
        (((this.props.state.settings[SettingID.SIZE_POPUP].value as number) ||
          16) -
          10) *
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
        className="container-fluid overflow-auto"
        onClick={(e) => {
          const _t = e.target as HTMLElement;
          const _ccg = document.getElementById('cleanCollapse');
          if (!_ccg || !_ccg.classList.contains('show')) return;
          const _dt = _t.attributes.getNamedItem('data-target');
          if (!_dt || _dt.value !== '#cleanCollapse') {
            _ccg.classList.remove('show');
          }
        }}
      >
        <div
          className="row pt-2 text-center col"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="col">
            <span id="CADTitle">
              {browser.i18n.getMessage('extensionName')}
            </span>{' '}
            <span id="CADVersion" style={{ fontWeight: 'bold' }}>
              {browser.runtime.getManifest().version}
            </span>
          </div>
        </div>
        <div
          className="row pb-2"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="col d-flex flex-row justify-content-center">
            <IconButton
              iconName="power-off"
              className={`btn-${
                settings[SettingID.ACTIVE_MODE].value ? 'success' : 'danger'
              } m-1`}
              onClick={() =>
                onUpdateSetting({
                  ...settings[SettingID.ACTIVE_MODE],
                  value: !settings[SettingID.ACTIVE_MODE].value,
                })
              }
              title={
                settings[SettingID.ACTIVE_MODE].value
                  ? browser.i18n.getMessage('disableAutoDeleteText')
                  : browser.i18n.getMessage('enableAutoDeleteText')
              }
              text={
                settings[SettingID.ACTIVE_MODE].value
                  ? browser.i18n.getMessage('autoDeleteEnabledText')
                  : browser.i18n.getMessage('autoDeleteDisabledText')
              }
            />
            <IconButton
              iconName={
                settings[SettingID.NOTIFY_AUTO].value ? 'bell' : 'bell-slash'
              }
              className={`btn-${
                settings[SettingID.NOTIFY_AUTO].value ? 'success' : 'danger'
              } m-1`}
              onClick={() =>
                onUpdateSetting({
                  ...settings[SettingID.NOTIFY_AUTO],
                  value: !settings[SettingID.NOTIFY_AUTO].value,
                })
              }
              title={browser.i18n.getMessage('toggleNotificationText')}
              text={
                settings[SettingID.NOTIFY_AUTO].value
                  ? browser.i18n.getMessage('notificationEnabledText')
                  : browser.i18n.getMessage('notificationDisabledText')
              }
            />
            <div
              id="cleanButtonContainer"
              className="btn-group m-1"
              role="group"
              aria-label="Clean Actions Group"
            >
              <IconButton
                iconName="eraser"
                className="btn btn-warning"
                type="button"
                styleReact={{
                  borderRightColor: 'rgb(176, 132, 0)',
                }}
                onClick={() => {
                  onCookieCleanup({
                    greyCleanup: false,
                    ignoreOpenTabs: false,
                  });
                  animateFlash(
                    document.getElementById('cleanButtonContainer'),
                    true,
                  );
                }}
                title={browser.i18n.getMessage('cookieCleanupText')}
                text={browser.i18n.getMessage('cleanText')}
              />

              <button
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#cleanCollapse"
                aria-expanded="false"
                aria-controls="cleanCollapse"
                className="btn btn-warning dropdown-toggle dropdown-toggle-split"
                style={{
                  borderLeftColor: 'rgb(176, 132, 0)',
                }}
              >
                <span className="visually-hidden">
                  {browser.i18n.getMessage('dropdownAdditionalCleaningOptions')}
                </span>
              </button>
            </div>
            <IconButton
              iconName="cog"
              className="btn-info m-1"
              onClick={() => {
                browser.runtime.openOptionsPage();
                window.close();
              }}
              title={browser.i18n.getMessage('preferencesText')}
              text={browser.i18n.getMessage('preferencesText')}
            />
          </div>
        </div>
        <CleanCollapseGroup hostname={hostname || ''} tab={tab} />

        <div className="row mt-2 mx-auto align-items-center">
          <div className="col d-flex align-items-center">
            {tab.favIconUrl && !tab.favIconUrl.startsWith('chrome:') && (
              <img
                alt={'favIcon'}
                src={tab.favIconUrl}
                style={{
                  height: '20px',
                  marginRight: '7px',
                  width: '20px',
                }}
              />
            )}
            <span
              style={{
                fontSize: '1.1em',
                marginRight: '8px',
              }}
            >
              {`${hostname}${
                contextualIdentities && cache[storeId] !== undefined
                  ? ` (${cache[storeId]})`
                  : ''
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
          <div key={addableHostname} className="row align-items-center mt-2">
            <div className="col">{addableHostname}</div>
            <div className="btn-group col flex-grow-0 gap-1" role="group">
              <IconButton
                className="btn btn-secondary"
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
                className="btn btn-primary"
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

        <div className="row mt-2 mx-0">
          <FilteredExpression url={hostname} storeId={storeId} />
        </div>
        <div className="row mt-2 mx-0">
          <ActivityTable
            numberToShow={3}
            decisionFilter={FilterOptions.CLEAN}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  return {
    contextualIdentities: getSetting(
      state,
      SettingID.CONTEXTUAL_IDENTITIES,
    ) as boolean,
    state,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
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
