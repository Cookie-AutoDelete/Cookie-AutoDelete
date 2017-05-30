module.exports = {

	//Returns an array of domains and subdomains (sub.sub.domain.com becomes [sub.sub.domain.com, sub.domain.com, domain.com])
	splitSubDomain(domain) {
		let relatedDomains = new Array();
		let splited = domain.split(".");
		relatedDomains.push(splited[splited.length - 2] + "." + splited[splited.length - 1])
		let j = 0;
		for(let i = splited.length - 3; i >= 0; i--) {
			let combined = splited[i] + "." +relatedDomains[j];
			relatedDomains.push(combined);
			j++;
		}
	  
		return relatedDomains;
	},

	//extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
	extractMainDomain(domain) {
		//Return the domain if it is an ip address
		let reIP = new RegExp('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+');
		if(reIP.test(domain)) {
			return domain;
		}
		//Delete a '.' if domain contains it at the end
		if(domain.charAt(domain.length - 1) === ".") {
			domain = domain.slice(0, domain.length - 1);
		}
		let re = new RegExp('[a-z0-9|-]+\.[a-z]+$');
		return re.exec(domain)[0];
	},


	//Returns the host name of the url. Etc. "https://en.wikipedia.org/wiki/Cat" becomes en.wikipedia.org
	getHostname(urlToGetHostName) {
	    var hostname = new URL(urlToGetHostName).hostname;
	    // Strip "www." if the URL starts with it.
	    hostname = hostname.replace(/^www\./, '');
	    return hostname;
	},

	//Returns true if it is a webpage
	isAWebpage(URL) {
		if(URL.match(/^http:/) || URL.match(/^https:/)) {
			return true;
		}
		return false;
	}

};