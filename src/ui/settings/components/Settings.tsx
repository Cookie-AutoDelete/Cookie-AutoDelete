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
import { cadLog } from '../../../services/Libs';
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

class InitialState {
  public error = '';
  public success = '';
}

class Settings extends React.Component<SettingProps> {
  public state = new InitialState();

  // Import Settings
  public importCoreSettings(importFile: File) {
    const { settings } = this.props;
    const debug = settings.debugMode.value as boolean;
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
      this.setState({
        error: `${browser.i18n.getMessage(
          'errorText',
        )} ${browser.i18n.getMessage('importFileTypeInvalid')}:  ${
          importFile.name
        } (${importFile.type})`,
        success: '',
      });
      return;
    }
    const { onUpdateSetting } = this.props;
    const initialSettingKeys = Object.keys(initialState.settings);
    const reader = new FileReader();
    reader.onload = (file) => {
      try {
        if (!file.target) throw Error('File Not Found!');
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
          throw new Error(
            `${browser.i18n.getMessage(
              'importFileValidationFailed',
            )}. ${browser.i18n.getMessage('importMissingKey')} 'settings': ${
              importFile.name
            }`,
          );
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
          throw new Error(
            `${browser.i18n.getMessage(
              'importCoreSettingsFailed',
            )}:  ${unknownKeys.join(', ')}`,
          );
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
      settings.debugMode.value as boolean,
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
      browserDetect,
      browserVersion,
      onResetButtonClick,
      onUpdateSetting,
      platformOs,
      settings,
      style,
    } = this.props;
    const { error, success } = this.state;
    return (
      <div style={style}>
        <h1>{browser.i18n.getMessage('settingsText')}</h1>
        <br />
        <div className="row">
          <div className="col-sm col-md-auto btn-group">
            <IconButton
              className="btn-primary"
              iconName="download"
              role="button"
              onClick={() => this.exportCoreSettings()}
              title={browser.i18n.getMessage('exportTitleTimestamp')}
              text={browser.i18n.getMessage('exportSettingsText')}
              styleReact={styles.buttonStyle}
            />
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
            className="row alert alert-danger"
          >
            {error}
          </div>
        ) : (
          ''
        )}
        {success !== '' ? (
          <div
            onClick={() => this.setState({success: '',})}
            className="row alert alert-success"
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
              settingObject={settings.activeMode}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-automatic-cleaning'} />
          </div>
          <div className="form-group">
            <input
              id="delayBeforeClean"
              type="number"
              className="form-control"
              style={styles.inlineNumberInput}
              onChange={(e) => {
                const eValue = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(eValue) && eValue >= 1 && eValue <= 2147483) {
                  onUpdateSetting({
                    name: settings.delayBeforeClean.name,
                    value: eValue,
                  });
                }
              }}
              value={settings.delayBeforeClean.value as number}
              min="1"
              max="2147483"
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
              settingObject={settings.discardedCleanup}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-cleanup-on-discarded-tabs'} />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('cleanupDomainChangeText')}
              settingObject={settings.domainChangeCleanup}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-cleanup-on-domain-change'} />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('enableGreyListCleanup')}
              settingObject={settings.enableGreyListCleanup}
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
              settingObject={settings.cleanCookiesFromOpenTabsOnStartup}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#clean-cookies-from-open-tabs-on-startup'}
            />
          </div>
        </fieldset>
        <hr />
        <fieldset>
          <legend>{browser.i18n.getMessage('settingGroupExpression')}</legend>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('greyCleanLocalstorage')}
              settingObject={settings.greyCleanLocalstorage}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#uncheck-keep-localstorage-on-new-greylist-expressions'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('whiteCleanLocalstorage')}
              settingObject={settings.whiteCleanLocalstorage}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={
                '#uncheck-keep-localstorage-on-new-whitelist-expressions'
              }
            />
          </div>
        </fieldset>
        <hr />
        <fieldset>
          <legend>
            {browser.i18n.getMessage('settingGroupOtherBrowsing')}
          </legend>
          {browserDetect === 'Firefox' && platformOs !== 'android' && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage(
                  'contextualIdentitiesEnabledText',
                )}
                settingObject={settings.contextualIdentities}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={
                  '#enable-support-for-firefoxs-container-tabs-firefox-only'
                }
              />
            </div>
          )}
          {((browserDetect === 'Firefox' &&
            browserVersion >= '58' &&
            platformOs !== 'android') ||
            browserDetect === 'Chrome') && (
            <div className="form-group">
              <CheckboxSetting
                text={`${browser.i18n.getMessage(
                  'localstorageCleanupText',
                )} (Firefox 58+, Chrome 74+)`}
                settingObject={settings.localstorageCleanup}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip hrefURL={'#enable-localstorage-support'} />
              {!settings.localstorageCleanup.value && (
                <div className="alert alert-warning">
                  {browser.i18n.getMessage('localstorageCleanupWarning')}
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
            </div>
          )}
        </fieldset>
        <hr />
        <fieldset>
          <legend>{browser.i18n.getMessage('settingGroupExtension')}</legend>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('enableCleanupLogText')}
              settingObject={settings.statLogging}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip hrefURL={'#enable-cleanup-log-and-counter'} />
            {settings.statLogging.value && (
              <div className="alert alert-warning">
                {browser.i18n.getMessage('noPrivateLogging')}
              </div>
            )}
          </div>
          {(browserDetect !== 'Firefox' || platformOs !== 'android') && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage('showNumberOfCookiesInIconText')}
                settingObject={settings.showNumOfCookiesInIcon}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={'#show-number-of-cookies-for-that-domain'}
              />
            </div>
          )}
          {(browserDetect !== 'Firefox' || platformOs !== 'android') &&
            settings.showNumOfCookiesInIcon.value === true && (
              <div className="form-group">
                <CheckboxSetting
                  text={browser.i18n.getMessage('keepDefaultIcon')}
                  settingObject={settings.keepDefaultIcon}
                  inline={true}
                  updateSetting={(payload) => onUpdateSetting(payload)}
                />
                <SettingsTooltip hrefURL={'#keep-default-icon'} />
              </div>
            )}
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('notifyCookieCleanUpText')}
              settingObject={settings.showNotificationAfterCleanup}
              inline={true}
              updateSetting={(payload) => onUpdateSetting(payload)}
            />
            <SettingsTooltip
              hrefURL={'#show-notification-after-cookie-cleanup'}
            />
          </div>
          <div className="form-group">
            <SelectInput
              numSize={4}
              numStart={1}
              settingObject={settings.notificationOnScreen}
              text={`${browser.i18n.getMessage(
                'secondsText',
              )} ${browser.i18n.getMessage('notifyCookieCleanupDelayText')}`}
              updateSetting={(payload) => {
                onUpdateSetting(payload);
              }}
            />
            <SettingsTooltip
              hrefURL={'#show-notification-after-cookie-cleanup'}
            />
          </div>
          <div className="form-group">
            <CheckboxSetting
              text={browser.i18n.getMessage('enableNewVersionPopup')}
              settingObject={settings.enableNewVersionPopup}
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
              settingObject={settings.sizePopup}
              text={browser.i18n.getMessage('sizePopupText')}
              updateSetting={(payload) => {
                onUpdateSetting(payload);
              }}
            />
            <SettingsTooltip hrefURL={'#size-of-popup'} />
          </div>
          <div className="form-group">
            <SelectInput
              numSize={14}
              numStart={10}
              settingObject={settings.sizeSetting}
              text={browser.i18n.getMessage('sizeSettingText')}
              updateSetting={(payload) => {
                onUpdateSetting(payload);
              }}
            />
            <SettingsTooltip hrefURL={'#size-of-setting'} />
          </div>
          {((browserDetect === 'Firefox' && platformOs !== 'android') ||
            browserDetect === 'Chrome') && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage('enableContextMenus')}
                settingObject={settings.contextMenus}
                inline={true}
                updateSetting={payload => onUpdateSetting(payload)}
              />
              <SettingsTooltip
                hrefURL={'#enable-context-menus'}
              />
            </div>
          )}
          {((browserDetect === 'Firefox' && platformOs !== 'android') ||
            browserDetect === 'Chrome') && (
            <div className="form-group">
              <CheckboxSetting
                text={browser.i18n.getMessage('debugMode')}
                settingObject={settings.debugMode}
                inline={true}
                updateSetting={(payload) => onUpdateSetting(payload)}
              />
              <SettingsTooltip hrefURL={'#debug-mode'} />
              {settings.debugMode.value && (
                <div className="alert alert-info">
                  <p>{browser.i18n.getMessage('openDebugMode')}</p>
                  <pre>
                    <b>
                      {(browserDetect === 'Firefox' &&
                        'about:devtools-toolbox?type=extension&id=') ||
                        (browserDetect === 'Chrome' &&
                          `chrome://extensions/?id=`)}
                      {encodeURIComponent(browser.runtime.id)}
                    </b>
                  </pre>
                  {browserDetect === 'Chrome' && (
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
}

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

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
