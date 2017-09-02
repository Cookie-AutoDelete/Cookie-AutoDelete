// Returns the host name of the url. Etc. "https://en.wikipedia.org/wiki/Cat" becomes en.wikipedia.org
export const getHostname = (urlToGetHostName) => {
	let hostname;
	try {
		hostname = new URL(urlToGetHostName).hostname;
		// Strip "www." if the URL starts with it.
		hostname = hostname.replace(/^www[a-z0-9]?\./, "");
	} catch (error) {
		return "";
	}
	return hostname;
};

// Returns true if it is a webpage
export const isAWebpage = (URL) => {
	if (URL.match(/^http:/) || URL.match(/^https:/)) {
		return true;
	}
	return false;
};

export const spliceWWW = (url) => {
	let newURL;
	try {
		let urlObject = new URL(url);
		newURL = `${urlObject.hostname}${urlObject.pathname}`;
		// Strip "www." if the URL starts with it.
		newURL = newURL.replace(/^www[a-z0-9]?\./, "");
	} catch (error) {
		return "";
	}
	return newURL;
};

// extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
export const extractMainDomain = (domain) => {
	if (domain === "") {
		return "";
	}
	// Return the domain if it is an ip address
	let reIP = new RegExp("[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+");
	if (reIP.test(domain)) {
		return domain;
	}
	// Delete a '.' if domain contains it at the end
	let editedDomain = domain;
	if (editedDomain.charAt(editedDomain.length - 1) === ".") {
		editedDomain = domain.slice(0, domain.length - 1);
	}
	let re = new RegExp("[a-z0-9|-]+\.[a-z0-9|-]+$");
	return re.exec(editedDomain)[0];
};

export const getSetting = (state, settingName) => state.settings[settingName].value;

// Puts the domain in the right format for browser.cookies.clean()
export const prepareCookieDomain = (cookie) => {
	let cookieDomain = cookie.domain;
	if (cookieDomain.charAt(0) === ".") {
		cookieDomain = cookieDomain.slice(1);
	}
	cookieDomain = cookie.secure ? `https://${cookieDomain}${cookie.path}` : `http://${cookieDomain}${cookie.path}`;
	return cookieDomain;
};

export const returnMatchedExpressionObject = (state, cookieStoreId, hostname) => {
	const storeId = !getSetting(state, "contextualIdentities") || cookieStoreId === "firefox-default" ? "default" : cookieStoreId;
	return state.lists[storeId].find((expression) => {
		const regExpObj = new RegExp(expression.regExp);
		return regExpObj.test(hostname);
	});
}
