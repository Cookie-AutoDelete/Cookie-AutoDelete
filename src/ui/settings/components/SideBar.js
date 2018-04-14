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

const styles = {
	menuLink: {
		padding: "0.65em 2em"
	},
	hamburger: {
		transform: "translateX(-14px)",
		color: "white"
	}
};

const sideBarTabs = [
	{
		tabId: "tabWelcome",
		tabText: browser.i18n.getMessage("welcomeText")
	},
	{
		tabId: "tabSettings",
		tabText: browser.i18n.getMessage("settingsText")
	},
	{
		tabId: "tabExpressionList",
		tabText: browser.i18n.getMessage("whiteListText")
	},
	{
		tabId: "tabActivityLog",
		tabText: "ActivityLog"
	},
	{
		tabId: "tabAbout",
		tabText: browser.i18n.getMessage("aboutText")
	}
];

class SideBar extends Component {
	// Switches tabs
	toggleClass(element, className) {
		let classes = element.className.split(/\s+/);
		let i = 0;
		let length = classes.length;

		for (; i < length; i++) {
			if (classes[i] === className) {
				classes.splice(i, 1);
				break;
			}
		}
		// The className is not found
		if (length === classes.length) {
			classes.push(className);
		}

		element.className = classes.join(" ");
	}

	// Toggles the sidebar
	toggleAll() {
		const active = "active";
		const layout = document.getElementById("layout");
		const menu = document.getElementById("menu");
		const menuLink = document.getElementById("menuLink");
		this.toggleClass(layout, active);
		this.toggleClass(menu, active);
		this.toggleClass(menuLink, active);
	}
	render() {
		const {
			activeTab, switchTabs
		} = this.props;
		return (
			<div>

				<span style={styles.menuLink} onClick={() => this.toggleAll()} id="menuLink" className="menu-link">
					<i style={styles.hamburger} className="fa fa-bars fa-3x" aria-hidden="true"></i>
				</span>

				<div id="menu">
					<div className="pure-menu">
						{
							sideBarTabs.map((element, index) => (
								<div
									key={element.tabId}
									id={`${element.tabId}`}
									onClick={() => switchTabs(element.tabId)}
									className={`pure-menu-item ${activeTab === element.tabId ? "pure-menu-selected" : ""}`}
								>
									<span>{`${element.tabText}`}</span>
								</div>
							))

						}

						<div style={{
							position: "absolute", bottom: "5px", width: "100%"
						}}>
							<a href="https://www.paypal.me/mrkennyd/5" className="btn" style={{
								width: "100%", textAlign: "center"
							}}>
								{browser.i18n.getMessage("contributeText")}
							</a>
						</div>

					</div>
				</div>
			</div>
		);
	}
}

export default SideBar;
