const UsefulFunctions = require("./UsefulFunctions");

class CleanupService {
 	constructor() {
 		this.recentlyCleaned = 0;
 	}


	//Puts the domain in the right format for browser.cookies.clean() 
	prepareCookieDomain(cookie) {
		let cookieDomain = cookie.domain;
		//console.log(cookie);
		if(cookieDomain.charAt(0) === ".") {
			cookieDomain = cookieDomain.slice(1);
		}
		cookieDomain = cookie.secure ? "https://" + cookieDomain : "http://" + cookieDomain;
		return cookieDomain;
	}

	isSafeToClean(whiteList, cookieDomainHost, cookieMainDomainHost, setOfTabURLS) {
		//hasHost has flexible checking(differentiate between sub.sub.domain.com and domain.com)
		//while setOfTabURLS is not flexible (sub.sub.domain.com will match to domain.com if in host domain in tab)
		let safeToClean;
		if(contextualIdentitiesEnabled) {	
			safeToClean = !whiteList.hasHost(cookieDomainHost, cookies[i].storeId) && !setOfTabURLS.has(cookieMainDomainHost);
		} else {
			safeToClean = !whiteList.hasHost(cookieDomainHost) && !setOfTabURLS.has(cookieMainDomainHost);
		}
		return safeToClean;
	}

	//Deletes cookies if there is no existing cookie's host main url in an open tab
	cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies) {
		for(let i = 0; i < cookies.length; i++) {
			//https://domain.com or http://domain.com
			let cookieDomain = this.prepareCookieDomain(cookies[i]);
			//sub.sub.domain.com
			let cookieDomainHost = getHostname(cookieDomain);
			//domain.com
			let cookieMainDomainHost = extractMainDomain(cookieDomainHost);
			

			if(this.isSafeToClean(whiteList, cookieDomainHost, cookieMainDomainHost, setOfTabURLS)) {
				//Append the path to cookie
				cookieDomain = cookieDomain + cookies[i].path;
				//console.log("Original: " + cookies[i].domain + " CookieDomain: " + cookieDomain + " CookieDomainMainHost: " + cookieMainDomainHost);
				//console.log("CookieDomain: " + cookieDomain + " ID: " + cookies[i].storeId);
				if(contextualIdentitiesEnabled) {
					
					//setOfDeletedDomainCookies.add(cookieDomainHost + ": " + cookies[i].storeId);
					let name = cache.getNameFromCookieID(cookies[i].storeId);
					setOfDeletedDomainCookies.add(`${cookieMainDomainHost} (${name})`);

				} else {
					setOfDeletedDomainCookies.add(cookieDomainHost);
				}
				
				// url: "http://domain.com" + cookies[i].path
				browser.cookies.remove({
					url: cookieDomain,
					name: cookies[i].name,
					storeId: cookies[i].storeId
				});
				this.recentlyCleaned++;
			}
		}
		return Promise.resolve(setOfDeletedDomainCookies);
	}

	//Store all tabs' host domains to prevent cookie deletion from those domains
	returnSetOfOpenTabDomains() {
		return browser.tabs.query({
			"windowType": "normal"
		})
		.then((tabs) => {
			let setOfTabURLS = new Set();
			tabs.forEach((currentValue, index, array) => {
				if (UsefulFunctions.isAWebpage(currentValue.url)) {
					let hostURL = UsefulFunctions.getHostname(currentValue.url);
					hostURL = UsefulFunctions.extractMainDomain(hostURL);
					setOfTabURLS.add(hostURL);
				}
			});
			return Promise.resolve(setOfTabURLS);
		});
	}

	//Main function for cookie cleanup 
	cleanCookiesOperation(ignoreOpenTabs = false) {
		//Stores the deleted domains (for notification)
		let setOfDeletedDomainCookies = new Set();
		this.recentlyCleaned = 0;
		
		let setOfTabURLS;
		if(!ignoreOpenTabs) {
			setOfTabURLS = returnSetOfOpenTabDomains();
		} else {
			setOfTabURLS = new Set();
		}

			if(contextualIdentitiesEnabled) {
				//Clean cookies in different cookie ids using the contextual identities api
				let promiseContainers = [];
				let index = 1;
				cache.nameCacheMap.forEach((value, key, map) => {
					browser.cookies.getAll({storeId: key})
					.then((cookies) => {
						promiseContainers.push(this.cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies));
						index++;
						if(index === cache.nameCacheMap.size) {
							Promise.all(promiseContainers)
							.then(this.afterCleanup(setOfDeletedDomainCookies));
						}
					});	
				});
				
				
			} else {
				//Clean the default cookie id container
				browser.cookies.getAll({})
				.then((cookies) => {
					this.cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies)
					.then(this.afterCleanup(setOfDeletedDomainCookies));
				});
			}
			
	}



	afterCleanup(setOfDeletedDomainCookies) {
		notifyCleanup.notifyCookieCleanUp(this.recentlyCleaned, setOfDeletedDomainCookies);
		statLog.incrementCounter(this.recentlyCleaned);
	}

}

module.exports = CleanupService;