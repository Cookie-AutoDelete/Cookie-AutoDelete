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
							display: "inline"
						}}
						onChange={(e) => onUpdateSetting({
							name: settings.delayBeforeClean.name, value: e.target.value, id: settings.delayBeforeClean.id
						})}
						value={settings.delayBeforeClean.value}
						min="1"
					/>
					<span>{browser.i18n.getMessage("minutesText")}</span>
					<Tooltip
						text={browser.i18n.getMessage("activeModeTooltipText")}
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
						text={browser.i18n.getMessage("statLoggingTooltipText")}
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
						text={browser.i18n.getMessage("showNumberOfCookiesInIconTooltipText")}
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
					<Tooltip
						text={browser.i18n.getMessage("notifyCookieCleanUpTooltipText")}
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
						text={browser.i18n.getMessage("cookieCleanUpOnStartTooltipText")}
					/>
				</div>
			</div>

			{
				browserDetect === "Firefox" ?
					<div className="row">
						<div className="col-md-12">
							<CheckboxSetting
								text={browser.i18n.getMessage("contextualIdentitiesEnabledText")}
								settingObject={settings.contextualIdentities}
								inline={true}
								updateSetting={(payload) => onUpdateSetting(payload)}
							/>
							<Tooltip
								text={browser.i18n.getMessage("contextualIdentitiesTooltipText")}
							/>
						</div>
					</div> : ""
			}

			<br /><br />
			<div className="row">
				<div className="col-md-12">
					<button className="btn btn-danger" onClick={() => onResetButtonClick()}>
						<span>{browser.i18n.getMessage("defaultSettingsText")}</span>
					</button>
					<Tooltip
						text={browser.i18n.getMessage("defaultSettingsTooltipText")}
					/>
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
