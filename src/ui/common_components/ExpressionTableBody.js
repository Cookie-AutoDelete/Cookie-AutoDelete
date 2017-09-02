import React from "react";
import {connect} from "react-redux";
import {
	removeExpressionUI,
	updateExpressionUI
} from "../UIActions";

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
							<td>{`${expression.regExp}`}</td>
							<td>
								{
									editMode & id === expression.id ?
										<button onClick={() => onUpdateExpression({
											id, storeId, listType: expression.listType === "GREY" ? "WHITE" : "GREY"
										})} className="btn btn-primary">
											{`${expression.listType}`}
										</button> :
										`${expression.listType}`
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
