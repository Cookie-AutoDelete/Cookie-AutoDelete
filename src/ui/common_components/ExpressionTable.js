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
import {
	removeExpressionUI,
	updateExpressionUI
} from "../UIActions";
import {globExpressionToRegExp} from "../../services/libs";

const styles = {
	actionButton: {
		margin: "0 5px"
	}
};

const IconButton = ({
	iconName, onClick, className, style, title
}) => (
	<button
		className={`btn btn-light ${className || ""}`}
		onClick={onClick}
		style={{ padding: "4px 7px", ...style }}
		title={title}
	>
		<i className={`fa fa-${iconName}`} aria-hidden="true"/>
	</button>
);

const EMPTY_STATE = {
	expressionInput: "",
	editMode: false,
	id: ""
};

class ExpressionTable extends React.Component {
	constructor(props) {
		super(props);
		this.state = EMPTY_STATE;
	}

	startEditing(expression) {
		this.setState({
			expressionInput: expression.expression,
			editMode: true,
			id: expression.id
		});
	}

	clearEdit() {
		this.setState(EMPTY_STATE);
	}

	commitEdit() {
		const original = (this.props.expressions || []).find((expression) => expression.id == this.state.id);
		if (original) {
			this.props.onUpdateExpression({
				...original,
				expression: this.state.expressionInput,
				storeId: this.props.storeId
			});
		}
		this.setState(EMPTY_STATE);
	}

	render() {
		const {
			onRemoveExpression, onUpdateExpression, storeId, expressionColumnTitle
		} = this.props;
		const {
			editMode, id, expressionInput
		} = this.state;
		const expressions = this.props.expressions === undefined ? [] : this.props.expressions;
		return (
			<table className={"table table-striped table-hover table-bordered"}>
				<thead>
					<tr>
						<th/>
						<th>{expressionColumnTitle}</th>
						<th>{browser.i18n.getMessage("regularExpressionEquivalentText")}</th>
						<th>{browser.i18n.getMessage("listTypeText")}</th>
					</tr>
				</thead>
				<tbody className="expressionTable">
					{
						expressions.map((expression) => (
							<tr key={expression.id}>
								<td style={{ textAlign: "center" }} >
									<IconButton
										title={browser.i18n.getMessage("removeExpressionText")}
										iconName="trash-o"
										onClick={() => { onRemoveExpression(expression); }}
									/>
								</td>
								{
									editMode & id === expression.id ?
										<td className="editableExpression">
											<input className="form-control" value={expressionInput} onChange={(e) => this.setState({
												expressionInput: e.target.value
											})} type="text" style={{ display: "inline-block", verticalAlign: "middle", margin: 0, width: "calc(100% - 70px)" }} />
											<IconButton
												title={browser.i18n.getMessage("stopEditingText")}
												iconName="ban"
												style={{ marginLeft: "5px", float: "right" }}
												onClick={() => { this.clearEdit(); }}
											/>
											<IconButton
												title={browser.i18n.getMessage("saveExpressionText")}
												iconName="floppy-o"
												style={{ marginLeft: "5px", float: "right" }}
												onClick={() => { this.commitEdit(); }}
											/>
										</td> :
										<td>
											<div style={{ display: "inline-block", verticalAlign: "middle" }}>
												{`${expression.expression}`}
											</div>
											<IconButton
												title={browser.i18n.getMessage("editExpressionText")}
												iconName="pencil"
												className="showOnRowHover"
												style={{ marginLeft: "5px", float: "right" }}
												onClick={() => { this.startEditing(expression); }}
											/>
										</td>
								}
								<td>
									<div style={{ verticalAlign: "middle" }}>
										{editMode && id == expression.id ?
											globExpressionToRegExp(expressionInput) :
											globExpressionToRegExp(expression.expression)}
									</div>
								</td>
								<td>
									<div style={{ display: "inline-block", verticalAlign: "middle" }}>
										{`${expression.listType === "WHITE" ?
											browser.i18n.getMessage("whiteListWordText") :
											browser.i18n.getMessage("greyListWordText")}`}
									</div>
									<IconButton
										title={`${expression.listType === "WHITE" ?
											browser.i18n.getMessage("toggleToGreyListWordText") :
											browser.i18n.getMessage("toggleToWhiteListWordText")}`}
										iconName="refresh"
										className="showOnRowHover"
										style={{ marginLeft: "5px", float: "right" }}
										onClick={() => onUpdateExpression({
											id: expression.id,
											storeId,
											listType: expression.listType === "GREY" ? "WHITE" : "GREY"
										})}
									/>
								</td>
							</tr>
						))
					}
				</tbody>
			</table>
		);
	}
}

const mapDispatchToProps = (dispatch) => ({
	onRemoveExpression(payload) {
		dispatch(
			removeExpressionUI(payload)
		);
	},
	onUpdateExpression(payload) {
		dispatch(
			updateExpressionUI(payload)
		);
	}
});
export default connect(null, mapDispatchToProps)(ExpressionTable);
