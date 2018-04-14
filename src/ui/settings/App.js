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
import SideBar from "./components/SideBar";
import Welcome from "./components/Welcome";
import Settings from "./components/Settings";
import Expressions from "./components/Expressions";
import About from "./components/About";
import ActivityLog from "./components/ActivityLog";

class App extends Component {
		state = {
			activeTab: "tabWelcome",
			tabId: 0,
			settingsURL: ""
		}

		// Gets the url hash and switches to that sidebar tab
		async componentDidMount() {
			const tab = await browser.tabs.getCurrent();
			const tabURL = new URL(tab.url);
			this.setState({
				activeTab: tabURL.hash !== "" || undefined ? tabURL.hash.substring(1) : "tabWelcome",
				tabId: tab.id,
				settingsURL: tab.url
			});
		}

		// Switch tabs and appends the hash of the tab name in the url
		switchTabs(newActiveTab) {
			this.setState({
				activeTab: newActiveTab
			});
			let newUrl = new URL(this.state.settingsURL);
			newUrl.hash = newActiveTab;
			browser.tabs.update(this.state.tabId, {
				url: newUrl.href
			});
		}

		render() {
			const {
				activeTab
			} = this.state;
			return (
				<div id="layout">
					<SideBar switchTabs={(tab) => this.switchTabs(tab)} activeTab={activeTab}/>
					<div className="container">
						{
							activeTab === "tabWelcome" ? <Welcome /> : ""
						}
						{
							activeTab === "tabSettings" ? <Settings /> : ""
						}
						{
							activeTab === "tabExpressionList" ? <Expressions /> : ""
						}
						{
							activeTab === "tabActivityLog" ? <ActivityLog /> : ""
						}
						{
							activeTab === "tabAbout" ? <About /> : ""
						}
					</div>
				</div>
			);
		}
}

export default App;
