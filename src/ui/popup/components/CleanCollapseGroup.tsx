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

import * as React from 'react';
import { useCallback } from 'react';
import browser from 'webextension-polyfill';
import { cookieCleanupUI } from '../../../redux/UIActions';
import {
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
} from '../../../services/CleanupService';
import type { CleanupProperties } from '../../../typings/Cleanup';
import { SiteDataType } from '../../../typings/Enums';
import { useUIDispatch } from '../../hooks';
import CleanDataButton from './CleanDataButton';

interface OwnProps {
  hostname: string;
  tab: browser.Tabs.Tab;
}

type CleanCollapseComponentProps = OwnProps;

const CleanCollapseGroup: React.FunctionComponent<
  CleanCollapseComponentProps
> = (props) => {
  const { hostname, tab } = props;

  const dispatch = useUIDispatch();

  const handleCookieCleanup = useCallback(
    (payload: CleanupProperties) => {
      dispatch(cookieCleanupUI(payload));
    },
    [dispatch],
  );

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
            handleCookieCleanup({
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
          className="px-2 btn btn-light text-danger font-weight-bold"
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
            return dispatch(clearCookiesForThisDomain(tab)).unwrap();
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
            return dispatch(clearLocalStorageForThisDomain(tab)).unwrap();
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

export default CleanCollapseGroup;
