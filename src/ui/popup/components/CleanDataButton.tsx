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
import {
  clearCookiesForThisDomain,
  clearSiteDataForThisDomain,
} from '../../../services/CleanupService';
import { animateFlash } from '../popupLib';

interface OwnProps {
  altColor?: boolean;
  btnColor?: string;
  hostname?: string;
  onClick?: () => Promise<boolean>;
  siteData?: SiteDataType | 'All';
  tab?: browser.tabs.Tab;
  title?: string;
  text?: string;
}

interface StateProps {
  state: State;
}

const cleanSiteDataUI = async (
  state: State,
  siteData: SiteDataType | 'All',
  hostname: string,
  tab?: browser.tabs.Tab,
): Promise<boolean> => {
  if (!hostname) return false;
  let result = await clearSiteDataForThisDomain(state, siteData, hostname);
  if (siteData === 'All') {
    if (!tab) return false;
    const success = await clearCookiesForThisDomain(state, tab);
    result = result || success;
  }
  return result;
};

const CleanDataButton: React.FunctionComponent<OwnProps & StateProps> = (
  props,
) => {
  const {
    altColor,
    btnColor,
    hostname,
    onClick,
    siteData,
    state,
    tab,
    title,
    text,
    ...nativeProps
  } = props;
  return (
    <button
      aria-controls="cleanCollapse"
      aria-expanded="false"
      className={`btn ${
        btnColor || `btn-${altColor ? 'secondary' : 'primary'}`
      } btn-block px-2`}
      data-target="#cleanCollapse"
      data-toggle="collapse"
      onClick={async () => {
        let result = true;
        if (onClick) {
          result = await onClick.apply(this);
        } else if (state && siteData && hostname) {
          result = await cleanSiteDataUI(state, siteData, hostname, tab);
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

const mapStateToProps = (state: State) => {
  return {
    state,
  };
};

export default connect(mapStateToProps)(CleanDataButton);
