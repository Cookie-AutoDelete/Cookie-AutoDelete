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
	if (URL === undefined) {
		return false;
	}
	if (URL.match(/^http:/) || URL.match(/^https:/)) {
		return true;
	}
	return false;
};

// Returns true if it is a IP
export const isAnIP = (URL) => {
	const hostname = getHostname(URL);
	let reIP = new RegExp("[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+");
	if (reIP.test(hostname)) {
		return true;
	}
	return false;
};

// extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
export const extractMainDomain = (domain) => {
	const secondLvlDomains = {
		"biz": true,
		"com": true,
		"edu": true,
		"gov": true,
		"ltd": true,
		"net": true,
		"mod": true,
		"org": true,
		"police": true,
		"school": true
	};
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
	const partsOfDomain = editedDomain.split(".");
	const length = partsOfDomain.length;
	if (length === 1) {
		return partsOfDomain[0];
	}
	const firstPartOfTopLevel = partsOfDomain[length - 2];

	// Check for country top level domain
	if (
		length > 2 &&
		(partsOfDomain[length - 2].length === 2 || secondLvlDomains[firstPartOfTopLevel]) &&
		partsOfDomain[length - 1].length === 2) {
		return `${partsOfDomain[length - 3]}.${partsOfDomain[length - 2]}.${partsOfDomain[length - 1]}`;
	}
	return `${partsOfDomain[length - 2] !== undefined ? `${partsOfDomain[length - 2]}.` : ""}${partsOfDomain[length - 1]}`;
};

// Gets the value of the setting
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

// Gets a sanitized cookieStoreId
export const getStoreId = (state, storeId) => {
	if (
		(storeId === "firefox-default") ||
		(!getSetting(state, "contextualIdentities") && storeId !== "firefox-private" && state.cache.browserDetect === "Firefox") ||
		(state.cache.browserDetect === "Chrome" && storeId === "0" || state.cache.browserDetect === "Opera" && storeId === "0")) {
		return "default";
	}
	if (state.cache.browserDetect === "Chrome" && storeId === "1") {
		return "private";
	}

	return storeId;
};

// Converts a expression to its regular expression equivalent
export const globExpressionToRegExp = (glob) => {
	const normalizedGlob = glob.trim().toLowerCase();
	if (normalizedGlob.startsWith("*.")) {
		return `${normalizedGlob.replace("*.", "(^|\.)").replace(/\./g, "\\.").replace(/\*/g, "\.\*")}$`;
	}
	return `^${normalizedGlob.replace(/\./g, "\\.").replace(/\*/g, "\.\*")}$`;
};

// Returns the first availble matched expression
export const returnMatchedExpressionObject = (state, cookieStoreId, hostname) => {
	const storeId = getStoreId(state, cookieStoreId);
	const expressionList = state.lists[storeId] || [];
	return expressionList.find((expression) => new RegExp(globExpressionToRegExp(expression.expression)).test(hostname));
};

// Return optional attributes for the Cookie API calls
export const returnOptionalCookieAPIAttributes = (state, cookieAPIAttributes) => {
	let newAttributes = {
		...cookieAPIAttributes
	};

	// Add optional firstPartyDomain attribute
	if (state.cache.browserDetect === "Firefox" && state.cache.firstPartyIsolateSetting && !Object.prototype.hasOwnProperty.call(newAttributes, "firstPartyDomain")) {
		newAttributes.firstPartyDomain = undefined;
		return newAttributes;
	} else if (!(state.cache.browserDetect === "Firefox" && state.cache.firstPartyIsolateSetting)) {
		delete newAttributes.firstPartyDomain;
	}
	return newAttributes;
};
