import React from "react";

export default class IconButton extends React.Component {
	render() {
		const {
			iconName, className, style, text
		} = this.props;

		return (
			<button
				{...{
					...this.props, iconName: undefined, text: undefined
				}}
				className={`btn ${className || ""}`}
				style={{
					padding: "4px 7px", ...style
				}}
			>
				<i className={`fa fa-${iconName}`} aria-hidden="true" style={text ? {
					marginRight: "5px"
				} : null}/>
				{text}
			</button>
		);
	}
}
