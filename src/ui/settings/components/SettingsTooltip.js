import React from "react";

const SettingsTooltip = ({text}) => (
	<span className="tooltipCustom">?
		<span id="enterURLTooltipText" className="tooltiptext">{text}</span>
	</span>
);


export default SettingsTooltip;
