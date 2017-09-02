/* eslint no-confusing-arrow: 0*/
import React from "react";
import {connect} from "react-redux";

import ExpressionTableBody from "../../common_components/ExpressionTableBody";

const FilteredExpression = (props) => {
	const {
		expressions, storeId
	} = props;
	return (
		<table className={"table table-striped table-hover table-bordered"}>
			<thead>
				<tr>
					<th></th>
					<th>{"Matched Expression"}</th>
					<th>{"Regular Expression Equivalent"}</th>
					<th>{"ListType"}</th>
				</tr>
			</thead>
			<ExpressionTableBody
				expressions={expressions}
				storeId={storeId}
			/>
		</table>
	);
};

const getExpression = (state, props) => state.lists[props.storeId] === undefined ? [] : state.lists[props.storeId];
const getURL = (state, props) => props.url;
const getMatchedExpressions = (state, props) => {
	const expressions = getExpression(state, props);
	const url = getURL(state, props);
	return expressions.filter((expression) => {
		const regObj = new RegExp(expression.regExp);
		const result = regObj.test(url);
		return result;
	});
};

const mapStateToProps = (state, props) => ({
	expressions: getMatchedExpressions(state, props)
});

export default connect(mapStateToProps)(FilteredExpression);
