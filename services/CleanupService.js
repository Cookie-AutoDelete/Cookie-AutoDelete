class CleanupService {
 	constructor() {
 		this.recentlyCleaned = 0;
 	}


	//Puts the domain in the right format for browser.cookies.clean() 
	prepareCookieDomain(cookie) {
		let cookieDomain = cookie.domain;
		if(cookieDomain.charAt(0) === ".") {
			cookieDomain = cookieDomain.slice(1);
		}
		cookieDomain = cookie.secure ? "https://" + cookieDomain : "http://" + cookieDomain;
		return cookieDomain;
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
			
			//hasHost has flexible checking(differentiate between sub.sub.domain.com and domain.com)
			//while setOfTabURLS is not flexible (sub.sub.domain.com will match to domain.com if in host domain in tab)
			let safeToClean;
			if(contextualIdentitiesEnabled) {
				safeToClean = !whiteList.hasHost(cookieDomainHost, cookies[i].storeId) && !setOfTabURLS.has(cookieMainDomainHost);
			} else {
				safeToClean = !whiteList.hasHost(cookieDomainHost) && !setOfTabURLS.has(cookieMainDomainHost);
			}
			if(safeToClean) {
				//Append the path to cookie
				cookieDomain = cookieDomain + cookies[i].path;
				//console.log("Original: " + cookies[i].domain + " CookieDomain: " + cookieDomain + " CookieDomainMainHost: " + cookieMainDomainHost);
				//console.log("CookieDomain: " + cookieDomain + " ID: " + cookies[i].storeId);
				if(contextualIdentitiesEnabled) {
					
					//setOfDeletedDomainCookies.add(cookieDomainHost + ": " + cookies[i].storeId);
					let name = getNameFromCookieID(cookies[i].storeId);
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
				incrementCounter();
				this.recentlyCleaned++;
			}
		}
		return Promise.resolve(setOfDeletedDomainCookies);
	}

	//Main function for cookie cleanup 
	cleanCookiesOperation() {
		//console.log("Cleaning");
		//Stores all tabs' host domains
		let setOfTabURLS = new Set();
		//Stores the deleted domains (for notification)
		let setOfDeletedDomainCookies = new Set();
		this.recentlyCleaned = 0;
		//Store all tabs' host domains to prevent cookie deletion from those domains
		browser.tabs.query({
			"windowType": "normal"
		})
		.then((tabs) => {
			for(let i = 0; i < tabs.length; i++) {
				if (isAWebpage(tabs[i].url)) {
					let hostURL = getHostname(tabs[i].url);
					hostURL = extractMainDomain(hostURL);
					setOfTabURLS.add(hostURL);
				}
			}
			//console.log(setOfTabURLS);

			if(contextualIdentitiesEnabled) {
				//Clean cookies in different cookie ids using the contextual identities api
				let promiseContainers = [];

				nameCacheMap.forEach(function(value, key, map) {
					browser.cookies.getAll({storeId: key})
					.then((cookies) => {
						promiseContainers.push(cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies));
					});
				});
				
				Promise.all(promiseContainers)
				.then(notifyCleanup.notifyCookieCleanUp(this.recentlyCleaned, setOfDeletedDomainCookies));
			} else {
				//Clean the default cookie id container
				browser.cookies.getAll({})
				.then((cookies) => {
					this.cleanCookies(cookies, setOfTabURLS, setOfDeletedDomainCookies)
					.then(notifyCleanup.notifyCookieCleanUp(this.recentlyCleaned, setOfDeletedDomainCookies));
				});
			}
			
			
		});

	}

}