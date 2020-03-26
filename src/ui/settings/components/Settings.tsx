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
import { resetSettings, updateSetting } from '../../../redux/Actions';
import { ReduxAction } from '../../../typings/ReduxConstants';
import CheckboxSetting from '../../common_components/CheckboxSetting';
import IconButton from '../../common_components/IconButton';
import SettingsTooltip from './SettingsTooltip';

const styles = {
  rowOverrides: {
    marginBottom: '10px',
  },
};

interface OwnProps {
  style?: React.CSSProperties;
}

interface StateProps {
  settings: MapToSettingObject;
  browserDetect: string;
  browserVersion: string;
  platformOs: string;
}

interface DispatchProps {
  onUpdateSetting: (setting: Setting) => void;
  onResetButtonClick: () => void;
}

type SettingProps = OwnProps & StateProps & DispatchProps;

const Settings: React.FunctionComponent<SettingProps> = props => {
  const {
    style,
    settings,
    onUpdateSetting,
    onResetButtonClick,
    browserDetect,
    platformOs,
    browserVersion,
  } = props;
  return (
    <div style={style}>
      <h1>{browser.i18n.getMessage('settingsText')}</h1>
      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('activeModeText')}
            inline={true}
            settingObject={settings.activeMode}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <input
            type="number"
            className="form-control"
            style={{
              display: 'inline',
              margin: '0 5px',
            }}
            onChange={e =>
              onUpdateSetting({
                id: settings.delayBeforeClean.id,
                name: settings.delayBeforeClean.name,
                value: e.target.value,
              })
            }
            value={settings.delayBeforeClean.value as number}
            min="0"
          />
          <span>{browser.i18n.getMessage('secondsText')}</span>
          <SettingsTooltip
            hrefURL={
              '#enable-automatic-cleaning'
            }
          />
        </div>
      </div>

      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('cleanupDomainChangeText')}
            settingObject={settings.domainChangeCleanup}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#enable-cleanup-on-domain-change'
            }
          />
        </div>
      </div>

      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('enableCleanupLogText')}
            settingObject={settings.statLogging}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#enable-cleanup-log-and-counter'
            }
          />
        </div>
      </div>

      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('showNumberOfCookiesInIconText')}
            settingObject={settings.showNumOfCookiesInIcon}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#show-number-of-cookies-for-that-domain'
            }
          />
        </div>
      </div>

      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('notifyCookieCleanUpText')}
            settingObject={settings.showNotificationAfterCleanup}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <input
            type="number"
            className="form-control"
            style={{
              display: 'inline',
              margin: '0 5px',
            }}
            onChange={e =>
              onUpdateSetting({
                id: settings.notificationOnScreen.id,
                name: settings.notificationOnScreen.name,
                value: e.target.value,
              })
            }
            value={settings.notificationOnScreen.value as number}
            min="1"
            max="5"
          />
          <span>{browser.i18n.getMessage('secondsText')}</span>
          <SettingsTooltip
            hrefURL={
              '#show-notification-after-cookie-cleanup'
            }
          />
        </div>
      </div>

      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('cookieCleanUpOnStartText')}
            settingObject={settings.cleanCookiesFromOpenTabsOnStartup}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#clean-cookies-from-open-tabs-on-startup'
            }
          />
        </div>
      </div>

      {browserDetect === 'Firefox' && platformOs !== 'android' && (
        <div className="row" style={styles.rowOverrides}>
          <div className="col">
            <CheckboxSetting
              text={browser.i18n.getMessage('contextualIdentitiesEnabledText')}
              settingObject={settings.contextualIdentities}
              inline={true}
              updateSetting={payload => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={
                '#enable-support-for-firefoxs-container-tabs-firefox-only'
              }
            />
          </div>
        </div>
      )}

      {browserDetect === 'Firefox' &&
        browserVersion >= '58' &&
        platformOs !== 'android' && (
          <div className="row" style={styles.rowOverrides}>
            <div className="col">
              <CheckboxSetting
                text={browser.i18n.getMessage('localstorageCleanupText')}
                settingObject={settings.localstorageCleanup}
                inline={true}
                updateSetting={payload => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={
                  '#enable-localstorage-support'
                }
              />
            </div>
          </div>
        )}

      {browserDetect === 'Firefox' &&
        browserVersion >= '58' &&
        platformOs !== 'android' && !settings.localstorageCleanup.value && (
        <div className="alert alert-warning">
          {browser.i18n.getMessage('localstorageCleanupWarning',)}
        </div>
      )}

      {settings.contextualIdentities.value &&
        settings.localstorageCleanup.value && (
          <div className="alert alert-warning">
            {browser.i18n.getMessage(
              'localstorageAndContextualIdentitiesWarning',
            )}
          </div>
        )}
      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('enableNewVersionPopup')}
            settingObject={settings.enableNewVersionPopup}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#enable-popup-when-new-version-is-released'
            }
          />
        </div>
      </div>
      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('greyCleanLocalstorage')}
            settingObject={settings.greyCleanLocalstorage}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#uncheck-keep-localstorage-on-new-greylist-expressions'
            }
          />
        </div>
      </div>
      <div className="row" style={styles.rowOverrides}>
        <div className="col">
          <CheckboxSetting
            text={browser.i18n.getMessage('whiteCleanLocalstorage')}
            settingObject={settings.whiteCleanLocalstorage}
            inline={true}
            updateSetting={payload => onUpdateSetting(payload)}
          />
          <SettingsTooltip
            hrefURL={
              '#uncheck-keep-localstorage-on-new-whitelist-expressions'
            }
          />
        </div>
      </div>


      <br />
      <br />
      <div className="row">
        <div className="col">
          <IconButton
            className="btn-danger"
            onClick={() => onResetButtonClick()}
            iconName="undo"
            text={browser.i18n.getMessage('defaultSettingsText')}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State) => {
  const { settings, cache } = state;
  return {
    browserDetect: cache.browserDetect,
    browserVersion: cache.browserVersion,
    platformOs: cache.platformOs,
    settings,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onUpdateSetting(newSetting: Setting) {
    dispatch(updateSetting(newSetting));
  },
  onResetButtonClick() {
    dispatch(resetSettings());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
