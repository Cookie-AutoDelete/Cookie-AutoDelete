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
	if (URL.match(/^http:/) || URL.match(/^https:/)) {
		return true;
	}
	return false;
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
export const getStoreId = (state, storeId) => (!getSetting(state, "contextualIdentities") || storeId === "firefox-default" ? "default" : storeId);

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
	return state.lists[storeId].find((expression) => new RegExp(globExpressionToRegExp(expression.expression)).test(hostname));
};
