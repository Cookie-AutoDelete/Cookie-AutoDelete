/**
Copyright (c) 2017 Kenny Do

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/
import {connect} from "react-redux";
import {resetSettingsUI, updateSettingUI} from "../../UIActions";
import CheckboxSetting from "../../common_components/CheckboxSetting";
import React from "react";
import Tooltip from "./SettingsTooltip";

const styles = {
	rowOverrides: {
		marginBottom: "10px"
	}
};

/**
 * Method to render the settings tab.
 *
 * Called for rendering the settings.
 *
 * @param {object} props - The properties of the extension.
 * @author Kenny Do, Christian Zei (the Evercookie and tracking part)
 */
const Settings = (props) => {
	const {
		style,
		settings,
		onUpdateSetting,
		onResetButtonClick,
		browserDetect,
		browserVersion
	} = props;
	return (
		<div style={style}>
			<h1>{browser.i18n.getMessage("settingsText")}</h1>
			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("activeModeText")}
						inline={true}
						settingObject={settings.activeMode}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<input
						type="number"
						className="form-control"
						style={{
							display: "inline",
							margin: "0 5px"
						}}
						onChange={(e) => onUpdateSetting({
							name: settings.delayBeforeClean.name, value: e.target.value, id: settings.delayBeforeClean.id
						})}
						value={settings.delayBeforeClean.value}
						min="0"
					/>
					<span>{browser.i18n.getMessage("secondsText")}</span>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-automatic-cleaning"}
					/>

				</div>

			</div>

			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("cleanupDomainChangeText")}
						settingObject={settings.domainChangeCleanup}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-cleanup-on-domain-change"}
					/>
				</div>
			</div>

			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("enableCleanupLogText")}
						settingObject={settings.statLogging}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-cleanup-log-and-counter"}
					/>
				</div>

			</div>

			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("showNumberOfCookiesInIconText")}
						settingObject={settings.showNumOfCookiesInIcon}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#show-number-of-cookies-for-that-domain"}
					/>
				</div>
			</div>

			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("notifyCookieCleanUpText")}
						settingObject={settings.showNotificationAfterCleanup}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<input
						type="number"
						className="form-control"
						style={{
							display: "inline",
							margin: "0 5px"
						}}
						onChange={(e) => onUpdateSetting({
							name: settings.notificationOnScreen.name, value: e.target.value, id: settings.notificationOnScreen.id
						})}
						value={settings.notificationOnScreen.value}
						min="1"
						max="5"
					/>
					<span>{browser.i18n.getMessage("secondsText")}</span>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#show-notification-after-cookie-cleanup"}
					/>
				</div>
			</div>

			<div className="row" style={styles.rowOverrides}>
				<div className="col-md-12">
					<CheckboxSetting
						text={browser.i18n.getMessage("cookieCleanUpOnStartText")}
						settingObject={settings.cleanCookiesFromOpenTabsOnStartup}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#clean-cookies-from-open-tabs-on-startup"}
					/>
				</div>
			</div>

			{
				browserDetect === "Firefox" &&
					<div className="row" style={styles.rowOverrides}>
						<div className="col-md-12">
							<CheckboxSetting
								text={browser.i18n.getMessage("contextualIdentitiesEnabledText")}
								settingObject={settings.contextualIdentities}
								inline={true}
								updateSetting={(payload) => onUpdateSetting(payload)}
							/>
							<Tooltip
								hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-support-for-firefoxs-container-tabs-firefox-only"}
							/>
						</div>
					</div>
			}

			{
				browserDetect === "Firefox" && browserVersion >= 58 &&
					<div className="row" style={styles.rowOverrides}>
						<div className="col-md-12">
							<CheckboxSetting
								text={browser.i18n.getMessage("localstorageCleanupText")}
								settingObject={settings.localstorageCleanup}
								inline={true}
								updateSetting={(payload) => onUpdateSetting(payload)}
							/>
							<Tooltip
								hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-localstorage-support"}
							/>
						</div>
					</div>
			}

			{
				settings.contextualIdentities.value && settings.localstorageCleanup.value &&
					<div className="alert alert-warning">
						{browser.i18n.getMessage("localstorageAndContextualIdentitiesWarning")}
					</div>
			}

			<h1>{browser.i18n.getMessage("evercookieSettingsText")}</h1>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("hstsAlarmText")}
                        settingObject={settings.hstsAlarm}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("hstsPreventText")}
                        settingObject={settings.hstsPrevent}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("dntHeaderSendText")}
                        settingObject={settings.dntHeaderSend}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecClearOnTabCloseText")}
                        settingObject={settings.ecClearOnTabClose}
                        inline={false}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecClearOnDomainChangeText")}
                        settingObject={settings.ecClearOnDomainChange}
                        inline={false}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecClearOnStartupText")}
                        settingObject={settings.ecClearOnStartup}
                        inline={false}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <h4>{browser.i18n.getMessage("evercookieDeletionText")}</h4>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecHTTPcookieDeleteText")}
                        settingObject={settings.ecHTTPcookieDelete}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecLSOdeleteText")}
                        settingObject={settings.ecLSOdelete}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecCacheClearText")}
                        settingObject={settings.ecCacheClear}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecWindowNameClearText")}
                        settingObject={settings.ecWindowNameClear}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecWebHistoryText")}
                        settingObject={settings.ecWebHistoryClear}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecLocalStorageText")}
                        settingObject={settings.ecLocalStorageClear}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

            <div className="row" style={styles.rowOverrides}>
                <div className="col-md-12">
                    <CheckboxSetting
                        text={browser.i18n.getMessage("ecIndexedDBclearText")}
                        settingObject={settings.ecIndexedDBclear}
                        inline={true}
                        updateSetting={(payload) => onUpdateSetting(payload)}
                    />
                </div>
            </div>

			{
				browserDetect !== "Firefox" &&
					<div className="row" style={styles.rowOverrides}>
						<div className="col-md-12">
							<CheckboxSetting
								text={browser.i18n.getMessage("ecSQLiteClearText")}
								settingObject={settings.ecSQLiteClear}
								inline={true}
								updateSetting={(payload) => onUpdateSetting(payload)}
							/>
						</div>
					</div>
            }

			<br /><br />
			<div className="row">
				<div className="col-md-12">
					<button className="btn btn-danger" onClick={() => onResetButtonClick()}>
						<span>{browser.i18n.getMessage("defaultSettingsText")}</span>
					</button>
				</div>
			</div>



		</div>
	);
};

const mapStateToProps = (state) => {
	const {
		settings, cache
	} = state;
	return {
		settings,
		browserDetect: cache.browserDetect,
		browserVersion: cache.browserVersion
	};
};

const mapDispatchToProps = (dispatch) => ({
	onUpdateSetting(newSetting) {
		dispatch(
			updateSettingUI(newSetting)
		);
	},
	onResetButtonClick() {
		dispatch(
			resetSettingsUI()
		);
	}
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
