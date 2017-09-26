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
/* eslint no-confusing-arrow: 0*/
import React from "react";
import {connect} from "react-redux";

import {globExpressionToRegExp} from "../../../services/libs";
import ExpressionTableBody from "../../common_components/ExpressionTableBody";

const FilteredExpression = (props) => {
	const {
		expressions, storeId
	} = props;
	return (
		<table className={"table table-striped table-hover table-bordered"}>
			<thead>
				<tr>
					<th>{browser.i18n.getMessage("matchedDomainExpressionText")}</th>
					<th>{browser.i18n.getMessage("regularExpressionEquivalentText")}</th>
					<th>{browser.i18n.getMessage("listTypeText")}</th>
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

// Filter the expression list from the current url
const getMatchedExpressions = (state, props) => {
	const expressions = getExpression(state, props);
	const url = getURL(state, props);
	return expressions.filter((expression) => {
		const regObj = globExpressionToRegExp(expression.expression);
		const result = regObj.test(url);
		return result;
	});
};

const mapStateToProps = (state, props) => ({
	expressions: getMatchedExpressions(state, props)
});

export default connect(mapStateToProps)(FilteredExpression);
