var browserDetect = browser.extension.getBackgroundPage().browserDetect;

//Show an alert and then fade out
function toggleAlert(alert) {
    alert.style.display = "block";
    setTimeout(function() { 
        alert.classList.add("fadeOut");
    }, 800);    
    setTimeout(function() { 
        alert.style.display = "none";
        alert.classList.remove("fadeOut"); 
    }, 1700);


}


/*
    Sidebar Logic
*/
//Switchs the sidebar
function sideBarSwitch(event) {
    var element = event.currentTarget;
    if(sideBarTabToContentMap.has(element)) {
        sideBarTabToContentMap.forEach(function(value, key, map) {         
            if(element === key) {
                key.classList.add("pure-menu-selected");
                value.style.display = 'block';
            } else {
                key.classList.remove("pure-menu-selected"); 
                value.style.display = 'none';
            }
        }); 
    }
}

//Map that stores the tab to the corresponding content
var sideBarTabToContentMap = new Map();
sideBarTabToContentMap.set(document.getElementById("tabWelcome"), document.getElementById("welcomeContent"));
sideBarTabToContentMap.set(document.getElementById("tabSettings"), document.getElementById("cookieSettingsContent"));
sideBarTabToContentMap.set(document.getElementById("tabWhiteList"), document.getElementById("listOfURLSContent"));
sideBarTabToContentMap.set(document.getElementById("tabAbout"), document.getElementById("aboutContent"));

//Set a click event for each tab in the Map
sideBarTabToContentMap.forEach(function(value, key, map) {
    key.addEventListener("click", sideBarSwitch);
});
document.getElementById("tabWelcome").click();

/*
    Welcome Logic
*/

if(browserDetect() === "Firefox") {
    document.getElementById("reviewLinkMessage").href = "https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/reviews/";
} else if(browserDetect() === "Chrome") {
    document.getElementById("reviewLinkMessage").href = "https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh/reviews";
}
/*
    History Settings Logic
*/
//Setting the values from local storage
function restoreSettingValues() {
    browser.storage.local.get()
    .then(function(items) {
        document.getElementById("delayBeforeCleanInput").value = items.delayBeforeClean;
        document.getElementById("activeModeSwitch").checked = items.activeMode;
		document.getElementById("statLoggingSwitch").checked = items.statLoggingSetting;
        document.getElementById("showNumberOfCookiesInIconSwitch").checked = items.showNumberOfCookiesInIconSetting;
        document.getElementById("notifyCookieCleanUpSwitch").checked = items.notifyCookieCleanUpSetting;
        document.getElementById("cookieCleanUpOnStartSwitch").checked = items.cookieCleanUpOnStartSetting;
        document.getElementById("contextualIdentitiesEnabledSwitch").checked = items.contextualIdentitiesEnabledSetting;

    });
}
//Saving the values to local storage
function saveSettingsValues() {
    return browser.storage.local.set({
        delayBeforeClean: document.getElementById("delayBeforeCleanInput").value,
        activeMode: document.getElementById("activeModeSwitch").checked,
        statLoggingSetting: document.getElementById("statLoggingSwitch").checked,
        showNumberOfCookiesInIconSetting: document.getElementById("showNumberOfCookiesInIconSwitch").checked,
        notifyCookieCleanUpSetting: document.getElementById("notifyCookieCleanUpSwitch").checked,
        cookieCleanUpOnStartSetting: document.getElementById("cookieCleanUpOnStartSwitch").checked,    
        contextualIdentitiesEnabledSetting: document.getElementById("contextualIdentitiesEnabledSwitch").checked          
    }).then(page.onStartUp);
}

restoreSettingValues();

if(browserDetect() !== "Firefox" || browser.contextualIdentities === undefined) {
    document.getElementById("contextualIdentitiesRow").style.display = "none";
}

//Event handlers for the buttons
document.getElementById("saveSettings").addEventListener("click", function() {
    saveSettingsValues()
    .then(generateTable);
    toggleAlert(document.getElementById("saveConfirm"));
});

document.getElementById("cancelSettings").addEventListener("click", function() {
    restoreSettingValues();
    toggleAlert(document.getElementById("cancelConfirm"));
});

document.getElementById("resetCounter").addEventListener("click", function() {
    page.statLog.resetCounter();
    toggleAlert(document.getElementById("resetCounterConfirm"));
});

document.getElementById("defaultSettings").addEventListener("click", function() {
    page.setDefaults()
    .then(() => {
        restoreSettingValues();
        generateTableOfURLS();
        toggleAlert(document.getElementById("defaultConfirm"));
    });
});
/*
    Cookie WhiteList Logic
*/
//Remove the url where the user clicked
function clickRemoved(event) {
    if(event.target.classList.contains("removeButton")) {
        var URL = event.target.parentElement.textContent;
        //Slice the unicode times from the URL
        URL = URL.slice(1);
        URL = URL.trim();
        //console.log(URL);
        if(page.contextualIdentitiesEnabled) {
            page.whiteList.removeURL(URL, getActiveTabName());
        } else {
            page.whiteList.removeURL(URL);
        }
		generateTableOfURLS();
    }
}

//Gets the active tab name for Containers
function getActiveTabName() {
    if(document.getElementsByClassName("activeTab").length === 0) {
        return "";
    }
    //Returns the second class name
    return document.getElementsByClassName("activeTab")[0].className.split(' ')[1];
}

//Add URL by keyboard input
function addURLFromInput() {
    var input = document.getElementById("URLForm").value;
    if(input) {
        var URL = "http://www." + input;
        if(page.contextualIdentitiesEnabled) {
            page.whiteList.addURL(page.getHostname(URL), getActiveTabName());
        } else {
            page.whiteList.addURL(page.getHostname(URL));
        }
        document.getElementById("URLForm").value = "";
        document.getElementById("URLForm").focus();  
        generateTableOfURLS();   
    }   
}

//Returns a txt string of lines from array
function returnLinesFromArray(arr) {
    var txt = "";
    arr.forEach(function(row) {
        txt += row;
        txt += "\n";
    });
    return txt;
}

//Export the list of URLS as a text file
function downloadTextFile(txt) {
 
    //console.log(txt);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
    hiddenElement.target = '_target';
    hiddenElement.download = 'Cookie_AutoDelete_URLS.txt';

    //Firefox just opens the text rather than downloading it. In Chrome the "else" block of code works.
    //So this is a work around.
    if(browserDetect() === "Firefox") {
        let text = browser.i18n.getMessage("rightClickToSave");
        hiddenElement.appendChild(document.createTextNode(text));
        if(document.getElementById("saveAs").hasChildNodes()) {
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

//Exports the container whitelist
function exportMapToTxt() {
    let txtFile = "";
    page.whiteList.cookieWhiteList.forEach(function(value, key, map) {
        txtFile += "#" + key + "\n";
        txtFile += returnLinesFromArray(Array.from(value));
        txtFile += "\n"

    });
    downloadTextFile(txtFile);
}

//Creates a html table from an array
function generateTableFromArray(array) {
    var arrayLength = array.length;
    var theTable = document.createElement('table');

    for (var i = 0, tr, td; i < arrayLength; i++) {
        tr = document.createElement('tr');
        td = document.createElement('td');
        var removeButton = document.createElement("span");
        removeButton.classList.add("removeButton");
        removeButton.addEventListener("click", clickRemoved);
        removeButton.appendChild(document.createTextNode("\u00D7"));
        td.appendChild(removeButton);
        td.appendChild(document.createTextNode(array[i]));
        tr.appendChild(td);
        theTable.appendChild(tr);
    }
    return theTable;
}

//When the user clicks on a tab container
function openTab(evt, tabContent) {
    // Declare all variables
    var i, tabcontent, tablinks;

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

//Generates the nav above the url table
function generateTabNav() {
    let tableContainerNode = document.getElementById("tableContainer");
    let tabNav = document.createElement("ul");

    tabNav.id = "containerTabs";
    tabNav.classList.add("tab");
        page.whiteList.cookieWhiteList.forEach(function(value, key, map) {
        //Creates the tabbed navigation above the table
        let tab = document.createElement("li");
        let aTag = document.createElement("a");
        aTag.textContent = page.cache.getNameFromCookieID(key);
        aTag.classList.add("tablinks");
        aTag.classList.add(key);
        aTag.addEventListener("click", function(event) {
            openTab(event, key);
        });
        tab.appendChild(aTag);
        tabNav.appendChild(tab);


    });

    tableContainerNode.parentNode.insertBefore(tabNav, tableContainerNode);
    
}

//Generate the url table
function generateTableOfURLS() {
    let tableContainerNode = document.getElementById("tableContainer");
    //console.log(page.cookieWhiteList);
    if(page.contextualIdentitiesEnabled) {
        let activeTabName = getActiveTabName();
        let theTables = document.createElement("div");
            page.whiteList.cookieWhiteList.forEach(function(value, key, map) {
                //Creates a table based on the Cookie ID
                let tabContent = generateTableFromArray(Array.from(value));
                tabContent.classList.add("tabcontent");
                tabContent.id = key;
                theTables.appendChild(tabContent);
                if(activeTabName !== "" && key !== activeTabName) {
                    tabContent.style.display = "none";
                }
            });


        if(document.getElementById('tableContainer').hasChildNodes()) {
            document.getElementById('tableContainer').firstChild.replaceWith(theTables);
        } else {
            document.getElementById('tableContainer').appendChild(theTables);            
        }

    } else {
        let theTable = generateTableFromArray(page.whiteList.returnList());
        if(document.getElementById('tableContainer').hasChildNodes()) {
            document.getElementById('tableContainer').firstChild.replaceWith(theTable);
        } else {
            document.getElementById('tableContainer').appendChild(theTable);            
        }
        
    }
    

}

function generateTable() {
    if(document.contains(document.getElementById("containerTabs"))) {
        document.getElementById("containerTabs").remove();
    }
    if(page.contextualIdentitiesEnabled) {
        generateTabNav();
    
    }
    generateTableOfURLS();
    if(page.contextualIdentitiesEnabled) {
        document.getElementsByClassName("tablinks")[0].click();
    }
}

generateTable();

//Event handler for the Remove All button
document.getElementById("clear").addEventListener("click", function() {
    if(page.contextualIdentitiesEnabled) {
        page.whiteList.clearURL(getActiveTabName());
    } else {
        page.whiteList.clearURL();
    }
    generateTableOfURLS();
});

//Event handler for the user entering a URL through a form
document.getElementById("add").addEventListener("click", addURLFromInput);

//Event handler when the user press "Enter" on a keyboard on the URL Form
document.getElementById("URLForm").addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) {
      addURLFromInput();
    }
});

//Exports urls to a text file
document.getElementById("exportURLS").addEventListener("click", function() {
        exportMapToTxt();
});

//Import URLS by text
document.getElementById("importURLS").addEventListener("change", function() {
	var file = this.files[0];

	var reader = new FileReader();
	reader.onload = function(progressEvent){
	// Entire file
	//console.log(this.result);

	// By lines
	var lines = this.result.split('\n');
    let cookieID = "";
	for(var line = 0; line < lines.length; line++){
	  if(lines[line].charAt(0) == "#") {
        cookieID = lines[line].slice(1);
        line++;
      }
	  if(lines[line] != "") {
	  	page.whiteList.addURL(lines[line], cookieID);
	  }
	}
	generateTableOfURLS();
	};
	reader.readAsText(file);
    //Reset the file uploaded
    document.getElementById("importURLS").type = "";
    document.getElementById("importURLS").type = "file";
});

