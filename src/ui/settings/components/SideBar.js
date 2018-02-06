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
		tabId: "tabAbout",
		tabText: browser.i18n.getMessage("aboutText")
	}
];

class SideBar extends Component {
	// Toggles the sidebar
	toggleAll() {
		document.getElementById("layout").classList.toggle("active");
		this.node.querySelector("#menu").classList.toggle("active");
		this.node.querySelector("#menuLink").classList.toggle("active");
	}
	render() {
		const {
			activeTab, switchTabs
		} = this.props;
		return (
			<div ref={(node) => {this.node = node;}}>

				<button style={styles.menuLink} onClick={() => this.toggleAll()} id="menuLink" className="menu-link" aria-label={browser.i18n.getMessage("toggleMenuLabel")}>
					<i style={styles.hamburger} className="fa fa-bars fa-3x" role="presentation"></i>
				</button>

				<nav id="menu">
					<div className="pure-menu" role="tablist">
						{
							sideBarTabs.map((element, index) => (
								<a
									key={element.tabId}
									id={`${element.tabId}`}
									onClick={() => switchTabs(element.tabId)}
									href="#"
									role="tab"
									aria-selected={activeTab === element.tabId}
									className={`pure-menu-item ${activeTab === element.tabId ? "pure-menu-selected" : ""}`}
								>
									<span>{`${element.tabText}`}</span>
								</a>
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
				</nav>
			</div>
		);
	}
}

export default SideBar;
