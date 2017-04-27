var notifyMessage = "";
const cookieNotifyDone = "cookieNotifyDone";

function NotificationService() {
	
}


//Creates a notification of what cookies were cleaned and how many
NotificationService.prototype.notifyCookieCleanUp = function (setOfDeletedDomainCookies) {
	if(setOfDeletedDomainCookies.size > 0) {
		let stringOfDomains = "";
		let commaAppendIndex = 0;
		setOfDeletedDomainCookies.forEach(function(value1, value2, set) {
			stringOfDomains = stringOfDomains + value2;
			commaAppendIndex++;
			if(commaAppendIndex < setOfDeletedDomainCookies.size) {
				stringOfDomains = stringOfDomains + ", ";
			}
			
		}); 
		notifyMessage = recentlyCleaned + " Deleted Cookies from: " + stringOfDomains;
	}
	
	browser.storage.local.get("notifyCookieCleanUpSetting")
	.then(function(items) {
		if(setOfDeletedDomainCookies.size > 0 && items.notifyCookieCleanUpSetting) {
		return browser.notifications.create(cookieNotifyDone, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/icon_48.png"),
				"title": "Cookie AutoDelete: Cookies were Deleted!",
				"message": notifyMessage
			});
		}
	});
	
}