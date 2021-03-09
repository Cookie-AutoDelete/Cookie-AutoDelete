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
import { cadLog, isFirefox } from '../../../services/Libs';
import IconButton from '../../common_components/IconButton';

const styles = {
  buttonStyle: {
    height: 'max-content',
    padding: '0.75em',
    width: 'max-content',
  },
};
interface OwnProps {
  style?: React.CSSProperties;
}

interface StateProps {
  bName: browserName;
  cache: CacheMap;
  platformInfo: browser.runtime.PlatformInfo;
  settings: MapToSettingObject;
}
enum platformOS {
  mac = 'Mac OS',
  win = 'Windows',
  android = 'Android',
  cros = 'Chrome OS',
  linux = 'Linux',
  openbsd = 'Open/FreeBSD',
}

const settingOrder = [
  SettingID.ACTIVE_MODE,
  SettingID.CLEAN_DELAY,
  SettingID.CLEAN_DISCARDED,
  SettingID.CLEAN_DOMAIN_CHANGE,
  SettingID.ENABLE_GREYLIST,
  SettingID.CLEAN_OPEN_TABS_STARTUP,
  SettingID.CLEAN_EXPIRED,
  SettingID.CLEANUP_CACHE,
  SettingID.CLEANUP_INDEXEDDB,
  SettingID.CLEANUP_LOCALSTORAGE,
  SettingID.CLEANUP_PLUGIN_DATA,
  SettingID.CLEANUP_SERVICE_WORKERS,
  SettingID.CONTEXTUAL_IDENTITIES,
  SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
  SettingID.STAT_LOGGING,
  SettingID.NUM_COOKIES_ICON,
  SettingID.KEEP_DEFAULT_ICON,
  SettingID.NOTIFY_AUTO,
  SettingID.NOTIFY_MANUAL,
  SettingID.NOTIFY_DURATION,
  SettingID.ENABLE_NEW_POPUP,
  SettingID.SIZE_POPUP,
  SettingID.SIZE_SETTING,
  SettingID.CONTEXT_MENUS,
  SettingID.DEBUG_MODE,
];

type AboutProps = OwnProps & StateProps;

class About extends React.Component<AboutProps> {
  public render() {
    const { bName, cache, platformInfo, settings, style } = this.props;
    const settingSlim = settingOrder.map((s) => {
      const so = settings[s];
      return `- ${so.name}: ${so.value}`;
    });
    return (
      <div style={style}>
        <h1>{browser.i18n.getMessage('aboutText')}</h1>
        <h5>
          {browser.i18n.getMessage('versionNumberText', ['CAD'])}:
          <br />
          <b>{browser.runtime.getManifest().version}</b>
        </h5>
        <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/issues">
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
        <br />
        <h3>{browser.i18n.getMessage('debugTitle')}</h3>
        <p>{browser.i18n.getMessage('copyDebugSystemText')}</p>
        <textarea
          id="debugInfo"
          rows={3}
          cols={40}
          readOnly={true}
          style={{ resize: 'none' }}
        >
          {`- OS: ${platformInfo.arch} ${
            platformOS[platformInfo.os]
          } (Please add OS version on paste)\n- Browser Info: ${bName} ${
            isFirefox(cache)
              ? `${cache.browserVersion} (${cache.browserInfo.buildID})`
              : `(Please add version number on paste)`
          }\n- CookieAutoDelete Version: ${
            browser.runtime.getManifest().version
          }`}
        </textarea>
        <br />
        <IconButton
          className="btn-primary"
          role="button"
          onClick={() => {
            const textDebug = document.getElementById('debugInfo');
            const spanCopy = document.getElementById('copy-debugInfo');
            if (!textDebug || !spanCopy) {
              cadLog(
                {
                  type: 'error',
                  msg: 'Could not find either textarea or span for debugInfo',
                },
                true,
              );
              return;
            }
            if (!textDebug.textContent) {
              cadLog(
                {
                  type: 'error',
                  msg: 'Could not get textContent from textarea for debugInfo',
                },
                true,
              );
              return;
            }
            navigator.clipboard.writeText(textDebug.textContent).then(
              () => {
                spanCopy.classList.add('text-success');
                spanCopy.innerText = browser.i18n.getMessage('copySuccessText');
              },
              () => {
                spanCopy.classList.add('text-danger');
                spanCopy.innerText = browser.i18n.getMessage('copyFailedText');
              },
            );
            setTimeout(() => {
              spanCopy.innerText = '';
              spanCopy.classList.remove('text-danger', 'text-success');
            }, 5000);
          }}
          iconName="copy"
          title={browser.i18n.getMessage('copyToClipboardText')}
          text={browser.i18n.getMessage('copyToClipboardText')}
          styleReact={styles.buttonStyle}
        />{' '}
        <span id="copy-debugInfo">&nbsp;</span>
        <br />
        <br />
        <p>{browser.i18n.getMessage('copyDebugSettingText')}</p>
        <textarea
          id="debugSettings"
          rows={5}
          cols={40}
          readOnly={true}
          style={{ resize: 'none' }}
        >{`${settingSlim.join('\n')}`}</textarea>
        <br />
        <IconButton
          className="btn-primary"
          role="button"
          onClick={() => {
            const textDebug = document.getElementById('debugSettings');
            const spanCopy = document.getElementById('copy-debugSettings');
            if (!textDebug || !spanCopy) {
              cadLog(
                {
                  type: 'error',
                  msg:
                    'Could not find either textarea or span for debugSettings',
                },
                true,
              );
              return;
            }
            if (!textDebug.textContent) {
              cadLog(
                {
                  type: 'error',
                  msg:
                    'Could not get textContent from textarea for debugSettings',
                },
                true,
              );
              return;
            }
            navigator.clipboard.writeText(textDebug.textContent).then(
              () => {
                spanCopy.classList.add('text-success');
                spanCopy.innerText = browser.i18n.getMessage('copySuccessText');
              },
              () => {
                spanCopy.classList.add('text-danger');
                spanCopy.innerText = browser.i18n.getMessage('copyFailedText');
              },
            );
            setTimeout(() => {
              spanCopy.innerText = '';
              spanCopy.classList.remove('text-danger', 'text-success');
            }, 5000);
          }}
          iconName="copy"
          title={browser.i18n.getMessage('copyToClipboardText')}
          text={browser.i18n.getMessage('copyToClipboardText')}
          styleReact={styles.buttonStyle}
        />{' '}
        <span id="copy-debugSettings">&nbsp;</span>
        <br />
        <br />
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  const { cache, settings } = state;
  return {
    bName: cache.browserDetect || (browserDetect() as browserName),
    cache,
    platformInfo: cache.platformInfo,
    settings,
  };
};

export default connect(mapStateToProps)(About);
