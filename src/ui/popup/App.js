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
import {findDOMNode} from "react-dom";
import {connect} from "react-redux";
import {getHostname, extractMainDomain, getSetting, prepareCookieDomain} from "../../services/libs";
import FilteredExpression from "./components/FilteredExpression";
import {addExpressionUI, cookieCleanupUI, updateSettingUI} from "../UIActions";
import IconButton from "../common_components/IconButton";

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

	animateFlash(ref, success) {
		if (ref) {
			let domNode;
			try {
				// eslint-disable-next-line react/no-find-dom-node
				domNode = findDOMNode(ref);
			} catch (e) {
				// Ignore, we just won't animate anything.
			}
			if (domNode) {
				domNode.classList.add(success ? "successAnimated" : "failureAnimated");
				setTimeout(() => {
					domNode.classList.remove(success ? "successAnimated" : "failureAnimated");
				}, 1500);
			}
		}
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
			return true;
		}
		return false;
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
		const addableHostnames = [
			hostname === mainDomain ? undefined : `*.${mainDomain}`,
			hostname,
			`*.${hostname}`
		].filter(Boolean);
		return (
			<div className="container">
				<div
					className="row"
					style={{
						paddingTop: "8px",
						paddingBottom: "8px",
						backgroundColor: "rgba(0, 0, 0, 0.05)",
						borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
						width: "650px"
					}}
				>
					<div className="col-xs-1">
						<img
							style={{
								height: "32px",
								width: "32px",
								marginRight: "8px",
								verticalAlign: "middle"
							}}
							src={browser.extension.getURL("icons/icon_32.png")}
							title="Cookie AutoDelete"
						/>
					</div>

					<div className="col-xs-11" style={{ textAlign: "right" }}>
						<IconButton
							iconName="power-off"
							className={settings.activeMode.value ? "btn-success" : "btn-danger"}
							style={{ margin: "0 4px" }}
							onClick={() => onUpdateSetting({
								...settings.activeMode, value: !settings.activeMode.value
							})}
							title={settings.activeMode.value ? browser.i18n.getMessage("disableAutoDeleteText") : browser.i18n.getMessage("enableAutoDeleteText")}
						>
							{settings.activeMode.value ? browser.i18n.getMessage("autoDeleteEnabledText") : browser.i18n.getMessage("autoDeleteDisabledText")}
						</IconButton>

						<IconButton
							iconName="eraser"
							className="btn-warning"
							style={{ margin: "0 4px" }}
							onClick={() => {
								onCookieCleanup({
									greyCleanup: false, ignoreOpenTabs: false
								});
								this.animateFlash(this.cookieCleanupRef, true);
							}}
							title={browser.i18n.getMessage("cookieCleanupText")}
							ref={(e) => {this.cookieCleanupRef = e;}}
						>
							{browser.i18n.getMessage("cleanText")}
						</IconButton>

						<IconButton
							iconName="eraser"
							className="btn-warning"
							style={{ margin: "0 4px" }}
							onClick={() => {
								onCookieCleanup({
									greyCleanup: false, ignoreOpenTabs: true
								});
								this.animateFlash(this.cookieCleanupIgnoringOpenTabsRef, true);
							}}
							ref={(e) => {this.cookieCleanupIgnoringOpenTabsRef = e;}}
							title={browser.i18n.getMessage("cookieCleanupIgnoreOpenTabsText")}
						>
							{browser.i18n.getMessage("cleanIgnoringOpenTabsText")}
						</IconButton>

						<IconButton
							iconName="cog"
							className="btn-info"
							style={{ margin: "0 4px" }}
							onClick={() => browser.runtime.openOptionsPage()}
							title={browser.i18n.getMessage("preferencesText")}
						>
							{browser.i18n.getMessage("preferencesText")}
						</IconButton>
					</div>
				</div>

				<div style={{
					display: "flex", alignItems: "center", margin: "8px 0"
				}} className="row">
					{tab.favIconUrl &&
						<img style={{
							height: "20px",
							width: "20px",
							marginRight: "7px",
							verticalAlign: "middle"
						}} src={tab.favIconUrl} />
					}
					<span style={{
						fontSize: "20px", verticalAlign: "middle"
					}}>
						{
							// Temporary fix until contextualIdentities events land
						}
						{!contextualIdentities ? `${hostname}` : `${hostname} ${cache[storeId] !== undefined ? `(${cache[storeId]})` : ""}`}
					</span>
					<IconButton
						iconName="eraser"
						className="btn-warning"
						style={{
							marginLeft: "auto"
						}}
						title={browser.i18n.getMessage("clearCookiesForDomainText", [hostname])}
						ref={(e) => { this.clearCookiesRef = e; }}
						onClick={async () => {
							const success = await this.clearCookiesForThisDomain(hostname);
							this.animateFlash(this.clearCookiesRef, success);
						}}
					>
						{browser.i18n.getMessage("clearCookiesText")}
					</IconButton>
				</div>

				{addableHostnames.map((hostname) => (
					<div
						key={hostname}
						style={{
							display: "flex", margin: "8px 0", alignItems: "center"
						}}
						className="row"
					>
						<div style={{
							flex: 1
						}}>{hostname}</div>
						<div className="btn-group">
							<IconButton
								className="btn-secondary"
								onClick={() => {onNewExpression({
									expression: hostname, listType: "GREY", storeId
								});}}
								iconName="plus"
								title={browser.i18n.getMessage("toGreyListText")}
							>
								{browser.i18n.getMessage("greyListWordText")}
							</IconButton>

							<IconButton
								className="btn-primary"
								onClick={() => {onNewExpression({
									expression: hostname, listType: "WHITE", storeId
								});}}
								iconName="plus"
								title={browser.i18n.getMessage("toWhiteListText")}
							>
								{browser.i18n.getMessage("whiteListWordText")}
							</IconButton>
						</div>
					</div>
				))}

				<div className="row" style={{
					margin: "8px 0"
				}}>
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
