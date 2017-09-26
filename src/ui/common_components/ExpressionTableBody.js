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

const ActionButtonColumn = ({
	editId, onRemoveExpression, onUpdateExpression, editMode, setEdit, expressionObject, expressionInput, storeId
}) => (
	<td style={{
		width: "60px"
	}}>
		<i onClick={() => onRemoveExpression({
			id: expressionObject.id, storeId
		})} style={styles.actionButton} className="fa fa-times fa-2x cursorPoint" aria-hidden="true"></i>
		{
			editMode && expressionObject.id === editId ? <i onClick={() => setEdit({
				editMode: false, id: expressionObject.id, expressionInput: expressionObject.expression
			})} style={styles.actionButton} className="fa fa-eraser fa-2x  cursorPoint" aria-hidden="true"></i> :
				<i onClick={() => setEdit({
					editMode: true, id: expressionObject.id, expressionInput: expressionObject.expression
				})} style={styles.actionButton} className="fa fa-pencil-square-o fa-2x  cursorPoint" aria-hidden="true"></i>

		}
		{
			editMode && expressionObject.id === editId ?
				<i
					onClick={() => {
						setEdit({
							editMode: false
						});
						onUpdateExpression({
							...expressionObject, expression: expressionInput, storeId
						});
					}}
					style={styles.actionButton}
					className="fa fa-floppy-o fa-2x cursorPoint"
					aria-hidden="true"
				>
				</i> : ""
		}

	</td>
);

class ExpressionTableBody extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expressionInput: "",
			editMode: false,
			id: ""
		};
	}

	// Toggle edit for a particular row
	setEdit(editModeObject) {
		this.setState(editModeObject);
	}

	render() {
		const {
			onRemoveExpression, onUpdateExpression, storeId
		} = this.props;
		const {
			editMode, id, expressionInput
		} = this.state;
		const expressions = this.props.expressions === undefined ? [] : this.props.expressions;
		return (
			<tbody>
				{
					expressions.map((expression) => (
						<tr key={expression.id}>
							<ActionButtonColumn
								editMode={this.state.editMode}
								expressionObject={expression}
								expressionInput={expressionInput}
								editId={id}
								storeId={storeId}
								onRemoveExpression={(payload) => onRemoveExpression(payload)}
								onUpdateExpression={(payload) => onUpdateExpression(payload)}
								setEdit={(editModeObject) => this.setEdit(editModeObject)}
							/>
							{
								editMode & id === expression.id ?
									<div className="md-form">
										<input id="form1" className="form-control" value={expressionInput} onChange={(e) => this.setState({
											expressionInput: e.target.value
										})} type="text" />
									</div> :
									<td>{`${expression.expression}`}</td>
							}
							<td>{`${globExpressionToRegExp(expression.expression)}`}</td>
							<td>
								{
									editMode & id === expression.id ?
										<button onClick={() => onUpdateExpression({
											id, storeId, listType: expression.listType === "GREY" ? "WHITE" : "GREY"
										})} className="btn btn-primary">
											{`${expression.listType === "WHITE" ? browser.i18n.getMessage("whiteListWordText") : browser.i18n.getMessage("greyListWordText")}`}
										</button> :
										`${expression.listType === "WHITE" ? browser.i18n.getMessage("whiteListWordText") : browser.i18n.getMessage("greyListWordText")}`
								}
							</td>
						</tr>
					))
				}
			</tbody>
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
export default connect(null, mapDispatchToProps)(ExpressionTableBody);
