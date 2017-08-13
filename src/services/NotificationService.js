class NotificationService {
	constructor() {
		this.notifyMessage = "";
		this.cookieNotifyDone = "cookieNotifyDone";
	}

	// Creates a notification of what cookies were cleaned and how many
	notifyCookieCleanUp(recentlyCleaned, setOfDeletedDomainCookies) {
		// Format the string
		if (setOfDeletedDomainCookies.size > 0) {
			let stringOfDomains = "";
			let commaAppendIndex = 0;
			setOfDeletedDomainCookies.forEach((value1, value2, set) => {
				stringOfDomains += value2;
				commaAppendIndex++;
				if (commaAppendIndex < setOfDeletedDomainCookies.size) {
					stringOfDomains += ", ";
				}
			});
			// this.notifyMessage = recentlyCleaned + " Deleted Cookies from: " + stringOfDomains;
			this.notifyMessage = browser.i18n.getMessage("notificationContent", [recentlyCleaned, stringOfDomains]);
		}

		return browser.storage.local.get("notifyCookieCleanUpSetting")
		.then((items) => {
			if (setOfDeletedDomainCookies.size > 0 && items.notifyCookieCleanUpSetting) {
				return browser.notifications.create(this.cookieNotifyDone, {
					"type": "basic",
					"iconUrl": browser.extension.getURL("icons/icon_48.png"),
					"title": browser.i18n.getMessage("notificationTitle"),
					"message": this.notifyMessage
				});
			}
			return Promise.resolve();
		});
	}

}

module.exports = NotificationService;
