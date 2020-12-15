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
import { initialState } from '../../../redux/State';
import {
  cadLog,
  isChrome,
  isFirefox,
  isFirefoxNotAndroid,
} from '../../../services/Libs';
import { ReduxAction } from '../../../typings/ReduxConstants';
import CheckboxSetting from '../../common_components/CheckboxSetting';
import IconButton from '../../common_components/IconButton';
import SelectInput from '../../common_components/SelectInput';
import { downloadObjectAsJSON } from '../../UILibs';
import SettingsTooltip from './SettingsTooltip';

const styles = {
  buttonStyle: {
    height: 'max-content',
    padding: '0.75em',
    width: 'max-content',
  },
  inlineNumberInput: {
    display: 'inline',
    margin: '0 5px',
  },
};

interface OwnProps {
  style?: React.CSSProperties;
}

interface StateProps {
  cache: CacheMap;
  settings: MapToSettingObject;
}

interface DispatchProps {
  onUpdateSetting: (setting: Setting) => void;
  onResetButtonClick: () => void;
}

type SettingProps = OwnProps & StateProps & DispatchProps;

class InitialState {
  public error = '';
  public success = '';
}

class Settings extends React.Component<SettingProps> {
  public state = new InitialState();

  // Import Settings
  public importCoreSettings(importFile: File) {
    const { settings } = this.props;
    const debug = settings[SettingID.DEBUG_MODE].value as boolean;
    cadLog(
      {
        msg: 'Import Core Settings received file for parsing.',
        x: {
          name: importFile.name,
          size: importFile.size,
          type: importFile.type,
        },
      },
      debug,
    );
    // Do check for import first!
    if (importFile.type !== 'application/json') {
      this.setError(
        new Error(
          `${browser.i18n.getMessage('importFileTypeInvalid')}:  ${
            importFile.name
          } (${importFile.type})`,
        ),
      );
      return;
    }
    const { onUpdateSetting } = this.props;
    const initialSettingKeys = Object.keys(initialState.settings);
    const reader = new FileReader();
    reader.onload = (file) => {
      try {
        if (!file.target) {
          this.setError(
            new Error(
              browser.i18n.getMessage('importFileNotFound', [importFile.name]),
            ),
          );
          return;
        }
        // https://stackoverflow.com/questions/35789498/new-typescript-1-8-4-build-error-build-property-result-does-not-exist-on-t
        const target: FileReader = file.target;
        const result: string = target.result as string;
        const jsonImport: { [k: string]: Record<string, unknown> } = JSON.parse(
          result,
        );
        if (!jsonImport.settings) {
          cadLog(
            {
              msg:
                'importCoreSettings:  Imported JSON does not have "settings" array',
              x: jsonImport,
            },
            debug,
          );
          this.setError(
            new Error(
              `${browser.i18n.getMessage(
                'importFileValidationFailed',
              )}. ${browser.i18n.getMessage('importMissingKey')} 'settings': ${
                importFile.name
              }`,
            ),
          );
          return;
        }
        // from { name, value } to name:{ name, value }
        const newSettings: MapToSettingObject = ((jsonImport.settings as unknown) as Setting[]).reduce(
          (a: { [k: string]: Setting }, c: Setting) => {
            a[c.name] = c;
            return a;
          },
          {},
        );
        const settingKeys = Object.keys(newSettings);
        const unknownKeys = settingKeys.filter(
          (key) => !initialSettingKeys.includes(key),
        );
        if (unknownKeys.length > 0) {
          this.setError(
            new Error(
              `${browser.i18n.getMessage(
                'importCoreSettingsFailed',
              )}:  ${unknownKeys.join(', ')}`,
            ),
          );
          return;
        }
        settingKeys.forEach((setting) => {
          if (settings[setting].value !== newSettings[setting].value) {
            cadLog(
              {
                msg: `Setting updated:  ${setting} (${settings[setting].value} => ${newSettings[setting].value})`,
              },
              debug,
            );
            onUpdateSetting(newSettings[setting]);
          } else {
            cadLog(
              {
                msg: `Setting remains unchanged:  ${setting} (${settings[setting].value})`,
              },
              debug,
            );
          }
        });
        this.setState({
          error: '',
          success: browser.i18n.getMessage('importCoreSettingsText'),
        });
      } catch (error) {
        this.setState({
          error: error.toString(),
          success: '',
        });
      }
    };

    reader.readAsText(importFile);
  }

  public exportCoreSettings() {
    const { settings } = this.props;
    // Convert from name:{name, value} to {name, value}
    const exportSettings: Setting[] = Object.values(settings);
    const r = downloadObjectAsJSON(
      { settings: exportSettings },
      'CoreSettings',
    );
    cadLog(
      {
        msg: 'exportCoreSettings: Core Settings Exported.',
        type: 'info',
        x: r,
      },
      settings[SettingID.DEBUG_MODE].value as boolean,
    );
    this.setState({
      error: '',
      success: `${browser.i18n.getMessage('exportSettingsText')}: ${
        r.downloadName
      }`,
    });
  }

  public render() {
    const {
      cache,
      onResetButtonClick,
      onUpdateSetting,
      settings,
      style,
    } = this.props;
    const { error, success } = this.state;
    return (
      <div style={style}>
        <h1>{browser.i18n.getMessage('settingsText')}</h1>
        <br />
        <div className="row no-gutters justify-content-between justify-content-md-start">
          <div className="col-7 col-md-auto">
            <IconButton
              className="btn-primary"
              iconName="download"
              role="button"
              onClick={() => this.exportCoreSettings()}
              title={browser.i18n.getMessage('exportTitleTimestamp')}
              text={browser.i18n.getMessage('exportSettingsText')}
              styleReact={styles.buttonStyle}
            />
          </div>
          <div className="col-7 col-md-auto">
            <IconButton
              tag="input"
              className="btn-info"
              iconName="upload"
              type="file"
              accept="application/json, .json"
              onChange={(e) => this.importCoreSettings(e.target.files[0])}
              title={browser.i18n.getMessage('importCoreSettingsText')}
              text={browser.i18n.getMessage('importCoreSettingsText')}
              styleReact={styles.buttonStyle}
            />
          </div>
          <div className="col-7 col-md-auto">
            <IconButton
              className="btn-danger"
              role="button"
              onClick={() => {
                onResetButtonClick();
                this.setState({
                  error: '',
                  success: browser.i18n.getMessage('defaultSettingsText'),
                });
              }}
              iconName="undo"
              title={browser.i18n.getMessage('defaultSettingsText')}
              text={browser.i18n.getMessage('defaultSettingsText')}
              styleReact={styles.buttonStyle}
            />
          </div>
        </div>
        <br />
        {error !== '' ? (
          <div
            onClick={() => this.setState({ error: '' })}
            className="row alert alert-danger alertPreWrap"
          >
            {error}
          </div>
        ) : (
          ''
        )}
        {success !== '' ? (
          <div
            onClick={() => this.setState({ success: '' })}
            className="row alert alert-success alertPreWrap"
          >
            {browser.i18n.getMessage('successText')} {success}
          </div>
        ) : (
          ''
        )}

        <fieldset>
          <legend>{browser.i18n.getMessage('settingGroupAutoClean')}</legend>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('activeModeText')}
              inline={true}
              settingObject={settings[SettingID.ACTIVE_MODE]}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-automatic-cleaning'} />
          </div>
          <div className="form-group">
            <input
              id="delayBeforeClean"
              type="number"
              className="form-control w-auto"
              style={styles.inlineNumberInput}
              onChange={(e) => {
                const eValue = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(eValue) && eValue >= 1 && eValue <= 2147483) {
                  onUpdateSetting({
                    name: SettingID.CLEAN_DELAY,
                    value: eValue,
                  });
                }
              }}
              value={settings[SettingID.CLEAN_DELAY].value as number}
              min="1"
              max="2147483"
              size={10}
            />
            <label htmlFor="delayBeforeClean">
              {browser.i18n.getMessage('secondsText')}{' '}
              {browser.i18n.getMessage('activeModeDelayText')}
            </label>
            <SettingsTooltip hrefURL={'#delay-before-automatic-cleaning'} />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('cleanDiscardedText')}
              settingObject={settings[SettingID.CLEAN_DISCARDED]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#enable-cleanup-for-discardedunloaded-tabs'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('cleanupDomainChangeText')}
              settingObject={settings[SettingID.CLEAN_DOMAIN_CHANGE]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-cleanup-on-domain-change'} />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage(SettingID.ENABLE_GREYLIST)}
              settingObject={settings[SettingID.ENABLE_GREYLIST]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#enable-greylist-cleanup-on-browser-restart'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('cookieCleanUpOnStartText')}
              settingObject={settings[SettingID.CLEAN_OPEN_TABS_STARTUP]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#clean-cookies-from-open-tabs-on-startup'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              settingObject={settings[SettingID.CLEAN_EXPIRED]}
              inline={true}
              text={browser.i18n.getMessage('cleanExpiredCookiesText')}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#clean-all-expired-cookies'} />
          </div>
        </fieldset>
        <hr />
        <fieldset>
          <legend>{browser.i18n.getMessage('settingGroupExpression')}</legend>
          <div className="alert alert-info">
            {browser.i18n.getMessage('groupExpressionDefaultNotice', [
              browser.i18n.getMessage('expressionListText'),
            ])}{' '}
            <SettingsTooltip hrefURL={'#default-expression-options'} />
          </div>
        </fieldset>
        <hr />
        {(isFirefoxNotAndroid(cache) || isChrome(cache)) && (
          <fieldset>
            <legend>
              {browser.i18n.getMessage('settingGroupOtherBrowsing')}
            </legend>
            <div className="alert alert-warning">
              {browser.i18n.getMessage('browsingDataWarning')}
            </div>
            {((isFirefoxNotAndroid(cache) && cache.browserVersion >= '78') ||
              isChrome(cache)) && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('cacheCleanupText')}
                  settingObject={settings[SettingID.CLEANUP_CACHE]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#other-browsing-data-cleanup-options'}
                />
              </div>
            )}
            {((isFirefoxNotAndroid(cache) && cache.browserVersion >= '77') ||
              isChrome(cache)) && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('indexedDBCleanupText')}
                  settingObject={settings[SettingID.CLEANUP_INDEXEDDB]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#other-browsing-data-cleanup-options'}
                />
              </div>
            )}
            {((isFirefoxNotAndroid(cache) && cache.browserVersion >= '58') ||
              isChrome(cache)) && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('localStorageCleanupText')}
                  settingObject={settings[SettingID.CLEANUP_LOCALSTORAGE]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#other-browsing-data-cleanup-options'}
                />
              </div>
            )}
            {((isFirefoxNotAndroid(cache) && cache.browserVersion >= '78') ||
              isChrome(cache)) && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('pluginDataCleanupText')}
                  settingObject={settings[SettingID.CLEANUP_PLUGIN_DATA]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#other-browsing-data-cleanup-options'}
                />
              </div>
            )}
            {((isFirefoxNotAndroid(cache) && cache.browserVersion >= '77') ||
              isChrome(cache)) && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('serviceWorkersCleanupText')}
                  settingObject={settings[SettingID.CLEANUP_SERVICE_WORKERS]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#other-browsing-data-cleanup-options'}
                />
              </div>
            )}
          </fieldset>
        )}
        {(isFirefoxNotAndroid(cache) || isChrome(cache)) && <hr />}
        <fieldset>
          <legend>{browser.i18n.getMessage('settingGroupExtension')}</legend>
          {isFirefoxNotAndroid(cache) && (
            <div className="form-group">
              <div className="alert alert-warning">
                {browser.i18n.getMessage('containerSiteDataWarning')}
              </div>
              <CheckboxSetting
                text={browser.i18n.getMessage(
                  'contextualIdentitiesEnabledText',
                )}
                settingObject={settings[SettingID.CONTEXTUAL_IDENTITIES]}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={'#enable-support-for-firefoxs-container-tabs'}
              />
            </div>
          )}
          {isFirefoxNotAndroid(cache) &&
            settings[SettingID.CONTEXTUAL_IDENTITIES].value && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage(
                    'contextualIdentitiesAutoRemoveText',
                  )}
                  settingObject={
                    settings[SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE]
                  }
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={
                    '#enable-automatic-removal-of-expression-list-when-its-container-is-removed'
                  }
                />
              </div>
            )}
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('enableCleanupLogText')}
              settingObject={settings[SettingID.STAT_LOGGING]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-cleanup-log-and-counter'} />
            {settings[SettingID.STAT_LOGGING].value && (
              <div className="alert alert-warning">
                {browser.i18n.getMessage('noPrivateLogging')}
              </div>
            )}
          </div>
          {(!isFirefox(cache) || isFirefoxNotAndroid(cache)) && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage('showNumberOfCookiesInIconText')}
                settingObject={settings[SettingID.NUM_COOKIES_ICON]}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={'#show-number-of-cookies-for-that-domain'}
              />
            </div>
          )}
          {(!isFirefox(cache) || isFirefoxNotAndroid(cache)) &&
            settings[SettingID.NUM_COOKIES_ICON].value === true && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage(SettingID.KEEP_DEFAULT_ICON)}
                  settingObject={settings[SettingID.KEEP_DEFAULT_ICON]}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip
                  hrefURL={'#keep-default-icon-on-all-list-types'}
                />
              </div>
            )}
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('notifyCookieCleanUpText')}
              settingObject={settings[SettingID.NOTIFY_AUTO]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#show-notification-after-automatic-cleanup'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              inline={true}
              settingObject={settings[SettingID.NOTIFY_MANUAL]}
              text={browser.i18n.getMessage('manualNotificationsText')}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#show-notification-from-manual-site-data-cleanups'}
            />
          </div>
          <div className="form-group">
            <SelectInput
              numSize={9}
              numStart={1}
              settingObject={settings[SettingID.NOTIFY_DURATION]}
              text={`${browser.i18n.getMessage(
                'secondsText',
              )} ${browser.i18n.getMessage('notifyCookieCleanupDelayText')}`}
              updateSetting={(payload) => {
                onUpdateSetting(payload);
              }}
            />
            <SettingsTooltip hrefURL={'#duration-for-notifications'} />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage(SettingID.ENABLE_NEW_POPUP)}
              settingObject={settings[SettingID.ENABLE_NEW_POPUP]}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#enable-popup-when-new-version-is-released'}
            />
          </div>
          <div className="form-group">
            <SelectInput
              numSize={14}
              numStart={10}
              settingObject={settings[SettingID.SIZE_POPUP]}
              text={browser.i18n.getMessage('sizePopupText')}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#size-of-popup'} />
          </div>
          <div className="form-group">
            <SelectInput
              numSize={14}
              numStart={10}
              settingObject={settings[SettingID.SIZE_SETTING]}
              text={browser.i18n.getMessage('sizeSettingText')}
              updateSetting={(payload) => {
                onUpdateSetting(payload);
              }}
            />
            <SettingsTooltip hrefURL={'#size-of-setting'} />
          </div>
          {(isFirefoxNotAndroid(cache) || isChrome(cache)) && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage('enableContextMenus')}
                settingObject={settings[SettingID.CONTEXT_MENUS]}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip hrefURL={'#enable-context-menus'} />
            </div>
          )}
          {(isFirefoxNotAndroid(cache) || isChrome(cache)) && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage(SettingID.DEBUG_MODE)}
                settingObject={settings[SettingID.DEBUG_MODE]}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip hrefURL={'#debug-mode'} />
              {settings[SettingID.DEBUG_MODE].value && (
                <div className="alert alert-info">
                  <p>{browser.i18n.getMessage('openDebugMode')}</p>
                  <pre>
                    <b>
                      {(isFirefox(cache) &&
                        'about:devtools-toolbox?type=extension&id=') ||
                        (isChrome(cache) && `chrome://extensions/?id=`)}
                      {encodeURIComponent(browser.runtime.id)}
                    </b>
                  </pre>
                  {isChrome(cache) && (
                    <p>{browser.i18n.getMessage('chromeDebugMode')}</p>
                  )}
                  <p>
                    {browser.i18n.getMessage('consoleDebugMode')}.{' '}
                    {browser.i18n.getMessage('filterDebugMode')}
                  </p>
                  <p>
                    <b>CAD_</b>
                  </p>
                </div>
              )}
            </div>
          )}
        </fieldset>
        <br />
        <br />
      </div>
    );
  }

  private setError(e: Error): void {
    this.setState({
      error: e.toString(),
      success: '',
    });
  }
}

const mapStateToProps = (state: State) => {
  const { settings, cache } = state;
  return {
    cache,
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

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
