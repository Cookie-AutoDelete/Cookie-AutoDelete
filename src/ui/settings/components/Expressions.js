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
import ExpressionTableBody from "../../common_components/ExpressionTableBody";
import {
	addExpressionUI
} from "../../UIActions";

const styles = {
	buttonMargins: {
		margin: "5px"
	},
	tableContainer: {
		overflow: "auto",
		height: "55em"
	},
	buttonIcon: {
		marginRight: "2px"
	}
};

class Expressions extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expressionInput: "",
			error: "",
			storeId: "default",
			contextualIdentitiesObjects: [],
			listType: "WHITE"
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

	// Switch the list type for adding a expression
	switchListType() {
		this.setState({
			listType: this.state.listType === "WHITE" ? "GREY" : "WHITE"
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
			error, contextualIdentitiesObjects, storeId, listType
		} = this.state;
		return (
			<div style={style}>
				<h1>{browser.i18n.getMessage("whiteListText")}</h1>

				<div className="row md-form">
					<label htmlFor="form1" className="">{`${browser.i18n.getMessage("enterDomainText")}:`}</label>
					<input
						style={{
							display: "inline", width: "100%"
						}}
						value={this.state.expressionInput}
						onChange={(e) => this.setState({
							expressionInput: e.target.value
						})}
						onKeyPress={(e) => {
							if (e.key === "Enter") {
								this.addExpressionByInput({
									expression: this.state.expressionInput, storeId, listType
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
								<span>Export Expressions</span>
							</button>
						</a>

						<label style={styles.buttonMargins} className="btn btn-info">
							<i style={styles.buttonIcon} className="fa fa-upload" aria-hidden="true"></i>

							<input onChange={(e) => this.importExpressions(e.target.files)} type="file" />
							Import Expressions
						</label>
					</span>

					<span style={{
						padding: "5px 5px"
					}} className="pull-right">
						<button onClick={() => this.switchListType()} className="btn btn-info">
							{`${listType === "WHITE" ? browser.i18n.getMessage("toWhiteListText") : browser.i18n.getMessage("toGreyListText")}`}
						</button>

						<button style={{
							marginLeft: "5px"
						}} className="btn btn-primary" onClick={() => this.addExpressionByInput({
							expression: this.state.expressionInput, storeId, listType
						})}>
							<i className="fa fa-plus-square" aria-hidden="true"></i>
						</button>
					</span>
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
					<table className={"table table-striped table-hover table-bordered"}>
						<thead>
							<tr>
								<th></th>
								<th>{browser.i18n.getMessage("domainExpressionsText")}</th>
								<th>{browser.i18n.getMessage("regularExpressionEquivalentText")}</th>
								<th>{browser.i18n.getMessage("listTypeText")}</th>
							</tr>
						</thead>
						<ExpressionTableBody
							expressions={lists[storeId]}
							storeId={storeId}
						/>
					</table>
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
