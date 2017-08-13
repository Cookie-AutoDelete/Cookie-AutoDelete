let assert = require("chai").assert;
let StatsService = require("../src/services/StatsService");
let browser = require("sinon-chrome");

describe("StatsService", function() {
	describe("StatsService class with no items", function() {
		let statsService;
		let items = {};
		global.browser = browser;

		beforeEach(function() {
			statsService = new StatsService(items);
		});

		it("should have been called once for resetCounter", function() {
			assert.isTrue(browser.storage.local.set.calledOnce);
		});

		it("should returns 0 for cookieDeletedCounterTotal", function() {
			assert.strictEqual(statsService.cookieDeletedCounterTotal, 0);
		});

		it("should returns 0 for cookieDeletedCounter", function() {
			assert.strictEqual(statsService.cookieDeletedCounter, 0);
		});

		describe("incrementCounter()", function() {
			beforeEach(function() {
				// statsService = new StatsService(items);
				browser.storage.local.get.resolves({statLoggingSetting: true});
			});

			it("should returns 20 for cookieDeletedCounter for incrementCounter(20)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.strictEqual(statsService.cookieDeletedCounter, 20);
					return Promise.resolve();
				});
			});

			it("should returns 20 for cookieDeletedCounterTotal for incrementCounter(20)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.strictEqual(statsService.cookieDeletedCounterTotal, 20);
					return Promise.resolve();
				});
			});

			it("should calls twice on browser.storage.local.set for incrementCounter(20) (previous one was in resetCounter() at start)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.isTrue(browser.storage.local.set.calledTwice);
					return Promise.resolve();
				});
			});

			describe("incrementCounter() with stat logging off", function() {
				beforeEach(function() {
					browser.storage.local.get.resolves({statLoggingSetting: false});
				});

				it("should returns 0 for cookieDeletedCounter for incrementCounter(20)", function() {
					return statsService.incrementCounter(20)
					.then(function() {
						assert.strictEqual(statsService.cookieDeletedCounter, 0);
						return Promise.resolve();
					});
				});

				it("should returns 0 for cookieDeletedCounterTotal for incrementCounter(20)", function() {
					return statsService.incrementCounter(20)
					.then(function() {
						assert.strictEqual(statsService.cookieDeletedCounterTotal, 0);
						return Promise.resolve();
					});
				});

				it("should calls once on browser.storage.local.set for incrementCounter(20) (only at start)", function() {
					return statsService.incrementCounter(20)
					.then(function() {
						assert.isTrue(browser.storage.local.set.calledOnce);
						return Promise.resolve();
					});
				});
			});
		});

		afterEach(function() {
			browser.flush();
		});
	});

	describe("StatsService class with items", function() {
		let statsService;
		let items = {cookieDeletedCounterTotal: 10};
		global.browser = browser;

		beforeEach(function() {
			statsService = new StatsService(items);
			browser.storage.local.get.resolves({statLoggingSetting: true});
		});

		it("should returns 10 for cookieDeletedCounterTotal", function() {
			assert.strictEqual(statsService.cookieDeletedCounterTotal, 10);
		});

		it("should returns 0 for cookieDeletedCounter", function() {
			assert.strictEqual(statsService.cookieDeletedCounter, 0);
		});

		describe("incrementCounter()", function() {
			beforeEach(function() {
				// statsService = new StatsService(items);
				browser.storage.local.get.resolves({statLoggingSetting: true});
			});

			it("should returns 20 for cookieDeletedCounter for incrementCounter(20)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.strictEqual(statsService.cookieDeletedCounter, 20);
					return Promise.resolve();
				});
			});

			it("should returns 30 for cookieDeletedCounterTotal for incrementCounter(20)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.strictEqual(statsService.cookieDeletedCounterTotal, 30);
					return Promise.resolve();
				});
			});

			it("should calls once on browser.storage.local.set for incrementCounter(20)", function() {
				return statsService.incrementCounter(20)
				.then(function() {
					assert.isTrue(browser.storage.local.set.calledOnce);
					return Promise.resolve();
				});
			});
		});

		afterEach(function() {
			browser.flush();
		});
	});
});
