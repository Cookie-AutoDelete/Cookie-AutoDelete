// Initialize variables
const defaultWhiteList = "defaultWhiteList";
const greyPrefix = "-Grey";
let hostUrl;
let activeTab;
let cookieStoreId;
let page = browser.extension.getBackgroundPage().exposedFunctions;

// Logs the error
function onError(error) {
	console.error(`Error: ${error}`);
}

// Fills the popup page
function fillPopup(tabs) {
	browser.storage.local.get("activeMode")
	.then((items) => {
		document.getElementById("activeModeSwitch").checked = items.activeMode;
		return Promise.resolve();
	}).catch(onError);

	let notifyMessage = page.getNotifyMessage();
	if (notifyMessage !== "") {
		document.getElementById("notify").appendChild(document.createTextNode(notifyMessage));
	}
	// Fill the host site placeholder if it exists
	activeTab = tabs[0];
	if (!page.isAWebpage(activeTab.url)) {
		return Promise.resolve();
	}
	hostUrl = page.getHostname(activeTab.url);

	// Sets the checkbox depending on the if it exists in the set
	cookieStoreId = tabs[0].cookieStoreId;
	if (page.contextualIdentitiesEnabled) {
		if (page.whiteList.hasHost(hostUrl, cookieStoreId)) {
			document.getElementById("switchToWhiteList").checked = true;
		} else if (page.whiteList.hasHost(hostUrl, cookieStoreId + greyPrefix)) {
			document.getElementById("switchToGreyList").checked = true;
		} else {
			document.getElementById("switchToNoList").checked = true;
		}
	} else if (page.whiteList.hasHost(hostUrl, defaultWhiteList)) {
		document.getElementById("switchToWhiteList").checked = true;
	} else if (page.whiteList.hasHost(hostUrl, defaultWhiteList + greyPrefix)) {
		document.getElementById("switchToGreyList").checked = true;
	} else {
		document.getElementById("switchToNoList").checked = true;
	}

	// hostUrl = page.extractMainDomain(hostUrl);
	let hostPlaceholder = document.getElementById("hostwebsite");

	// Append the favicon image of the host site to the beggining of the URL

	if (activeTab.favIconUrl) {
		let faviconImage = new Image();
		faviconImage.src = activeTab.favIconUrl;
		faviconImage.style.width = "1em";
		faviconImage.style.height = "1em";
		hostPlaceholder.appendChild(faviconImage);
	}

	// Sets the Host site placeholder
	hostPlaceholder.appendChild(document.createTextNode(hostUrl));
	if (page.contextualIdentitiesEnabled) {
		let name = page.cache.getNameFromCookieID(cookieStoreId);
		hostPlaceholder.appendChild(document.createTextNode(`\n(${name})`));
	}
	return Promise.resolve();
}

browser.tabs.query({
	currentWindow: true,
	active: true
})
.then(fillPopup)
.catch(onError);

// Shows a green bar if the action was sucessful
function animateSuccess(element) {
	element.classList.add("successAnimated");
	setTimeout(() => {
		element.classList.remove("successAnimated");
	}, 1500);
}

// Shows a red bar if the action was not sucessful
function animateFailure(element) {
	element.classList.add("failureAnimated");
	setTimeout(() => {
		element.classList.remove("failureAnimated");
	}, 1500);
}

// Setting Click Handling
document.getElementById("settings").addEventListener("click", () => {
	browser.runtime.openOptionsPage();
});

// Manual Cookie Cleanup event handlers
document.getElementById("cookieCleanup").addEventListener("click", () => {
	page.cleanupOperation(false, false);
	animateSuccess(document.getElementById("cookieCleanup"));
});

document.getElementById("cookieCleanupIgnoreOpenTabs").addEventListener("click", () => {
	page.cleanupOperation(true, false);
	animateSuccess(document.getElementById("cookieCleanupIgnoreOpenTabs"));
});

// Clear all cookies for that domain
document.getElementById("clearCookiesForDomain").addEventListener("click", () => {
	return browser.cookies.getAll({
		domain: hostUrl,
		storeId: cookieStoreId
	})
	.then((cookies) => {
		if (cookies.length > 0) {
			for (let i = 0; i < cookies.length; i++) {
				let cookieDomain = page.prepareCookieDomain(cookies[i]) + cookies[i].path;
				browser.cookies.remove({
					url: cookieDomain,
					name: cookies[i].name,
					storeId: cookieStoreId
				}).catch(onError);
			}
			page.statLog.incrementCounter(cookies.length);
			animateSuccess(document.getElementById("clearCookiesForDomain"));
		} else {
			animateFailure(document.getElementById("clearCookiesForDomain"));
		}
		return Promise.resolve();
	});
});

// Turns on or off active mode cookie cleaning
document.getElementById("activeModeSwitch").addEventListener("click", () => {
	if (document.getElementById("activeModeSwitch").checked) {
		browser.storage.local.set({activeMode: true});
		page.enableActiveMode();
	} else {
		browser.storage.local.set({activeMode: false});
		page.disableActiveMode();
	}
});

// Radio button event Handling
document.getElementById("switchToNoList").addEventListener("click", () => {
	// console.log("Removed from list");
	if (hostUrl !== undefined) {
		if (page.contextualIdentitiesEnabled) {
			page.whiteList.removeURLFromLists(hostUrl, cookieStoreId);
		} else {
			page.whiteList.removeURLFromLists(hostUrl, defaultWhiteList);
		}
		page.checkIfProtected(activeTab);
	}
});

document.getElementById("switchToGreyList").addEventListener("click", () => {
	// console.log("Added to GreyList");
	if (hostUrl !== undefined) {
		if (page.contextualIdentitiesEnabled) {
			page.whiteList.addURL(hostUrl, cookieStoreId + greyPrefix);
		} else {
			page.whiteList.addURL(hostUrl, defaultWhiteList + greyPrefix);
		}
		page.checkIfProtected(activeTab);
	}
});

document.getElementById("switchToWhiteList").addEventListener("click", () => {
	// console.log("Added to WhiteList");
	if (hostUrl !== undefined) {
		if (page.contextualIdentitiesEnabled) {
			page.whiteList.addURL(hostUrl, cookieStoreId);
		} else {
			page.whiteList.addURL(hostUrl, defaultWhiteList);
		}
		page.checkIfProtected(activeTab);
	}
});
