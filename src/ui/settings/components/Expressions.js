import React from "react";
import {connect} from "react-redux";
import Tooltip from "./SettingsTooltip";
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
			contextualIdentitiesObjects: []
		};
	}

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
				<h1>List of Expressions</h1>

				<div className="md-form">
					<label htmlFor="form1" className="">Enter Expression:</label>
					<input
						style={{
							display: "inline", width: "93%"
						}}
						value={this.state.expressionInput}
						onChange={(e) => this.setState({
							expressionInput: e.target.value
						})}
						onKeyPress={(e) => {
							if (e.key === "Enter") {
								this.addExpressionByInput({
									expression: this.state.expressionInput, storeId
								});
							}
						}}
						type="text"
						id="formText"
						className="form-control"
					/>

					<button className="btn btn-primary" onClick={() => this.addExpressionByInput({
						expression: this.state.expressionInput, storeId
					})}>
						<i className="fa fa-plus-square" aria-hidden="true"></i>
					</button>
					<Tooltip
						text={"Enter expressions without the 'www.' part. You can use the wildcard *. For example, git*b.com* will match github.com and gitlab.com. It also works with paths as well."}
					/>
				</div>

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

				{
					error !== "" ?
						<div onClick={() => this.setState({
							error: ""
						})} className="alert alert-danger">
							{error}
						</div> : ""
				}
				{
					contextualIdentities ?
						<ul className="nav nav-tabs">
							<li onClick={() => this.changeStoreIdTab("default")} className={`${storeId === "default" ? "active" : ""}`}><a href="#">Default</a></li>
							{
								contextualIdentitiesObjects.map((element) =>
									<li key={`navTab-${element.cookieStoreId}`} onClick={() => this.changeStoreIdTab(element.cookieStoreId)} className={`${storeId === element.cookieStoreId ? "active" : ""}`}><a href="#">{element.name}</a></li>
								)
							}
						</ul> : ""
				}

				<div style={styles.tableContainer}>
					<table className={"table table-striped table-hover table-bordered"}>
						<thead>
							<tr>
								<th></th>
								<th>{"Expression"}</th>
								<th>{"Regular Expression Equivalent"}</th>
								<th>{"ListType"}</th>
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
