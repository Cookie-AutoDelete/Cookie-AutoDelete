import React from "react";

const RowAction = ({
	labelFor, text, action
}) => (
	<div className="row">
		<label id={labelFor} style={{
			width: `${window.innerWidth}px`, marginBotton: "initial"
		}} onClick={action}>
			<span className="userAction">{text}</span>
		</label>
	</div>
);

export default RowAction;
