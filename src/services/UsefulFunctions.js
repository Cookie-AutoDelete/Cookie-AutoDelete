module.exports = {

	// Returns an array of domains and subdomains (sub.sub.domain.com becomes [sub.sub.domain.com, sub.domain.com, domain.com])
	splitSubDomain(domain) {
		let relatedDomains = [];
		let splited = domain.split(".");
		relatedDomains.push(`${splited[splited.length - 2]}.${splited[splited.length - 1]}`);
		let j = 0;
		for (let i = splited.length - 3; i >= 0; i--) {
			relatedDomains.push(`${splited[i]}.${relatedDomains[j]}`);
			j++;
		}
		return relatedDomains;
	},

	// extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
	extractMainDomain(domain) {
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
		let re = new RegExp("[a-z0-9|-]+\.[a-z]+$");
		return re.exec(editedDomain)[0];
	},

	// sub.sub.domain.com becomes sub.domain.com
	extractBaseDomain(domain) {
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
			editedDomain = editedDomain.slice(0, editedDomain.length - 1);
		}
		let count = editedDomain.split(".").length - 1;
		let regString = "\.[a-z]+$";
		if (count === 1) {
			regString = `[a-z0-9|-]+\.${regString}`;
		} else {
			for (let i = 1; i < count; i++) {
				regString = `[a-z0-9|-]+\.${regString}`;
			}
		}
		let re = new RegExp(regString);
		return re.exec(editedDomain)[0];
	},

	// Returns the host name of the url. Etc. "https://en.wikipedia.org/wiki/Cat" becomes en.wikipedia.org
	getHostname(urlToGetHostName) {
		let hostname = new URL(urlToGetHostName).hostname;
		// Strip "www." if the URL starts with it.
		hostname = hostname.replace(/^www\./, "");
		return hostname;
	},

	// Returns true if it is a webpage
	isAWebpage(URL) {
		if (URL.match(/^http:/) || URL.match(/^https:/)) {
			return true;
		}
		return false;
	}

};
