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
import {resetCookieDeletedCounterUI, resetSettingsUI, updateSettingUI} from "../../UIActions";
import CheckboxSetting from "../../common_components/CheckboxSetting";
import React from "react";
import Tooltip from "./SettingsTooltip";

const HistorySettings = (props) => {
	const {
		style,
		settings,
		onUpdateSetting,
		onResetButtonClick,
		onResetCounterButtonClick,
		browserDetect
	} = props;
	return (
		<div style={style}>
			<h1>{browser.i18n.getMessage("settingsText")}</h1>
			<div className="row">
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
					<span>{browser.i18n.getMessage("minutesText")}</span>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-automatic-cleaning"}
					/>

				</div>

			</div>

			<div className="row">
				<div className="col-md-9">
					<CheckboxSetting
						text={browser.i18n.getMessage("statLoggingText")}
						settingObject={settings.statLogging}
						inline={true}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
					<Tooltip
						hrefURL={"https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#log-total-number-of-cookies-deleted"}
					/>
				</div>

				<div className="col-md-3">
					<button onClick={() => onResetCounterButtonClick()} className="btn btn-warning" id="resetCounter">
						<span>{browser.i18n.getMessage("resetCounterText")}</span>
					</button>
				</div>

			</div>

			<div className="row">
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

			<div className="row">
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

			<div className="row">
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
					<div className="row">
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
				browserDetect === "Firefox" &&
					<div className="row">
						<div className="col-md-12">
							<CheckboxSetting
								text={browser.i18n.getMessage("localstorageCleanupText")}
								settingObject={settings.localstorageCleanup}
								inline={true}
								updateSetting={(payload) => onUpdateSetting(payload)}
							/>
							<Tooltip
								hrefURL={""}
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
		browserDetect: cache.browserDetect
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
	},
	onResetCounterButtonClick() {
		dispatch(
			resetCookieDeletedCounterUI()
		);
	}
});

export default connect(mapStateToProps, mapDispatchToProps)(HistorySettings);
