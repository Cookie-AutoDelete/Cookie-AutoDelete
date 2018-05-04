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
import ActivityTable from "../../common_components/ActivityTable";
import {resetCookieDeletedCounterUI} from "../../UIActions";
import {FILTER_OPTIONS} from "../../../redux/Constants";

class ActivityLog extends React.Component {
	state = {
		decisionFilter: FILTER_OPTIONS.NONE
	}
	setNewFilter(filter) {
		this.setState({
			decisionFilter: filter
		});
	}
	render() {
		const {
			style,
			onResetCounterButtonClick
		} = this.props;
		const {
			decisionFilter
		} = this.state;
		return (
			<div style={style}>
				<h1>{browser.i18n.getMessage("cleanupLogText")}</h1>
				<div
					style={{
						display: "flex", justifyContent: "space-between", marginBottom: "10px"
					}}
				>
					<div
						style={{
							marginTop: "5px"
						}}
					>
						<span>{`${browser.i18n.getMessage("filterText")}: `}</span>
						<div className="form-check form-check-inline">
							<input className="form-check-input" type="radio" name="filterRadios" id="filterRadios1" value="option1" checked={decisionFilter === FILTER_OPTIONS.NONE}
								onClick={() => this.setNewFilter(FILTER_OPTIONS.NONE)} />
							<label className="form-check-label" htmlFor="filterRadios1">
								{browser.i18n.getMessage("noneText")}
							</label>
						</div>
						<div className="form-check form-check-inline">
							<input className="form-check-input" type="radio" name="filterRadios" id="filterRadios2" value="option2" checked={decisionFilter === FILTER_OPTIONS.CLEAN}
								onClick={() => this.setNewFilter(FILTER_OPTIONS.CLEAN)} />
							<label className="form-check-label" htmlFor="filterRadios2">
								{browser.i18n.getMessage("cleanText")}
							</label>
						</div>
						<div className="form-check form-check-inline">
							<input className="form-check-input" type="radio" name="filterRadios" id="filterRadios3" value="option3" checked={decisionFilter === FILTER_OPTIONS.KEEP}
								onClick={() => this.setNewFilter(FILTER_OPTIONS.KEEP)} />
							<label className="form-check-label" htmlFor="filterRadios3">
								{browser.i18n.getMessage("keepText")}
							</label>
						</div>
					</div>
					<button onClick={() => onResetCounterButtonClick()} className="btn btn-warning" id="resetCounter">
						<span>{browser.i18n.getMessage("clearLogsText")}</span>
					</button>
				</div>
				<ActivityTable decisionFilter={this.state.decisionFilter}/>
			</div>
		);
	}
}

const mapDispatchToProps = (dispatch) => ({
	onResetCounterButtonClick() {
		dispatch(
			resetCookieDeletedCounterUI()
		);
	}
});

export default connect(null, mapDispatchToProps)(ActivityLog);
