function animateSuccess(element) {
	element.classList.add("successAnimated");
	setTimeout(() => {
		element.classList.remove("successAnimated");
	},1500);
}

function animateFailure(element) {
	element.classList.add("failureAnimated");
	setTimeout(() => {
		element.classList.remove("failureAnimated");
	},1500);	
}

//Fills the popup page
function fillPopup(tabs) {

	browser.storage.local.get("activeMode")
	.then((items) => {
		document.getElementById("activeModeSwitch").checked = items.activeMode;
	});
	
	if(page.notifyCleanup.notifyMessage !== "") {
		document.getElementById("notify").appendChild(document.createTextNode(page.notifyCleanup.notifyMessage));
	}

	//Fill the host site placeholder if it exists
    activeTab = tabs[0];
    if(!page.isAWebpage(activeTab.url)) {
    	return;
    }
	hostUrl = page.getHostname(activeTab.url);

	//Sets the checkbox depending on the if it exists in the set
	cookieStoreId = tabs[0].cookieStoreId;
	if(page.contextualIdentitiesEnabled) {
		document.getElementById("switchToWhiteList").checked = page.whiteList.hasHost(hostUrl, cookieStoreId); 
	} else {
		document.getElementById("switchToWhiteList").checked = page.whiteList.hasHost(hostUrl); 
	}

	//hostUrl = page.extractMainDomain(hostUrl);
	var hostPlaceholder = document.getElementById("hostwebsite");

	//Append the favicon image of the host site to the beggining of the URL

	if (activeTab.favIconUrl) {
		var faviconImage = new Image();
		faviconImage.src = activeTab.favIconUrl;
		faviconImage.style.width = "1em";
		faviconImage.style.height = "1em";
		hostPlaceholder.appendChild(faviconImage);
	}

	//Sets the Host site placeholder
	hostPlaceholder.appendChild(document.createTextNode(hostUrl));
	if(page.contextualIdentitiesEnabled) {
		let name = page.cache.getNameFromCookieID(cookieStoreId);
		hostPlaceholder.appendChild(document.createTextNode("\n" + `(${name})`));
	}


	
}


//Initialize variables
var hostUrl;
var activeTab;
var cookieStoreId;
var page = browser.extension.getBackgroundPage();
browser.tabs.query({currentWindow: true, active: true})
.then(fillPopup);



//Setting Click Handling
document.getElementById("settings").addEventListener("click", () => {
	browser.runtime.openOptionsPage();
});

//Clear all history for a domain
document.getElementById('cookieCleanup').addEventListener("click", () => {
	page.cleanup.cleanCookiesOperation();
	animateSuccess(this);
});

document.getElementById('cookieCleanupIgnoreOpenTabs').addEventListener("click", () => {
	page.cleanup.cleanCookiesOperation(true);
	animateSuccess(this);
});


//Clear all cookies for that domain
document.getElementById("clearCookiesForDomain").addEventListener("click", () => {
	browser.cookies.getAll({
		domain: hostUrl,
		storeId: cookieStoreId
	})
	.then((cookies) => {
		if(cookies.length > 0) {
			for(let i = 0; i < cookies.length; i++) {
				let cookieDomain = page.cleanup.prepareCookieDomain(cookies[i])  + cookies[i].path;
				browser.cookies.remove({
					url: cookieDomain,
					name: cookies[i].name,
					storeId: cookieStoreId
				});
			}
			page.statLog.incrementCounter(cookies.length);
			animateSuccess(document.getElementById("clearCookiesForDomain"));
		} else {
			animateFailure(document.getElementById("clearCookiesForDomain"));
		}
	});
	
});

//Turns on or off active mode cookie cleaning
document.getElementById("activeModeSwitch").addEventListener("click", () => {
	if(document.getElementById("activeModeSwitch").checked) {
		browser.storage.local.set({activeMode: true});
		page.enableActiveMode();
	} else {
		browser.storage.local.set({activeMode: false});
		page.disableActiveMode();
	}
});

//Checkbox Event Handling
document.getElementById("switchToWhiteList").addEventListener("click", () => {
	if(hostUrl !== undefined) {
		if(page.contextualIdentitiesEnabled) {
			if(document.getElementById("switchToWhiteList").checked) {
				page.whiteList.addURL(hostUrl, cookieStoreId);
				page.setIconDefault(activeTab);
			} else {
				page.whiteList.removeURL(hostUrl, cookieStoreId);
				page.setIconRed(activeTab);
			}
		} else {
			if(document.getElementById("switchToWhiteList").checked) {
				page.whiteList.addURL(hostUrl);
				page.setIconDefault(activeTab);
			} else {
				page.whiteList.removeURL(hostUrl);
				page.setIconRed(activeTab);
			}
		}
	}
});