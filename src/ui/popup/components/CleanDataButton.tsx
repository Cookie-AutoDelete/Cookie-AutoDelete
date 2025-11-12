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
import browser from 'webextension-polyfill';
import {
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
  clearSiteDataForThisDomain,
} from '../../../services/CleanupService';
import type { SiteDataType } from '../../../typings/Enums';
import { useUIDispatch } from '../../hooks';
import { animateFlash } from '../popupLib';
import { useCallback } from 'react';

interface OwnProps {
  altColor?: boolean;
  btnColor?: string;
  hostname?: string;
  onClick?: () => Promise<boolean>;
  siteData?: SiteDataType | 'All';
  tab?: browser.Tabs.Tab;
  title?: string;
  text?: string;
}

const CleanDataButton: React.FunctionComponent<OwnProps> = (props) => {
  const {
    altColor,
    btnColor,
    hostname,
    onClick,
    siteData,
    tab,
    title,
    text,
    ...nativeProps
  } = props;

  const dispath = useUIDispatch();

  const cleanSiteDataUI = useCallback(
    async (
      siteData: SiteDataType | 'All',
      hostname: string,
      tab?: browser.Tabs.Tab,
    ): Promise<boolean> => {
      if (!hostname) return false;

      let result = await dispath(
        clearSiteDataForThisDomain({ siteData, hostname }),
      ).unwrap();

      if (siteData === 'All') {
        if (!tab) return false;

        const cookieSuccess = await dispath(
          clearCookiesForThisDomain(tab),
        ).unwrap();

        const localStorageSuccess = await dispath(
          clearLocalStorageForThisDomain(tab),
        ).unwrap();

        result = result || cookieSuccess || localStorageSuccess;
      }
      
      return result;
    },
    [dispath],
  );

  return (
    <button
      aria-controls="cleanCollapse"
      aria-expanded="false"
      className={`btn ${
        btnColor || `btn-${altColor ? 'secondary' : 'primary'}`
      } px-2 mt-1`}
      data-target="#cleanCollapse"
      data-toggle="collapse"
      onClick={async () => {
        let result = true;
        if (onClick) {
          result = await onClick.apply(this);
        } else if (siteData && hostname) {
          result = await cleanSiteDataUI(siteData, hostname, tab);
        }
        animateFlash(document.getElementById('cleanButtonContainer'), result);
      }}
      title={
        title ||
        (siteData &&
          hostname &&
          browser.i18n.getMessage(`manualCleanSiteData${siteData}Domain`, [
            hostname,
          ])) ||
        ''
      }
      type="button"
      {...nativeProps}
    >
      {text || browser.i18n.getMessage(`manualCleanSiteData${siteData}`)}
    </button>
  );
};

export default CleanDataButton;
