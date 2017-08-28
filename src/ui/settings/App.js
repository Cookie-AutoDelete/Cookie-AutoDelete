import React, {Component} from "react";
import SideBar from "./components/SideBar";
import Welcome from "./components/Welcome";
import Settings from "./components/Settings";
import Expressions from "./components/Expressions";
import About from "./components/About";

class App extends Component {
		state = {activeTab: "tabWelcome"}

		switchTabs(newActiveTab) {
			this.setState({activeTab: newActiveTab});
		}

		render() {
			const {activeTab} = this.state;
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
							activeTab === "tabAbout" ? <About /> : ""
						}
					</div>
				</div>
			);
		}
}

export default App;
