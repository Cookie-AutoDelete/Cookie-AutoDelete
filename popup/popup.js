function animateSuccess(element) {
	element.classList.add("successAnimated");
	setTimeout(function() {
		element.classList.remove("successAnimated");
	},1500);
}

function animateFailure(element) {
	element.classList.add("failureAnimated");
	setTimeout(function() {
		element.classList.remove("failureAnimated");
	},1500);	
}

//Fills the popup page
function fillPopup(tabs) {

	browser.storage.local.get("activeMode")
	.then(function(items) {
		document.getElementById("activeModeSwitch").checked = items.activeMode;
	});
	
	if(page.notifyMessage !== "") {
		document.getElementById("notify").appendChild(document.createTextNode(page.notifyMessage));
	}

	//Fill the host site placeholder if it exists
    var activeTab = tabs[0];
    if(!page.isAWebpage(activeTab.url)) {
    	return;
    }
	hostUrl = page.getHostname(activeTab.url);

	//Sets the checkbox depending on the if it exists in the set
	if(page.contextualIdentitiesEnabled) {
		cookieStoreId = tabs[0].cookieStoreId;
		document.getElementById("switchToWhiteList").checked = page.hasHost(hostUrl, cookieStoreId); 
	} else {
		document.getElementById("switchToWhiteList").checked = page.hasHost(hostUrl); 
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
		hostPlaceholder.appendChild(document.createTextNode("\n" + `(${cookieStoreId})`));
	}


	
}


//Initialize variables
var hostUrl;
var cookieStoreId;
var page = browser.extension.getBackgroundPage();
browser.tabs.query({currentWindow: true, active: true})
.then(fillPopup);



//Setting Click Handling
document.getElementById("settings").addEventListener("click", function() {
	browser.runtime.openOptionsPage();
});

//Clear all history for a domain
document.getElementById('cookieCleanup').addEventListener("click", function() {

	page.cleanCookiesOperation();
	animateSuccess(this);
	
});

document.getElementById("clearCookiesForDomain").addEventListener("click", function() {
	browser.cookies.getAll({
		domain: hostUrl
	})
	.then(function(cookies) {
		if(cookies.length > 0) {
			for(let i = 0; i < cookies.length; i++) {
				let cookieDomain = page.prepareCookieDomain(cookies[i])  + cookies[i].path;
				browser.cookies.remove({
					url: cookieDomain,
					name: cookies[i].name
				});
			}
			page.recentlyCleaned = cookies.length;
			animateSuccess(document.getElementById("clearCookiesForDomain"));
		} else {
			animateFailure(document.getElementById("clearCookiesForDomain"));
		}
	});
	
});

document.getElementById("activeModeSwitch").addEventListener("click", function() {
	if(document.getElementById("activeModeSwitch").checked) {
		browser.storage.local.set({activeMode: true});
		page.enableActiveMode();
	} else {
		browser.storage.local.set({activeMode: false});
		page.disableActiveMode();
	}
});

//Checkbox Event Handling
document.getElementById("switchToWhiteList").addEventListener("click", function() {
	if(page.contextualIdentitiesEnabled) {
		if(document.getElementById("switchToWhiteList").checked) {
			page.addURL(hostUrl, cookieStoreId);
		} else {
			page.removeURL(hostUrl, cookieStoreId);
		}
	} else {
		if(document.getElementById("switchToWhiteList").checked) {
			page.addURL(hostUrl);
		} else {
			page.removeURL(hostUrl);
		}
	}
	
});