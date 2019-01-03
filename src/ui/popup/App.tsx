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
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import {
  addExpressionUI,
  cookieCleanupUI,
  updateSetting,
} from '../../redux/Actions';
import {
  extractMainDomain,
  getHostname,
  getSetting,
  isAnIP,
  prepareCookieDomain,
  returnOptionalCookieAPIAttributes,
} from '../../services/Libs';
import { FilterOptions } from '../../typings/Enums';
import { ReduxAction } from '../../typings/ReduxConstants';
import ActivityTable from '../common_components/ActivityTable';
import IconButton from '../common_components/IconButton';
import FilteredExpression from './components/FilteredExpression';

const styles = {
  buttonStyle: {
    margin: '4px 4px',
  },
};

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
  public tab: browser.tabs.Tab | undefined = undefined;
  public storeId: string = 'default';
}

type PopupAppComponentProps = DispatchProps & StateProps;

class App extends React.Component<PopupAppComponentProps, InitialState> {
  public state = new InitialState();
  private cleanButtonContainerRef: React.ReactInstance | null = null;

  public async componentDidMount() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    this.setState({
      storeId:
        !this.props.contextualIdentities ||
        (tabs[0].cookieStoreId && tabs[0].cookieStoreId === 'firefox-default')
          ? 'default'
          : tabs[0].cookieStoreId || 'default',
      tab: tabs[0],
    });
  }

  public animateFlash(ref: React.ReactInstance | null, success: boolean) {
    if (ref) {
      try {
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

  public async clearCookiesForThisDomain(hostname: string) {
    const { state } = this.props;
    if (!this.state.tab) return false;
    const { cookieStoreId } = this.state.tab;
    const cookies = (await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(state, {
        domain: hostname,
        firstPartyDomain: hostname,
        storeId: cookieStoreId,
      }),
    )) as browser.cookies.CookieProperties[];

    if (cookies.length > 0) {
      cookies.forEach(cookie =>
        browser.cookies.remove(returnOptionalCookieAPIAttributes(state, {
          firstPartyDomain: cookie.firstPartyDomain,
          name: cookie.name,
          storeId: cookie.storeId,
          url: prepareCookieDomain(cookie),
        }) as {
          // Fix type error with undefineds with cookies.remove
          url: string;
          name: string;
        }),
      );
      return true;
    }
    return false;
  }

  public clearLocalstorageForThisDomain(hostname: string) {
    // Using this method to ensure cross browser compatiblity
    browser.tabs.executeScript(undefined, {
      allFrames: true,
      code: 'window.localStorage.clear();window.sessionStorage.clear();',
    });
    return true;
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
    if (hostname !== '' && !isAnIP(tab.url)) {
      addableHostnames.push(`*.${hostname}`);
    }

    return (
      <div
        className="container-fluid"
        style={{
          minWidth: `${cache.browserDetect === 'Chrome' ? '650px' : ''}`,
        }}
      >
        <div
          className="row"
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            justifyContent: 'center',
            paddingBottom: '8px',
            paddingTop: '8px',
          }}
        >
          <IconButton
            iconName="power-off"
            className={settings.activeMode.value ? 'btn-success' : 'btn-danger'}
            styleReact={styles.buttonStyle}
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
            styleReact={styles.buttonStyle}
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
            ref={e => {
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

            <div className="dropdown">
              <button
                className="btn btn-warning dropdown-toggle dropdown-toggle-split"
                data-toggle="dropdown"
                data-disabled="true"
                style={{
                  transform: 'translate3d(-3px, 0px, 0px)',
                }}
              />
              <div className="dropdown-menu dropdown-menu-right">
                <a
                  className="dropdown-item"
                  href="#"
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
                >
                  {browser.i18n.getMessage('cleanIgnoringOpenTabsText')}
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={async () => {
                    const success = await this.clearCookiesForThisDomain(
                      hostname,
                    );
                    this.animateFlash(this.cleanButtonContainerRef, success);
                  }}
                  title={browser.i18n.getMessage('clearSiteDataForDomainText', [
                    'cookies',
                    hostname,
                  ])}
                >
                  {browser.i18n.getMessage('clearSiteDataText', ['cookies'])}
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={async () => {
                    const success = await this.clearLocalstorageForThisDomain(
                      hostname,
                    );
                    this.animateFlash(this.cleanButtonContainerRef, success);
                  }}
                  title={browser.i18n.getMessage('clearSiteDataForDomainText', [
                    'localstorage',
                    hostname,
                  ])}
                >
                  {browser.i18n.getMessage('clearSiteDataText', [
                    'localstorage',
                  ])}
                </a>
              </div>
            </div>
          </div>
          <IconButton
            iconName="cog"
            className="btn-info"
            styleReact={styles.buttonStyle}
            onClick={() => {
              browser.tabs.create({
                url: '/settings/settings.html#tabSettings',
              });
              window.close();
            }}
            title={browser.i18n.getMessage('preferencesText')}
            text={browser.i18n.getMessage('preferencesText')}
          />
        </div>

        <div
          className="row"
          style={{
            alignItems: 'center',
            margin: '8px 0',
          }}
        >
          {tab.favIconUrl && (
            <img
              src={tab.favIconUrl}
              style={{
                height: '20px',
                marginRight: '7px',
                verticalAlign: 'middle',
                width: '20px',
              }}
            />
          )}
          <span
            style={{
              fontSize: '20px',
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

        {addableHostnames.map(addableHostname => (
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
                    expression: addableHostname,
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
                    expression: addableHostname,
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
    contextualIdentities: getSetting(state, 'contextualIdentities') as boolean,
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
