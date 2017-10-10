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
import React from "react";
import {connect} from "react-redux";
import {getSetting} from "../../../services/libs";
import ExpressionTable from "../../common_components/ExpressionTable";
import IconButton from "../../common_components/IconButton";
import {
	addExpressionUI
} from "../../UIActions";

const styles = {
	buttonMargins: {
		margin: "5px"
	},
	tableContainer: {
		overflow: "auto",
		height: `${window.innerHeight - 210}px`
	},
	buttonIcon: {
		marginRight: "7px"
	}
};

class Expressions extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expressionInput: "",
			error: "",
			storeId: "default",
			contextualIdentitiesObjects: []
		};
	}

	// Import the expressions into the list
	importExpressions(files) {
		const {
			onNewExpression
		} = this.props;
		let reader = new FileReader();
		reader.onload = (file) => {
			try {
				const newExpressions = JSON.parse(file.target.result);
				const storeIds = Object.keys(newExpressions);
				storeIds.forEach((storeId) => newExpressions[storeId].forEach((expression) => onNewExpression(expression)));
			} catch (error) {
				this.setState({
					error: error.toString()
				});
			}
		};

		reader.readAsText(files[0]);
	}

	// Add the expression using the + button or the Enter key
	addExpressionByInput(payload) {
		const {
			onNewExpression
		} = this.props;
		onNewExpression(payload);
		this.setState({
			expressionInput: ""
		});
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.contextualIdentities === false) {
			this.changeStoreIdTab("default");
		}
	}

	// Change the id of the storeId for the container tabs
	changeStoreIdTab(storeId) {
		this.setState({
			storeId
		});
	}

	async componentDidMount() {
		if (this.props.contextualIdentities) {
			const contextualIdentitiesObjects = await browser.contextualIdentities.query({});
			this.setState({
				contextualIdentitiesObjects
			});
		}
	}

	render() {
		const {
			style,
			lists,
			contextualIdentities
		} = this.props;
		const {
			error, contextualIdentitiesObjects, storeId
		} = this.state;
		return (
			<div style={style}>
				<h1>{browser.i18n.getMessage("whiteListText")}</h1>

				<div className="row md-form">
					<input
						style={{
							display: "inline", width: "100%"
						}}
						value={this.state.expressionInput}
						onChange={(e) => this.setState({
							expressionInput: e.target.value
						})}
						placeholder={browser.i18n.getMessage("domainPlaceholderText")}
						onKeyPress={(e) => {
							if (e.key === "Enter") {
								this.addExpressionByInput({
									expression: this.state.expressionInput,
									storeId,
									listType: "WHITE"
								});
							}
						}}
						type="text"
						id="formText"
						className="form-control"
					/>
				</div>

				<div className="row">
					<span className="pull-left">
						<a href={`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(this.props.lists, null, "  "))}`} download="Cookie_AutoDelete_2.X.X_Expressions.json">

							<button style={styles.buttonMargins} className="btn btn-primary">
								<i style={styles.buttonIcon} className="fa fa-download" aria-hidden="true"></i>
								<span>{browser.i18n.getMessage("exportURLSText")}</span>
							</button>
						</a>

						<label style={styles.buttonMargins} className="btn btn-info">
							<i style={styles.buttonIcon} className="fa fa-upload" aria-hidden="true"></i>

							<input onChange={(e) => this.importExpressions(e.target.files)} type="file" />
							{browser.i18n.getMessage("importURLSText")}
						</label>
					</span>

					<div className="btn-group pull-right" style={{
						padding: "7.5px 5px"
					}}>
						<IconButton
							className="btn-secondary"
							onClick={() => {this.addExpressionByInput({
								expression: this.state.expressionInput,
								storeId,
								listType: "GREY"
							});}}
							iconName="plus"
							title={browser.i18n.getMessage("toGreyListText")}
						>
							{browser.i18n.getMessage("greyListWordText")}
						</IconButton>

						<IconButton
							className="btn-primary"
							onClick={() => {this.addExpressionByInput({
								expression: this.state.expressionInput,
								storeId,
								listType: "WHITE"
							});}}
							iconName="plus"
							title={browser.i18n.getMessage("toWhiteListText")}
						>
							{browser.i18n.getMessage("whiteListWordText")}
						</IconButton>
					</div>

				</div>

				{
					error !== "" ?
						<div onClick={() => this.setState({
							error: ""
						})} className="row alert alert-danger">
							{error}
						</div> : ""
				}
				{
					contextualIdentities ?
						<ul className="row nav nav-tabs">
							<li onClick={() => this.changeStoreIdTab("default")} className={`${storeId === "default" ? "active" : ""}`}><a href="#tabExpressionList">Default</a></li>
							{
								contextualIdentitiesObjects.map((element) =>
									<li key={`navTab-${element.cookieStoreId}`} onClick={() => this.changeStoreIdTab(element.cookieStoreId)} className={`${storeId === element.cookieStoreId ? "active" : ""}`}><a href="#tabExpressionList">{element.name}</a></li>
								)
							}
						</ul> : ""
				}

				<div className="row" style={styles.tableContainer}>
					<ExpressionTable
						expressionColumnTitle={browser.i18n.getMessage("domainExpressionsText")}
						expressions={lists[storeId]}
						storeId={storeId}
						emptyElement={(
							<span>No expressions defined.</span>
						)}
					/>
				</div>

			</div>

		);
	}
}

const mapStateToProps = (state) => {
	const {
		lists
	} = state;
	return {
		lists, contextualIdentities: getSetting(state, "contextualIdentities")
	};
};

const mapDispatchToProps = (dispatch) => ({
	onNewExpression(payload) {
		dispatch(
			addExpressionUI(payload)
		);
	}
});

export default connect(mapStateToProps, mapDispatchToProps)(Expressions);
