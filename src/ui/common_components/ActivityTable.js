import React from "react";
import {connect} from "react-redux";
import {FILTER_OPTIONS} from "../../redux/Constants";

const createSummary = (cleanupObj) => {
	const keys = Object.keys(cleanupObj);
	let domainSet = new Set();
	keys.forEach((key) => {
		if (key !== "dateTime" && key !== "recentlyCleaned") {
			Object.keys(cleanupObj[key]).forEach((domain) => {
				if (cleanupObj[key][domain].decision) {
					domainSet.add(domain);
				}
			});
		}
	});
	return Array.from(domainSet).join(", ");
};

const ActivityTable = (props) => {
	const {
		activityLog,
		cache,
		numberToShow,
		decisionFilter
	} = props;
	if (props.activityLog.length === 0) {
		return (
			<div className="alert alert-primary" role="alert">
				<i>{browser.i18n.getMessage("noCleanupLogText")}</i>
			</div>
		);
	}
	const filtered = activityLog.slice(0, numberToShow);
	return (
		<div className="accordion" id="accordion"
			style={{
				marginBottom: "10px"
			}}
		>
			{
				filtered.map((element, index) => (
					<div key={index} className="card">
						<div className="card-header" id={`heading${index}`}>
							<h5 className="mb-0" style={{
								overflowX: "hidden"
							}}
							>
								<button className="btn btn-link collapsed" type="button" data-toggle="collapse" data-target={`#collapse${index}`} aria-expanded="false" aria-controls={`collapse${index}`}>

									{`${new Date(element.dateTime).toLocaleString()} - ${browser.i18n.getMessage("notificationContent", [element.recentlyCleaned, createSummary(element)])}`}
								</button>
							</h5>
						</div>
						<div id={`collapse${index}`} className="collapse" aria-labelledby={`heading${index}`} data-parent="#accordion">
							<div className="card-body">
								{
									Object.keys(element).map((key) => {
										if (key !== "dateTime" && key !== "recentlyCleaned") {
											return (
												<div>
													<h6>
														{cache[key]}
													</h6>
													{
														Object.keys(element[key]).sort((a, b) => a.localeCompare(b)).filter((site) => {
															if (FILTER_OPTIONS.KEEP === decisionFilter) {
																return element[key][site].decision === false;
															}
															if (FILTER_OPTIONS.CLEAN === decisionFilter) {
																return element[key][site].decision === true;
															}
															return true;
														})
															.map((keyDomain) => (
																<div
																	style={{
																		marginLeft: "10px"
																	}}
																	className={`alert alert-${(element[key][keyDomain].decision ? "danger" : "success")}`} key={`${element.dateTime}${key}${keyDomain}`}
																	role="alert"
																>
																	{`${keyDomain}: ${element[key][keyDomain].reason}`}
																</div>

															))
													}
												</div>
											);
										}
										return ("");
									})
								}
							</div>
						</div>
					</div>
				))
			}
		</div>
	);
};

ActivityTable.defaultProps = {
	numberToShow: 10,
	decisionFilter: FILTER_OPTIONS.KEEP
};

const mapStateToProps = (state) => {
	const {
		activityLog,
		cache
	} = state;
	return {
		activityLog,
		cache
	};
};

export default connect(mapStateToProps)(ActivityTable);
