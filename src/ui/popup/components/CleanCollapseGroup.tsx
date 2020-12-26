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
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { cookieCleanupUI } from '../../../redux/Actions';
import {
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
} from '../../../services/CleanupService';
import { ReduxAction } from '../../../typings/ReduxConstants';
import CleanDataButton from './CleanDataButton';

interface DispatchProps {
  onCookieCleanup: (payload: CleanupProperties) => void;
}

interface OwnProps {
  hostname: string;
  tab: browser.tabs.Tab;
}

interface StateProps {
  state: State;
}

type CleanCollapseComponentProps = DispatchProps & OwnProps & StateProps;

const CleanCollapseGroup: React.FunctionComponent<CleanCollapseComponentProps> = (
  props,
) => {
  const { hostname, tab, state, onCookieCleanup } = props;
  return (
    <div
      className="row justify-content-center collapse"
      id="cleanCollapse"
      role="group"
      style={{
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '4px 4px 8px 4px',
      }}
    >
      <div className="btn-group-vertical">
        <CleanDataButton
          btnColor="btn-warning"
          onClick={async () => {
            onCookieCleanup({
              greyCleanup: false,
              ignoreOpenTabs: true,
            });
            return true;
          }}
          title={browser.i18n.getMessage('cookieCleanupIgnoreOpenTabsText')}
          text={browser.i18n.getMessage('cleanIgnoringOpenTabsText')}
        />
        <button
          aria-disabled={true}
          className="px-2 btn btn-light btn-block text-danger font-weight-bold"
          disabled={true}
          type="button"
        >
          {browser.i18n.getMessage('cleanupActionsBypass')}
        </button>
        <CleanDataButton siteData="All" hostname={hostname} tab={tab} />
        <CleanDataButton
          altColor
          siteData={SiteDataType.CACHE}
          hostname={hostname}
        />
        <CleanDataButton
          onClick={async () => {
            return await clearCookiesForThisDomain(state, tab);
          }}
          title={browser.i18n.getMessage('manualCleanSiteDataCookiesDomain', [
            hostname,
          ])}
          text={browser.i18n.getMessage('manualCleanSiteDataCookies')}
        />
        <CleanDataButton
          altColor
          siteData={SiteDataType.INDEXEDDB}
          hostname={hostname}
        />
        <CleanDataButton
          onClick={async () => {
            return await clearLocalStorageForThisDomain(state, tab);
          }}
          siteData={SiteDataType.LOCALSTORAGE}
          hostname={hostname}
        />
        <CleanDataButton
          altColor
          siteData={SiteDataType.PLUGINDATA}
          hostname={hostname}
        />
        <CleanDataButton
          siteData={SiteDataType.SERVICEWORKERS}
          hostname={hostname}
        />
      </div>
    </div>
  );
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onCookieCleanup(payload: CleanupProperties) {
    dispatch(cookieCleanupUI(payload));
  },
});

const mapStateToProps = (state: State) => {
  return {
    state,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CleanCollapseGroup);
