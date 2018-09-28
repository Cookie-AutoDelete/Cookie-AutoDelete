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
import {addExpressionUI, cookieCleanupUI, updateSettingUI} from "../UIActions";
import IconButton from "../common_components/IconButton";
import ActivityTable from "../common_components/ActivityTable";
import {validateSettings} from "../../redux/Actions";
import createStore from "../../redux/Store";

const styles = {
	buttonStyle: {
		margin: "4px 4px"
	}
};

var store;

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tab: {},
			storeId: ""
		};
		this.onStartUp();
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

    /**
	 * Method for loading the settings into the form.
	 *
	 * Loads the settings into the form to load settings in the further methods.
	 *
     * @returns {Promise<void>} - A empty Promise if everything went through, and whith the errors inside if not.
     * @since 3.0.0
     * @author Christian Zei
     */
    async onStartUp() {
    	//load the settings from the localStorage
        const storage = await browser.storage.local.get();
        let stateFromStorage;
        //parse it from the storage
        try {
            if (storage.state !== undefined) {
                stateFromStorage = JSON.parse(storage.state);
            } else {
                stateFromStorage = {};
            }
        } catch (err) {
            stateFromStorage = {};
        }
        store = createStore(stateFromStorage);
        store.dispatch(
            validateSettings()
        );
    };

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

    /**
	 * Clears the localStorage for this domain.
	 *
	 * Loads a content script into the page, which clears localStorage and sessionStorage.
	 *
     * @param {string} hostname - The hostname, where the localStorage should be cleared.
     * @returns {boolean} - true if deletion worked fine, false else.
	 * @author Kenny Do, Christian Zei (bugfixes)
     */
	clearLocalstorageForThisDomain(hostname) {
		// Using this method to ensure cross browser compatiblity
        if((this.state.tab.url.split(":")[0].toLowerCase() === "http") ||
            (this.state.tab.url.split(":")[0].toLowerCase() === "https") ) {
            browser.tabs.executeScript({
                code: "window.localStorage.clear();window.sessionStorage.clear();",
                allFrames: true
            });
        }
		return true;
	}

    /**
	 * Clears all browsingData, except cookies.
	 *
	 * Clears all browsingData, except cookies; cookies are cleared by special method from Kenny to ensure compatibility inside the extension.
	 *
     * @returns {Promise<boolean>} - A Promise with true inside when everything worked fine and else with the errors inside.
	 * @since 3.0.0
     * @author Christian Zei
     */
    async clearEvercookies() {
        //try WebSQL if possible (not supported in Firefox)
        try {
            if(getSetting(store.getState(), "ecSQLiteClear")) {
                browser.browsingData.removeWebSQL({"since": 0});
            }
        } catch (e) { }

        //pngData, cacheData, etagData, ...
        browser.browsingData.remove({
            "since": 0
        }, {
            //"appcache": true,				//maybe only works with chrome, we'll see
            "cache": getSetting(store.getState(), "ecCacheClear"),					//unfortunately clears the whole browser cache, but essentially for preventing tracking
            "cookies": false,				//disabled because cleared in a separate method
            "downloads": false,				//not needed
            //"fileSystems": false,			//not needed and only compatible with Chrome --> commented out
            //"formData": false,			//not needed and only compatible with Chrome --> commented out
            "history": getSetting(store.getState(), "ecWebHistoryClear"),			//for clearing Web History storage tracking
            "indexedDB": getSetting(store.getState(), "ecIndexedDBclear"),			//yes we want it
            "localStorage": getSetting(store.getState(), "ecLocalStorageClear"),	//enabled now because we want to clear the whole
            "pluginData": getSetting(store.getState(), "ecLSOdelete"),				//for deleting lso (flash) cookies
            "passwords": false				//not needed
        });

        //changing window.name of all tabs because it is saved here (windowData)
		//also clear sessionStorage
        browser.tabs.query({}).then( (tabs) => {
        	for(let tab of tabs) {
                if((tab.url.split(":")[0].toLowerCase() === "http") ||
                    (tab.url.split(":")[0].toLowerCase() === "https") ) {
                    if (getSetting(store.getState(), "ecWindowNameClear")) {
                        browser.tabs.executeScript(tab.id, {
                            code: "window.name='';",
                            allFrames: true
                        });
                    }
                    if (getSetting(store.getState(), "ecLocalStorageClear")) {
                        browser.tabs.executeScript(tab.id, {
                            code: "sessionStorage.clear();",
                            allFrames: true
                        });
                    }
                }
            }
        });

        return true;
    }

    /**
	 * Clears Evercookies only for one given domain.
	 *
	 * Clears Evercookies for the given domain; clears all browsingData, including cookies.
	 *
     * @param {object} cache - Cached properties from the extension.
     * @param {string} hostname - The hostname from where to clear Evercookies.
     * @returns {Promise<boolean>} - A Promise with true inside when everything worked fine and else with the errors inside.
     * @since 3.0.0
     * @author Christian Zei
     */
	async clearEvercookiesForDomain(cache, hostname) {
        //clearing cookies for that specific host
        if(getSetting(store.getState(), "ecHTTPcookieDelete")) {
            this.clearCookiesForThisDomain(cache, hostname);
        }
        //clearing LocalStorage and SessionStorage for that specific host
        if(getSetting(store.getState(), "ecLocalStorageClear")) {
            this.clearLocalstorageForThisDomain(hostname);
        }
        //try WebSQL if possible (not supported in Firefox)
        try {
        	if(getSetting(store.getState(), "ecSQLiteClear")) {
                browser.browsingData.removeWebSQL({"since": 0});
            }
        } catch (e) { }

        //pngData, cacheData, etagData, ...
        browser.browsingData.remove({
            "since": 0
        }, {
            //"appcache": true,				//maybe only works with chrome, we'll see
            "cache": getSetting(store.getState(), "ecCacheClear"),			//unfortunately clears the whole browser cache, but essentially for preventing tracking
            "cookies": false,				//disabled because cleared in a separate method
            "downloads": false,				//not needed
            //"fileSystems": false,			//not needed and only compatible with Chrome --> commented out
            //"formData": false,			//not needed and only compatible with Chrome --> commented out
            "history": getSetting(store.getState(), "ecWebHistoryClear"),	//for clearing Web History storage tracking
            "indexedDB": getSetting(store.getState(), "ecIndexedDBclear"),	//yes we want it
            "localStorage": false,			//disabled because cleared in a separate method
            "pluginData": getSetting(store.getState(), "ecLSOdelete"),		//for deleting lso (flash) cookies
            "passwords": false				//not needed
        });

        //changing window.name because it is saved here (windowData)
		if(getSetting(store.getState(), "ecWindowNameClear")) {
            if((this.state.tab.url.split(":")[0].toLowerCase() === "http") ||
                (this.state.tab.url.split(":")[0].toLowerCase() === "https") ) {
                browser.tabs.executeScript({
                    code: "window.name=''",
                    allFrames: true
                });
            }
        }

        return true;
	}

    /**
	 * Called to search for Evercookies.
	 *
	 * Called to check for Evercookies on the actual domain and sends a browser notification if one is found.
	 *
     * @returns {Promise<void>} - An empty Promise when everything worked fine and else with the errors inside.
     * @since 3.0.0
     * @author Christian Zei
     */
	async searchEvercookie() {
        const {
            tab, storeId
        } = this.state;

		var trackingNumbers = [],
			trackingObjects = [],
			announced = false; //only announce one time

		var url = tab.url;

		//first get all cookies from the respective URL
		var cookies = browser.cookies.getAll({
			url: url
		});
		cookies.then(logCookies);

		//cache all cookies to compare them later with other browsingData
		function logCookies(cookies) {
			for (let cookie of cookies) {
				//cache e.g. "cookie#cookiename#cookievalue"
				//and "cookie#cookievalue"
				let obj = "cookie" + "#" +cookie.name + "#"+ cookie.value,
					track = "cookie" + "#" + cookie.value;
				if(!trackingNumbers.includes(track)) {
					trackingNumbers.push(track);
				}
				if(!trackingObjects.includes(obj)) {
					trackingObjects.push(obj);
				}

				//call findTracking method to check for tracking
				if(findTracking(track, cookie.value, "cookie") && !announced) {
					announced = true;
                    //if Evercookie found, call the notification
                    notifyEvercookieFound(getHostname(url));
				}
			}
		}

		//send a browser notification if a Evercookie can be found
        function notifyEvercookieFound(host) {
            const notifyMessage = browser.i18n.getMessage("evercookieFoundText") + host;
            browser.notifications.create("EVERCOOKIE_FOUND_NOTIFICATION", {
                "type": "basic",
                "iconUrl": browser.extension.getURL("icons/icon_48.png"),
                "title": browser.i18n.getMessage("evercookieFoundNotificationText"),
                "message": notifyMessage
            });
            const seconds = parseInt(`${getSetting(store.getState(), "notificationOnScreen")}000`, 10);
            setTimeout(() => {
                browser.notifications.clear("EVERCOOKIE_FOUND_NOTIFICATION");
            }, seconds);

        }

        //listen for messages from the content script
        browser.runtime.onMessage.addListener(handleMessage);

		//messages from the content script send the localStorage and the windowName to the popup
		//we cache the localStorage and the windowName and compare them with other browsingData
        function handleMessage(request, sender, sendResponse) {
			if (request.hasOwnProperty('storageType')) {
                //cache e.g. "localStorage#localStorageKey#localStorageValue"
                //and "windowName#windowNameValue"
                var track = request.storageType + "#" + request.item,
                    obj = request.storageType + "#" + request.key + "#" + request.item;


				if(!trackingNumbers.includes(track)) {
					trackingNumbers.push(track);
				}
				if(!trackingObjects.includes(obj)) {
					trackingObjects.push(obj);
				}

                //call findTracking method to check for tracking
				if(findTracking(track, request.item, request.storageType) && !announced) {
					announced = true;
					//if Evercookie found, call the notification
                    notifyEvercookieFound(getHostname(url));
				}
            }
        }

        //compare the trackingCache members with the one which is seached
        function findTracking(track, value, storageType) {
            var toFind1 = "", toFind2 = "";
            switch(storageType) {
                case "windowName":
                	toFind1 =  "localStorage#" + value;
                    toFind2 =  "cookie#" + value;
                    break;
                case "localStorage":
                    toFind1 =  "windowName#" + value;
                    toFind2 =  "cookie#" + value;
                    break;
                case "cookie":
                    toFind1 =  "windowName#" + value;
                    toFind2 =  "localStorage#" + value;
                    break;
                default:
                    break;
            }

            return (trackingNumbers.includes(toFind1) || trackingNumbers.includes(toFind2));
		}

		//content script to ensure browser compatibility (chrome does not know the browser object)
        function initBrowser() {
        	browser.tabs.executeScript({
				code: 	"if (typeof browser === 'undefined') {\n" +
                "			var browser = chrome;\n" +
                "		 }",
                allFrames: true
			});
		}

		//only on HTTP(S) pages (else it would fail)
        if((this.state.tab.url.split(":")[0].toLowerCase() === "http") ||
            (this.state.tab.url.split(":")[0].toLowerCase() === "https") ) {
        	//browser compatibility
            initBrowser();

            //insert the content scripts for sending the localStorage and windowName to the popup
            browser.tabs.executeScript({
                code: "for(var i =0; i < localStorage.length; i++){\n" +
                "			browser.runtime.sendMessage({\n" +
                "				storageType: \"localStorage\",\n" +
                "               item: localStorage.getItem(localStorage.key(i)),\n" +
                "				key: localStorage.key(i)\n" +
                "            });\n" +
                "        }",
                allFrames: true
            });

            browser.tabs.executeScript({
                code: "browser.runtime.sendMessage({\n" +
                    "   			storageType: \"windowName\",\n" +
                    "               item: window.name,\n" +
                    "				key: \"\"\n" +
                    "			 });",
                allFrames: true
            });
        }
	}

    /**
	 * Called to render the popup UI.
	 *
	 * Renders the popup UI and the elements inside.
	 *
     * @author Kenny Do, Christian Zei (the Evercookie part)
     */
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
					minWidth: `${(cache.browserDetect === "Chrome" || cache.browserDetect === "Opera") ? "690px" : ""}`
				}}
			>
				<div
					className="row"
					style={{
						paddingTop: "8px",
						paddingBottom: "8px",
						backgroundColor: "rgba(0, 0, 0, 0.05)",
						borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
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
                                    className="main-dropdown-item"
                                    href="#"
                                    onClick={() => {
                                        onCookieCleanup({
                                            greyCleanup: false, ignoreOpenTabs: false
                                        });
                                        this.animateFlash(this.cleanButtonContainerRef, true);
                                    }}
                                    title={browser.i18n.getMessage("cookieCleanupTitleText")}
                                >
									{browser.i18n.getMessage("cookieCleanupPopupText")}
                                </a>
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

                <div
                    align="center"
				>
                    {browser.i18n.getMessage("ecTrackingAndEverCookieTitleText")}
				</div>

                <div
                    className="row"
                    style={{
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >

                    <IconButton
                        iconName="power-off"
                        className={settings.ecClearOnTabClose.value ? "btn-success" : "btn-danger"}
                        style={styles.buttonStyle}
                        onClick={() => onUpdateSetting({
                            ...settings.ecClearOnTabClose, value: !settings.ecClearOnTabClose.value
                        })}
                        title={settings.ecClearOnTabClose.value ? browser.i18n.getMessage("ecAutoModeDisableText") : browser.i18n.getMessage("ecAutoModeEnableText")}
                        text={settings.ecClearOnTabClose.value ? browser.i18n.getMessage("autoDeleteEnabledText") : browser.i18n.getMessage("autoDeleteDisabledText")}
                    />

                    <IconButton
                        iconName="bell"
                        className={settings.hstsAlarm.value ? "btn-success" : "btn-danger"}
                        style={styles.buttonStyle}
                        onClick={() => onUpdateSetting({
                            ...settings.hstsAlarm, value: !settings.hstsAlarm.value
                        })}
                        title={browser.i18n.getMessage("hstsTrackingButtonText")}
                        text={settings.hstsAlarm.value ? browser.i18n.getMessage("hstsTrackingEnabledText") : browser.i18n.getMessage("hstsTrackingDisabledText")}
                    />

                    <div
                        className="btn-group"
                        ref={(e) => {this.cleanECButtonContainerRef = e;}}
                        style={{
                            margin: "0 4px"
                        }}
                    >
                        <IconButton
                            iconName="eraser"
                            className="btn-warning"
                            onClick={async () => {
                            	//first let us clean all the cookies
                                onCookieCleanup({
                                    greyCleanup: false, ignoreOpenTabs: false
                                });
                                //and then clean the rest
                                const success = this.clearEvercookies();
                                this.animateFlash(this.cleanECButtonContainerRef, success);
                            }}
                            title={browser.i18n.getMessage("evercookieCleanupText")}
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
                                    className="main-dropdown-item"
                                    href="#"
                                    onClick={() => {
                                        //first let us clean all the cookies
                                        onCookieCleanup({
                                            greyCleanup: false, ignoreOpenTabs: false
                                        });
                                        //and then clean the rest
                                        const success = this.clearEvercookies();
                                        this.animateFlash(this.cleanECButtonContainerRef, success);
                                    }}
                                    title={browser.i18n.getMessage("evercookieCleanupText")}
                                >
                                    {browser.i18n.getMessage("evercookieCleanupPopupText")}
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={() => {
                                        //first let us clean all the cookies
                                        onCookieCleanup({
                                            greyCleanup: false, ignoreOpenTabs: true
                                        });
                                        //and then clean the rest
										this.clearEvercookies();
                                        this.animateFlash(this.cleanECButtonContainerRef, true);
                                    }}
                                    title={browser.i18n.getMessage("evercookieCleanupTitleText")}
                                >
                                    {browser.i18n.getMessage("evercookieCleanupTabsText")}
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={async () => {
                                    	const success = await this.clearEvercookiesForDomain(cache, hostname);
                                        this.animateFlash(this.cleanECButtonContainerRef, success);
                                    }}
                                    title={browser.i18n.getMessage("clearSiteDataForDomainText", ["Evercookies", hostname])}
                                >
                                    {browser.i18n.getMessage("clearSiteDataText", ["Evercookies"])}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div
                        className="btn-group"
                        ref={(e) => {this.searchECRef = e;}}
                        style={{
                            margin: "0 4px"
                        }}
                    >
						<IconButton
							iconName="search"
							className="btn-search"
							title={browser.i18n.getMessage("searchECTitleText")}
							text={browser.i18n.getMessage("searchECText")}
							onClick={async () => {
								const success = await this.searchEvercookie();
								this.animateFlash(this.searchECRef, success);
							}}
						/>
                    </div>
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
