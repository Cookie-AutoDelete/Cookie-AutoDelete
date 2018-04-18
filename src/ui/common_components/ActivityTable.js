import React from "react";
import {connect} from "react-redux";
const ActivityTable = (props) => {
	const {
		activityLog,
		cache
	} = props;
	if (props.activityLog.length === 0) {
		return (
			<div className="alert alert-primary" role="alert">
				<i>{browser.i18n.getMessage("nothingHereText")}</i>
			</div>
		);
	}
	return (
		<div className="accordion" id="accordion">
			{
				activityLog.map((element, index) => (
					<div key={index} className="card">
						<div className="card-header" id={`heading${index}`}>
							<h5 className="mb-0">
								<button className="btn btn-link collapsed" type="button" data-toggle="collapse" data-target={`#collapse${index}`} aria-expanded="false" aria-controls={`collapse${index}`}>
									{new Date(element.dateTime).toLocaleString()}
									<br />
									{`${browser.i18n.getMessage("recentlyCleanedText")}: ${element.recentlyCleaned}`}
								</button>
							</h5>
						</div>
						<div id={`collapse${index}`} className="collapse" aria-labelledby={`heading${index}`} data-parent="#accordion">
							<div className="card-body">
								{
									Object.keys(element).map((key) => {
										if (key !== "dateTime" || key !== "recentlyCleaned") {
											return (
												<div>
													<h6>
														{cache[key]}
													</h6>
													{
														Object.keys(element[key]).sort((a, b) => a.localeCompare(b)).map((keyDomain) => (
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
