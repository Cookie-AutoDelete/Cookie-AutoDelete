import App from "./App";
import {Provider} from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import {createUIStore} from "redux-webext";

async function initApp() {
	const store = await createUIStore();
	const mountNode = document.createElement("div");
	document.body.appendChild(mountNode);

	ReactDOM.render(
		<Provider store={store}>
			<App/>
		</Provider>,
		mountNode
	);
}

initApp();
