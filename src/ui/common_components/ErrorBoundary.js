import {resetSettingsUI} from "../UIActions";
import {connect} from "react-redux";
import React from "react";

class ErrorBoundary extends React.Component {
	state = {
		hasError: false
	};

	componentDidCatch(error, info) {
		// Display fallback UI
		if (error !== "state is undefined") {
			this.setState({
				hasError: true,
				message: `
            ${error.message}
            ${error.stack}
            at line ${error.lineNumber}
            `
			});
		}
	}

	resetButton() {
		this.props.onResetButtonClick();
		this.setState({
			hasError: false
		});
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				<div className="alert alert-danger" role="alert">
					<h4 className="alert-heading">Error!</h4>
					<p>{this.state.message}</p>
					<hr />
					<p className="mb-0">
						<button className="btn btn-danger" onClick={() => this.resetButton()}>
							<span>{browser.i18n.getMessage("defaultSettingsText")}</span>
						</button>
					</p>
				</div>
			);
		}
		return this.props.children;
	}
}

const mapDispatchToProps = (dispatch) => ({
	onResetButtonClick() {
		dispatch(
			resetSettingsUI()
		);
	}
});

export default connect(null, mapDispatchToProps)(ErrorBoundary);
