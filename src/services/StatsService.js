class StatsService {
	constructor(items) {
		this.cookieDeletedCounter = 0;
		if (items.cookieDeletedCounterTotal === undefined) {
			this.resetCounter();
		} else {
			this.cookieDeletedCounterTotal = items.cookieDeletedCounterTotal;
		}
	}

	// Increment the counter and store the counter to local after 1 minute
	incrementCounter(recentlyCleaned) {
		return browser.storage.local.get("statLoggingSetting")
		.then((items) => {
			if (items.statLoggingSetting === true) {
				this.cookieDeletedCounterTotal += recentlyCleaned;
				this.cookieDeletedCounter += recentlyCleaned;
				return this.storeCounterToLocal();
			}
			return Promise.resolve();
		});
	}

	// Resets the counter
	resetCounter() {
		browser.storage.local.set({cookieDeletedCounterTotal: 0});
		this.cookieDeletedCounterTotal = 0;
		this.cookieDeletedCounter = 0;
	}

	// Stores the total cookie entries deleted to local
	storeCounterToLocal() {
		return browser.storage.local.set({cookieDeletedCounterTotal: this.cookieDeletedCounterTotal});
	}
}

module.exports = StatsService;
