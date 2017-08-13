/* global page*/
/* eslint no-use-before-define: ["error", { "functions": false }]*/

// page is declared in settingsLocalization.js

let browserDetect = browser.extension.getBackgroundPage().browserDetect;
const defaultWhiteList = "defaultWhiteList";
const greyPrefix = "-Grey";
const GREYLIST = "GreyList";
const WHITELIST = "WhiteList";
const firefoxPrivate = "firefox-private";

// Logs the error
function onError(error) {
	console.error(`Error: ${error}`);
}

// Show an alert and then fade out
function toggleAlert(alert) {
	alert.style.display = "block";
	setTimeout(() => {
		alert.classList.add("fadeOut");
	}, 800);
	setTimeout(() => {
		alert.style.display = "none";
		alert.classList.remove("fadeOut");
	}, 1700);
}

/*
    Sidebar Logic
*/
// Switchs the sidebar
// Map that stores the tab to the corresponding content
let sideBarTabToContentMap = new Map();
sideBarTabToContentMap.set(document.getElementById("tabWelcome"), document.getElementById("welcomeContent"));
sideBarTabToContentMap.set(document.getElementById("tabSettings"), document.getElementById("cookieSettingsContent"));
sideBarTabToContentMap.set(document.getElementById("tabWhiteList"), document.getElementById("listOfURLSContent"));
sideBarTabToContentMap.set(document.getElementById("tabAbout"), document.getElementById("aboutContent"));

function sideBarSwitch(event) {
	let element = event.currentTarget;
	if (sideBarTabToContentMap.has(element)) {
		sideBarTabToContentMap.forEach((value, key, map) => {
			if (element === key) {
				key.classList.add("pure-menu-selected");
				value.style.display = "block";
			} else {
				key.classList.remove("pure-menu-selected");
				value.style.display = "none";
			}
		});
	}
}

// Set a click event for each tab in the Map
sideBarTabToContentMap.forEach((value, key, map) => {
	key.addEventListener("click", sideBarSwitch);
});
document.getElementById("tabWelcome").click();

/*
    Welcome Logic
*/

if (browserDetect() === "Firefox") {
	document.getElementById("reviewLinkMessage").href = "https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/reviews/";
} else if (browserDetect() === "Chrome") {
	document.getElementById("reviewLinkMessage").href = "https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh/reviews";
}

/*
    History Settings Logic
*/
// Setting the values from local storage
function restoreSettingValues() {
	return browser.storage.local.get()
    .then((items) => {
	document.getElementById("delayBeforeCleanInput").value = items.delayBeforeClean;
	document.getElementById("activeModeSwitch").checked = items.activeMode;
	document.getElementById("statLoggingSwitch").checked = items.statLoggingSetting;
	document.getElementById("showNumberOfCookiesInIconSwitch").checked = items.showNumberOfCookiesInIconSetting;
	document.getElementById("notifyCookieCleanUpSwitch").checked = items.notifyCookieCleanUpSetting;
	document.getElementById("cookieCleanUpOnStartSwitch").checked = items.cookieCleanUpOnStartSetting;
	document.getElementById("enableGlobalSubdomainSwitch").checked = items.enableGlobalSubdomainSetting;
	document.getElementById("contextualIdentitiesEnabledSwitch").checked = items.contextualIdentitiesEnabledSetting;
	return Promise.resolve();
});
}

// Saving the values to local storage
function saveSettingsValues() {
	return browser.storage.local.set({
		delayBeforeClean: document.getElementById("delayBeforeCleanInput").value,
		activeMode: document.getElementById("activeModeSwitch").checked,
		statLoggingSetting: document.getElementById("statLoggingSwitch").checked,
		showNumberOfCookiesInIconSetting: document.getElementById("showNumberOfCookiesInIconSwitch").checked,
		notifyCookieCleanUpSetting: document.getElementById("notifyCookieCleanUpSwitch").checked,
		cookieCleanUpOnStartSetting: document.getElementById("cookieCleanUpOnStartSwitch").checked,
		enableGlobalSubdomainSetting: document.getElementById("enableGlobalSubdomainSwitch").checked,
		contextualIdentitiesEnabledSetting: document.getElementById("contextualIdentitiesEnabledSwitch").checked
	}).then(page.onStartUp);
}

restoreSettingValues();

// Hide the Container Mode option if not Firefox
if (browserDetect() !== "Firefox" || browser.contextualIdentities === undefined) {
	document.getElementById("contextualIdentitiesRow").style.display = "none";
}

// Event handlers for the buttons
document.getElementById("saveSettings").addEventListener("click", () => {
	saveSettingsValues()
    .then(generateTable)
    .catch(onError);
	toggleAlert(document.getElementById("saveConfirm"));
});

document.getElementById("cancelSettings").addEventListener("click", () => {
	restoreSettingValues();
	toggleAlert(document.getElementById("cancelConfirm"));
});

document.getElementById("resetCounter").addEventListener("click", () => {
	page.statLog.resetCounter();
	toggleAlert(document.getElementById("resetCounterConfirm"));
});

document.getElementById("defaultSettings").addEventListener("click", () => {
	page.setDefaults()
    .then(() => {
	restoreSettingValues();
	generateTable();
	toggleAlert(document.getElementById("defaultConfirm"));
	return Promise.resolve();
}).catch(onError);
});

/*
    Cookie WhiteList Logic
*/

// Event handler for the add to WhiteList or GreyList hover button
function addURLHoverButton(event) {
	let dropbtn = document.getElementById("dropbtnId");
	let dropdownText = document.getElementById("dropdownText");
	if (dropbtn.classList.item(1) === WHITELIST) {
		dropbtn.textContent = `${browser.i18n.getMessage("toGreyListText")} \u25BC`;
		dropbtn.classList.remove(WHITELIST);
		dropbtn.classList.add(GREYLIST);
		dropdownText.textContent = `${browser.i18n.getMessage("whiteListWordText")}`;
	} else {
		dropbtn.textContent = `${browser.i18n.getMessage("toWhiteListText")} \u25BC`;
		dropbtn.classList.remove(GREYLIST);
		dropbtn.classList.add(WHITELIST);
		dropdownText.textContent = `${browser.i18n.getMessage("greyListWordText")}`;
	}
}

// Remove the url where the user clicked
function clickRemoved(event) {
	if (event.target.classList.contains("removeButton")) {
		let targetElement = event.target.parentElement.parentElement.parentElement;
		let URL = targetElement.classList.item(0);
		let list = targetElement.classList.item(1);
		let currentWhiteList = page.contextualIdentitiesEnabled ? getActiveTabName() : defaultWhiteList;
		// console.log(URL + list);
		URL = URL.trim();
		page.whiteList.removeURL(URL, list === WHITELIST ? currentWhiteList : currentWhiteList + greyPrefix);
		generateTableOfURLS();
	}
}

// Gets the active tab name for Containers
function getActiveTabName() {
	if (document.getElementsByClassName("activeTab").length === 0) {
		return "";
	}
    // Returns the second class name
	return document.getElementsByClassName("activeTab")[0].className.split(" ")[1];
}

// Add URL by keyboard input
function addURLFromInput() {
	let input = document.getElementById("URLForm").value;
	if (input) {
		let URL = `http://www.${input}`;
		let list = document.getElementById("dropbtnId").classList.item(1);
		let currentWhiteList = page.contextualIdentitiesEnabled ? getActiveTabName() : defaultWhiteList;
		page.whiteList.addURL(page.getHostname(URL), list === WHITELIST ? currentWhiteList : currentWhiteList + greyPrefix);
		document.getElementById("URLForm").value = "";
		document.getElementById("URLForm").focus();
		generateTableOfURLS();
	}
}

// Returns a txt string of lines from array
function returnLinesFromArray(arr) {
	let txt = "";
	arr.forEach((row) => {
		txt += row;
		txt += "\n";
	});
	return txt;
}

// Export the list of URLS as a text file
function downloadTextFile(txt) {
    // console.log(txt);
	let hiddenElement = document.createElement("a");
	hiddenElement.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
	hiddenElement.target = "_target";
	hiddenElement.download = page.contextualIdentitiesEnabled ? "Cookie_AutoDelete_Lists_Containers.txt" : "Cookie_AutoDelete_Lists.txt";

    // Firefox just opens the text rather than downloading it. In Chrome the "else" block of code works.
    // So this is a work around.
	if (browserDetect() === "Firefox") {
		let text = browser.i18n.getMessage("rightClickToSave");
		hiddenElement.appendChild(document.createTextNode(text));
		if (document.getElementById("saveAs").hasChildNodes()) {
			document.getElementById("saveAs").firstChild.replaceWith(hiddenElement);
		} else {
			document.getElementById("saveAs").appendChild(hiddenElement);
		}
	} else {
		document.body.appendChild(hiddenElement);
		hiddenElement.click();
		document.body.removeChild(hiddenElement);
	}
}

// Exports the container whitelist
function exportMapToTxt() {
	let txtFile = "";
	page.whiteList.cookieWhiteList.forEach((value, key, map) => {
		if (key !== firefoxPrivate && key !== firefoxPrivate + greyPrefix) {
			txtFile += `#${key}\n`;
			txtFile += returnLinesFromArray(Array.from(value).sort());
			txtFile += "\n";
		}
	});
	downloadTextFile(txtFile);
}

// Switches a domain from GreyList to WhiteList and vise versa
function switchList(event) {
	event.preventDefault();
	let url = event.target.parentElement.parentElement.parentElement.parentElement.classList.item(0);
	let targetList = event.target.classList.item(0);
	let currentWhiteList = defaultWhiteList;
	// console.log(url + targetList);
	if (page.contextualIdentitiesEnabled) {
		currentWhiteList = getActiveTabName();
	}

	if (targetList === GREYLIST) {
		page.whiteList.addURL(url, currentWhiteList + greyPrefix);
	} else {
		page.whiteList.addURL(url, currentWhiteList);
	}
	generateTableOfURLS();
}

// Creates a row in the table
function createRow(arrayItem, listType) {
	let tr = document.createElement("tr");
	let td = document.createElement("td");

	td.classList.add(arrayItem);
	td.classList.add(listType);
	// console.log(td.classList.item(1));

	let removeButton = document.createElement("span");
	removeButton.classList.add("removeButton");
	removeButton.addEventListener("click", clickRemoved);
	removeButton.appendChild(document.createTextNode("\u00D7"));

	let hoverMenu = document.createElement("div");
	hoverMenu.classList.add("dropdown");
	hoverMenu.classList.add("dropdownTable");

	let hoverButton = document.createElement("button");
	hoverButton.classList.add("dropbtn");
	hoverButton.textContent = `${listType === WHITELIST ? browser.i18n.getMessage("whiteListWordText") : browser.i18n.getMessage("greyListWordText")} \u25BC`;
	hoverButton.style.border = "none";
	let hoverDropDownContent = document.createElement("div");
	hoverDropDownContent.classList.add("dropdown-content");
	let otherLink = document.createElement("a");
	otherLink.href = "#";
	otherLink.addEventListener("click", switchList);
	if (listType === WHITELIST) {
		otherLink.textContent = browser.i18n.getMessage("greyListWordText");
		otherLink.classList.remove(WHITELIST);
		otherLink.classList.add(GREYLIST);
	} else {
		otherLink.textContent = browser.i18n.getMessage("whiteListWordText");
		otherLink.classList.remove(GREYLIST);
		otherLink.classList.add(WHITELIST);
	}

	hoverDropDownContent.appendChild(otherLink);
	hoverMenu.appendChild(hoverButton);
	hoverMenu.appendChild(hoverDropDownContent);

	let leftSide = document.createElement("span");
	leftSide.classList.add("rowLeftSide");
	leftSide.appendChild(removeButton);
	leftSide.appendChild(document.createTextNode(arrayItem));

	let rowContainer = document.createElement("div");
	rowContainer.classList.add("rowContainer");

	rowContainer.appendChild(leftSide);
	rowContainer.appendChild(hoverMenu);
	td.appendChild(rowContainer);
	tr.appendChild(td);
	return tr;
}

// Creates a html table from an array
function generateTableFromSet(whitelist, greylist) {
	let theTable = document.createElement("table");
	// console.log(whitelist);
	// console.log(greylist);
	let combinedArray = [...whitelist, ...greylist].sort();
	// console.log(combinedArray);
	combinedArray.forEach((item) => {
		theTable.appendChild(createRow(item, whitelist.has(item) ? WHITELIST : GREYLIST));
	});
	return theTable;
}

// When the user clicks on a tab container
function openTab(evt, tabContent) {
    // Declare all variables
	let i;
	let tabcontent;
	let tablinks;

    // Get all elements with class="tabcontent" and hide them
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

    // Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].classList.remove("activeTab");
	}

    // Show the current tab, and add an "active" class to the link that opened the tab
	document.getElementById(tabContent).style.display = "";
	evt.currentTarget.classList.add("activeTab");
}

// Generates the nav above the domain table
function generateTabNav() {
	let tableContainerNode = document.getElementById("tableContainer");
	let tabNav = document.createElement("ul");

	tabNav.id = "containerTabs";
	tabNav.classList.add("tab");
	page.whiteList.cookieWhiteList.forEach((value, key, map) => {
        // Creates the tabbed navigation above the table
        // This fixes an issue where if you open a private window in Containers Mode, a new tab with [object Promise] will show up
		if (!key.endsWith(greyPrefix) && key !== firefoxPrivate) {
			let tab = document.createElement("li");
			let aTag = document.createElement("a");
			aTag.textContent = page.cache.getNameFromCookieID(key);
			aTag.classList.add("tablinks");
			aTag.classList.add(key);
			aTag.addEventListener("click", (event) => {
				openTab(event, key);
			});
			tab.appendChild(aTag);
			tabNav.appendChild(tab);
		}
	});

	tableContainerNode.parentNode.insertBefore(tabNav, tableContainerNode);
}

// Generate the domain table
function generateTableOfURLS() {
	let activeTabName = getActiveTabName();
	let theTables = document.createElement("div");
	page.whiteList.cookieWhiteList.forEach((value, key, map) => {
        // Creates a table based on the Cookie ID
		if (!key.endsWith(greyPrefix)) {
			let tabContent = generateTableFromSet(value, page.whiteList.cookieWhiteList.get(key + greyPrefix));
			tabContent.classList.add("tabcontent");
			tabContent.id = key;
			theTables.appendChild(tabContent);
			if (activeTabName !== "" && key !== activeTabName) {
				tabContent.style.display = "none";
			}
		}
	});

	if (document.getElementById("tableContainer").hasChildNodes()) {
		document.getElementById("tableContainer").firstChild.replaceWith(theTables);
	} else {
		document.getElementById("tableContainer").appendChild(theTables);
	}
}

// Creates the table and the tab nav
function generateTable() {
	if (document.contains(document.getElementById("containerTabs"))) {
		document.getElementById("containerTabs").remove();
	}
	if (page.contextualIdentitiesEnabled) {
		generateTabNav();
	}
	generateTableOfURLS();
	if (page.contextualIdentitiesEnabled) {
		document.getElementsByClassName("tablinks")[0].click();
	}
}

generateTable();

// Event handler for the Remove All button
document.getElementById("clear").addEventListener("click", () => {
	page.whiteList.clearURL(page.contextualIdentitiesEnabled ? getActiveTabName() : defaultWhiteList);
	generateTableOfURLS();
});

// Event handler for the user entering a URL through a form
document.getElementById("add").addEventListener("click", addURLFromInput);

// DropDown Button whether to add the domain to Grey or White List
document.getElementById("dropdownText").addEventListener("click", addURLHoverButton);

// Event handler when the user press "Enter" on a keyboard on the URL Form
document.getElementById("URLForm").addEventListener("keypress", (e) => {
	let key = e.which || e.keyCode;
	if (key === 13) {
		addURLFromInput();
	}
});

// Exports urls to a text file
document.getElementById("exportURLS").addEventListener("click", () => {
	exportMapToTxt();
});

// Import URLS by text
document.getElementById("importURLS").addEventListener("change", function() {
	let file = this.files[0];

	let reader = new FileReader();
	reader.onload = function(progressEvent) {
		// Entire file
		let normalizedResult = this.result;
		if (this.result.includes("\r\n")) {
			// console.log("CRLF")
			normalizedResult = this.result.replace(/\r\n/g, "\n");
		} else if (this.result.includes("\r")) {
			// console.log("CR")
			normalizedResult = this.result.replace(/\r/g, "\n");
		}

		// By lines
		let lines = normalizedResult.split("\n");
		// console.log(lines);
		let cookieID = "";
		for (let line = 0; line < lines.length; line++) {
			if (lines[line].charAt(0) === "#") {
				cookieID = lines[line].slice(1);
				line++;
			}
			if (lines[line] !== "") {
				page.whiteList.addURL(lines[line], cookieID);
			}
		}
		generateTableOfURLS();
	};
	reader.readAsText(file);
	// Reset the file uploaded
	document.getElementById("importURLS").type = "";
	document.getElementById("importURLS").type = "file";
});
