var assert = require("chai").assert;
var StatsService = require("../src/services/StatsService");
var browser = require("sinon-chrome");

describe("StatsService class with no items", () => {
	var statsService;
	var items = {};
	global.browser = browser;

	beforeEach(() => {
		statsService = new StatsService(items);
		browser.storage.local.get.resolves({statLoggingSetting: true});
	});

	it("should have been called once for resetCounter", () => {
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("returns 0 for cookieDeletedCounterTotal", () => {
		assert.equal(statsService.cookieDeletedCounterTotal, 0);
	});

	it("returns 0 for cookieDeletedCounter", () => {
		assert.equal(statsService.cookieDeletedCounter, 0);
	});

	it("returns 20 for cookieDeletedCounter for incrementCounter(20)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.equal(statsService.cookieDeletedCounter, 20);
		});
		
	});
	
	it("returns 20 for cookieDeletedCounterTotal for incrementCounter(20)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.equal(statsService.cookieDeletedCounterTotal, 20);
		});
		
	});

	it("calls twice on browser.storage.local.set for incrementCounter(20) (previous one was in resetCounter() at start)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.isTrue(browser.storage.local.set.calledTwice);
		});
		
	});
	afterEach(() => {
        browser.flush();
    });
});

describe("StatsService class with items", () => {
	var statsService;
	var items = {cookieDeletedCounterTotal: 10};
	global.browser = browser;

	beforeEach(() => {
		statsService = new StatsService(items);
		browser.storage.local.get.resolves({statLoggingSetting: true});
	});


	it("returns 10 for cookieDeletedCounterTotal", () => {
		assert.equal(statsService.cookieDeletedCounterTotal, 10);
	});

	it("returns 0 for cookieDeletedCounter", () => {
		assert.equal(statsService.cookieDeletedCounter, 0);
	});


	it("returns 20 for cookieDeletedCounter for incrementCounter(20)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.equal(statsService.cookieDeletedCounter, 20);
		});
		
	});
	
	it("returns 30 for cookieDeletedCounterTotal for incrementCounter(20)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.equal(statsService.cookieDeletedCounterTotal, 30);
		});
		
	});

	it("calls once on browser.storage.local.set for incrementCounter(20)", () => {
		return statsService.incrementCounter(20)
		.then(() => {
			assert.isTrue(browser.storage.local.set.calledOnce);
		});
		
	});


	afterEach(() => {
        browser.flush();
    });

});