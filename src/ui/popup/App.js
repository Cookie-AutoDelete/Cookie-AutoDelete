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
import React, {Component} from "react";
import {connect} from "react-redux";
import {getHostname, extractMainDomain, getSetting, prepareCookieDomain} from "../../services/libs";
import FilteredExpression from "./components/FilteredExpression";
import RowAction from "./components/RowAction";
import {addExpressionUI, cookieCleanupUI, updateSettingUI} from "../UIActions";
import CheckboxSetting from "../common_components/CheckboxSetting";

const styles = {
	rowText: {
		margin: "0 5px 0px 15px",
		fontSize: "18px",
		fontWeight: "bold"
	}
};

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tab: {},
			storeId: ""
		};
	}

	async componentDidMount() {
		const tabs = await browser.tabs.query({
			currentWindow: true, active: true
		});
		this.setState({
			tab: tabs[0],
			storeId: !this.props.contextualIdentities || tabs[0].cookieStoreId === "firefox-default" ? "default" : tabs[0].cookieStoreId
		});
	}

	// Flash a green background if successfull
	animateSuccess(element) {
		element.classList.add("successAnimated");
		setTimeout(() => {
			element.classList.remove("successAnimated");
		}, 1500);
	}

	// Flash a red background if it failed or couldn't be done
	animateFailure(element) {
		element.classList.add("failureAnimated");
		setTimeout(() => {
			element.classList.remove("failureAnimated");
		}, 1500);
	}

	async clearCookiesForThisDomain(hostname) {
		const {
			cookieStoreId
		} = this.state.tab;
		const cookies = await browser.cookies.getAll({
			domain: hostname,
			storeId: cookieStoreId
		});
		if (cookies.length > 0) {
			cookies.forEach((cookie) => browser.cookies.remove({
				url: prepareCookieDomain(cookie), name: cookie.name, storeId: cookie.storeId
			}));
			this.animateSuccess(document.getElementById("cookieCleanup3"));
		} else {
			this.animateFailure(document.getElementById("cookieCleanup3"));
		}
	}

	render() {
		const {
			tab, storeId
		} = this.state;
		const {
			onNewExpression, onCookieCleanup, onUpdateSetting, contextualIdentities, cache, settings
		} = this.props;
		const hostname = getHostname(tab.url);
		const mainDomain = extractMainDomain(hostname);
		return (
			<div className="container">
				<div className="row">

					<div className="col-md-12">
						<b style={{
							fontSize: "20px"
						}}>{browser.i18n.getMessage("hostWebsiteText")}</b>
						<i style={{
							float: "right"
						}} onClick={() => browser.runtime.openOptionsPage()} className="fa fa-cog fa-2x cursorPoint" aria-hidden="true"></i>
					</div>

					<div>
						<img style={{
							height: "1em", width: "1em", margin: "0 5px 0px 13px"
						}} src={tab.favIconUrl} />
						<span>{!contextualIdentities ? `${hostname}` : `${hostname} (${cache[storeId]})`}</span>
					</div>

				</div>
				<div className="row lineBreak" />

				<div className="row">
					<span style={styles.rowText}>{`${browser.i18n.getMessage("switchToGreyListText")}`}</span>
				</div>

				{
					hostname !== mainDomain ?
						<RowAction
							text={`- *.${mainDomain}`}
							action={() => onNewExpression({
								expression: `*.${mainDomain}`, listType: "GREY", storeId
							})}
							labelFor="addExpressionGrey"
						/> : ""
				}
				<RowAction
					text={`- ${hostname}`}
					action={() => onNewExpression({
						expression: `${hostname}`, listType: "GREY", storeId
					})}
					labelFor="addExpressionGrey"
				/>
				<RowAction
					text={`- *.${hostname}`}
					action={() => onNewExpression({
						expression: `*.${hostname}`, listType: "GREY", storeId
					})}
					labelFor="addExpressionGrey"
				/>

				<div className="row">
					<span style={styles.rowText}>{`${browser.i18n.getMessage("switchToWhiteListText")}`}</span>
				</div>

				{
					hostname !== mainDomain ?
						<RowAction
							text={`- *.${mainDomain}`}
							action={() => onNewExpression({
								expression: `*.${mainDomain}`, listType: "WHITE", storeId
							})}
							labelFor="addExpressionGrey"
						/> : ""
				}

				<RowAction
					text={`- ${hostname}`}
					action={() => onNewExpression({
						expression: `${hostname}`, listType: "WHITE", storeId
					})}
					labelFor="addExpressionGrey"
				/>

				<RowAction
					text={`- *.${hostname}`}
					action={() => onNewExpression({
						expression: `*.${hostname}`, listType: "WHITE", storeId
					})}
					labelFor="addExpressionWhite"
				/>

				<div className="row lineBreak" />
				<RowAction
					text={browser.i18n.getMessage("cookieCleanupText")}
					action={() => {
						onCookieCleanup({
							greyCleanup: false, ignoreOpenTabs: false
						});
						this.animateSuccess(document.getElementById("cookieCleanup1"));
					}}
					labelFor="cookieCleanup1"
				/>
				<RowAction
					text={browser.i18n.getMessage("cookieCleanupIgnoreOpenTabsText")}
					action={() => {
						onCookieCleanup({
							greyCleanup: false, ignoreOpenTabs: true
						});
						this.animateSuccess(document.getElementById("cookieCleanup2"));
					}}
					labelFor="cookieCleanup2"
				/>
				<RowAction
					text={browser.i18n.getMessage("clearCookiesForDomainText")}
					action={() => this.clearCookiesForThisDomain(hostname)}
					labelFor="cookieCleanup3"
				/>

				<div className="row lineBreak" />
				<div className="row" style={{
					paddingLeft: "15px"
				}}>
					<CheckboxSetting
						text={browser.i18n.getMessage("activeModeSwitchText")}
						settingObject={settings.activeMode}
						inline={true}
						bsStyle={"checkbox-success"}
						updateSetting={(payload) => onUpdateSetting(payload)}
					/>
				</div>

				<div className="row lineBreak" />
				<div className="row">

					<FilteredExpression url={hostname} storeId={storeId}/>

				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const {
		cache, settings
	} = state;
	return {
		contextualIdentities: getSetting(state, "contextualIdentities"), cache, settings
	};
};

const mapDispatchToProps = (dispatch) => (
	{
		onUpdateSetting(newSetting) {
			dispatch(
				updateSettingUI(newSetting)
			);
		},
		onNewExpression(payload) {
			dispatch(
				addExpressionUI(payload)
			);
		},
		onCookieCleanup(payload) {
			dispatch(
				cookieCleanupUI(payload)
			);
		}
	});

export default connect(mapStateToProps, mapDispatchToProps)(App);
