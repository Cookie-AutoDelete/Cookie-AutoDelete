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
    var activeTab = tabs[0];
	hostUrl = page.getHostname(activeTab.url);
	hostUrl = page.extractMainDomain(hostUrl);
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

	//Sets the checkbox depending on the if it exists in the set
	if(page.hasHost(hostUrl)) {
		switchToWhiteList.checked = true; 
	} else {
		switchToWhiteList.checked = false; 
	}
	
}


//Initialize variables
var hostUrl;
var switchToWhiteList = document.getElementById("switchToWhiteList");
var page = browser.extension.getBackgroundPage();
browser.tabs.query({currentWindow: true, active: true})
.then(fillPopup);


//Checkbox Event Handling
switchToWhiteList.addEventListener("click", function() {
	if(switchToWhiteList.checked) {
		page.addURL(hostUrl);
	} else {
		page.removeURL(hostUrl);
		
	}
});

//Setting Click Handling
document.getElementById("settings").addEventListener("click", function() {
	browser.runtime.openOptionsPage();
});

//Clear all history for a domain
document.getElementById('cookieCleanup').addEventListener('click', function(e) {

	page.cleanCookies();
	animateSuccess(this);
	// if (!hostUrl) {
	// 	return;
	// }

 //    e.preventDefault();
	

	
});