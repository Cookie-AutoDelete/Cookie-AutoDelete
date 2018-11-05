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
import {getHostname, extractMainDomain, getSetting, prepareCookieDomain, returnOptionalCookieAPIAttributes, isAnIP} from "../../services/libs";
import FilteredExpression from "./components/FilteredExpression";
import {addExpressionUI, cookieCleanup, updateSetting} from "../../redux/Actions";
import IconButton from "../common_components/IconButton";
import ActivityTable from "../common_components/ActivityTable";

const styles = {
	buttonStyle: {
		margin: "4px 4px"
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

	async clearCookiesForThisDomain(cache, hostname) {
		const {
			cookieStoreId
		} = this.state.tab;
		const cookies = await browser.cookies.getAll(
			returnOptionalCookieAPIAttributes({
				cache
			}, {
				domain: hostname,
				storeId: cookieStoreId,
				firstPartyDomain: hostname
			})
		);

		if (cookies.length > 0) {
			cookies.forEach((cookie) => browser.cookies.remove(
				returnOptionalCookieAPIAttributes({
					cache
				}, {
					url: prepareCookieDomain(cookie),
					name: cookie.name,
					storeId: cookie.storeId,
					firstPartyDomain: cookie.firstPartyDomain
				})
			)
			);
			return true;
		}
		return false;
	}

	clearLocalstorageForThisDomain(hostname) {
		// Using this method to ensure cross browser compatiblity
		browser.tabs.executeScript({
			code: "window.localStorage.clear();window.sessionStorage.clear();",
			allFrames: true
		});
		return true;
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
			hostname
		].filter(Boolean);
		if (hostname !== "" && !isAnIP(tab.url)) {
			addableHostnames.push(`*.${hostname}`);
		}
		if (Object.keys(tab).length === 0) {
			return ("Loading");
		}
		return (
			<div
				className="container-fluid"
				style={{
					minWidth: `${cache.browserDetect === "Chrome" ? "650px" : ""}`
				}}
			>
				<div
					className="row"
					style={{
						paddingTop: "8px",
						paddingBottom: "8px",
						backgroundColor: "rgba(0, 0, 0, 0.05)",
						borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
						alignItems: "center",
						justifyContent: "center"
					}}
				>

					<IconButton
						iconName="power-off"
						className={settings.activeMode.value ? "btn-success" : "btn-danger"}
						style={styles.buttonStyle}
						onClick={() => onUpdateSetting({
							...settings.activeMode, value: !settings.activeMode.value
						})}
						title={settings.activeMode.value ? browser.i18n.getMessage("disableAutoDeleteText") : browser.i18n.getMessage("enableAutoDeleteText")}
						text={settings.activeMode.value ? browser.i18n.getMessage("autoDeleteEnabledText") : browser.i18n.getMessage("autoDeleteDisabledText")}
					/>

					<IconButton
						iconName="bell"
						className={settings.showNotificationAfterCleanup.value ? "btn-success" : "btn-danger"}
						style={styles.buttonStyle}
						onClick={() => onUpdateSetting({
							...settings.showNotificationAfterCleanup, value: !settings.showNotificationAfterCleanup.value
						})}
						title={browser.i18n.getMessage("toggleNotificationText")}
						text={settings.showNotificationAfterCleanup.value ? browser.i18n.getMessage("notificationEnabledText") : browser.i18n.getMessage("notificationDisabledText")}
					/>

					<div
						className="btn-group"
						ref={(e) => {this.cleanButtonContainerRef = e;}}
						style={{
							margin: "0 4px"
						}}
					>
						<IconButton
							iconName="eraser"
							className="btn-warning"
							onClick={() => {
								onCookieCleanup({
									greyCleanup: false, ignoreOpenTabs: false
								});
								this.animateFlash(this.cleanButtonContainerRef, true);
							}}
							title={browser.i18n.getMessage("cookieCleanupText")}
							text={browser.i18n.getMessage("cleanText")}
						/>

						<div className="dropdown">
							<button
								className="btn btn-warning dropdown-toggle dropdown-toggle-split"
								data-toggle="dropdown"
								data-disabled="true"
								style={{
									transform: "translate3d(-3px, 0px, 0px)"
								}}
							/>
							<div className="dropdown-menu dropdown-menu-right">
								<a
									className="dropdown-item"
									href="#"
									onClick={() => {
										onCookieCleanup({
											greyCleanup: false, ignoreOpenTabs: true
										});
										this.animateFlash(this.cleanButtonContainerRef, true);
									}}
									title={browser.i18n.getMessage("cookieCleanupIgnoreOpenTabsText")}
								>
									{browser.i18n.getMessage("cleanIgnoringOpenTabsText")}
								</a>
								<a
									className="dropdown-item"
									href="#"
									onClick={async () => {
										const success = await this.clearCookiesForThisDomain(cache, hostname);
										this.animateFlash(this.cleanButtonContainerRef, success);
									}}
									title={browser.i18n.getMessage("clearSiteDataForDomainText", ["cookies", hostname])}
								>
									{browser.i18n.getMessage("clearSiteDataText", ["cookies"])}
								</a>
								<a
									className="dropdown-item"
									href="#"
									onClick={async () => {
										const success = await this.clearLocalstorageForThisDomain(hostname);
										this.animateFlash(this.cleanButtonContainerRef, success);
									}}
									title={browser.i18n.getMessage("clearSiteDataForDomainText", ["localstorage", hostname])}
								>
									{browser.i18n.getMessage("clearSiteDataText", ["localstorage"])}
								</a>

							</div>
						</div>
					</div>
					<IconButton
						iconName="cog"
						className="btn-info"
						style={styles.buttonStyle}
						onClick={() => {
							browser.tabs.create({
								url: "/settings/settings.html#tabSettings"
							});
							window.close();
						}}
						title={browser.i18n.getMessage("preferencesText")}
						text={browser.i18n.getMessage("preferencesText")}
					/>

				</div>

				<div
					className="row"
					style={{
						margin: "8px 0",
						alignItems: "center"
					}}
				>
					{tab.favIconUrl &&
						<img
							src={tab.favIconUrl}
							style={{
								height: "20px",
								width: "20px",
								marginRight: "7px",
								verticalAlign: "middle"
							}}
						/>
					}
					<span
						style={{
							fontSize: "20px",
							verticalAlign: "middle",
							marginRight: "8px"
						}}
					>
						{
							// Temporary fix until contextualIdentities events land
						}
						{!contextualIdentities ? `${hostname}` : `${hostname} ${cache[storeId] !== undefined ? `(${cache[storeId]})` : ""}`}
					</span>
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
						<div className="btn-group" style={{
							marginLeft: "8px"
						}}>
							<IconButton
								className="btn-secondary"
								onClick={() => {onNewExpression({
									expression: hostname, listType: "GREY", storeId
								});}}
								iconName="plus"
								title={browser.i18n.getMessage("toGreyListText")}
								text={browser.i18n.getMessage("greyListWordText")}
							/>

							<IconButton
								className="btn-primary"
								onClick={() => {onNewExpression({
									expression: hostname, listType: "WHITE", storeId
								});}}
								iconName="plus"
								title={browser.i18n.getMessage("toWhiteListText")}
								text={browser.i18n.getMessage("whiteListWordText")}
							/>
						</div>
					</div>
				))}

				<div className="row" style={{
					margin: "8px 0"
				}}>
					<FilteredExpression url={hostname} storeId={storeId}/>
				</div>
				<ActivityTable numberToShow={3} decisionFilter={"CLEAN"}/>
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
				updateSetting(newSetting)
			);
		},
		onNewExpression(payload) {
			dispatch(
				addExpressionUI(payload)
			);
		},
		onCookieCleanup(payload) {
			dispatch(
				cookieCleanup(payload)
			);
		}
	});

export default connect(mapStateToProps, mapDispatchToProps)(App);
