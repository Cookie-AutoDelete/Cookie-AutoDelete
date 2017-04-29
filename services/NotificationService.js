class NotificationService {
	constructor() {
		this.notifyMessage = "";
		this.cookieNotifyDone = "cookieNotifyDone";
	}

	//Creates a notification of what cookies were cleaned and how many
	notifyCookieCleanUp (recentlyCleaned, setOfDeletedDomainCookies) {
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
			this.notifyMessage = recentlyCleaned + " Deleted Cookies from: " + stringOfDomains;
		}
	

		browser.storage.local.get("notifyCookieCleanUpSetting")
		.then((items) => {
			if(setOfDeletedDomainCookies.size > 0 && items.notifyCookieCleanUpSetting) {
			return browser.notifications.create(this.cookieNotifyDone, {
					"type": "basic",
					"iconUrl": browser.extension.getURL("icons/icon_48.png"),
					"title": "Cookie AutoDelete: Cookies were Deleted!",
					"message": this.notifyMessage
				});
			}
		});
	
	}
}




