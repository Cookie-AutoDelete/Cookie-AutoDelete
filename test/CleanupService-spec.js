var assert = require("chai").assert;
var CleanupService = require("../src/services/CleanupService");
var browser = require("sinon-chrome");
var sinon = require("sinon");

describe("CleanupService with Contextual Identities Off", () => {
	var cleanupService;
	var items = {defaultWhiteList: ["youtube.com", "google.com", "facebook.com"]};
	global.browser = browser;

	var cache = { 
		nameCacheMap: new Map()
	};
	cache.nameCacheMap.set("firefox_container_1", "Personal");
	cache.nameCacheMap.set("firefox_container_2", "Work");
	cache.nameCacheMap.set("firefox_container_3", "Finance");
	cache.nameCacheMap.set("firefox_container_4", "Shopping");

	beforeEach(() => {
		cleanupService = new CleanupService();
	});

	it("recentlyCleaned should be 0", () => {
		assert.strictEqual(cleanupService.recentlyCleaned, 0);
	});

	describe("prepareCookieDomain()", () => {
		it("should return https://google.com", () => {
			assert.strictEqual(cleanupService.prepareCookieDomain({domain: "google.com", secure: true}), "https://google.com");
		});

		it("should return http://google.com with a removed leading .", () => {
			assert.strictEqual(cleanupService.prepareCookieDomain({domain: ".google.com", secure: false}), "http://google.com");
		});
	});

	describe("returnSetOfOpenTabDomains()", () => {
		var UsefulFunctions = {
			getHostname: function() {},
			extractMainDomain: function() {},
			isAWebpage: function() {}
		}
		var stub1 = sinon.stub(UsefulFunctions,"getHostname");
		stub1.withArgs("https://google.com/search").returns("google.com");
		stub1.withArgs("http://facebook.com/search").returns("facebook.com");
		stub1.withArgs("http://sub.domain.com").returns("sub.domain.com");


		var stub2 = sinon.stub(UsefulFunctions,"extractMainDomain");
		stub2.withArgs("google.com").returns("google.com");
		stub2.withArgs("facebook.com").returns("facebook.com");
		stub2.withArgs("sub.domain.com").returns("domain.com");

		var stub3 = sinon.stub(UsefulFunctions,"isAWebpage");
		stub3.withArgs("https://google.com/search").returns(true);
		stub3.withArgs("http://facebook.com/search").returns(true);
		stub3.withArgs("http://sub.domain.com").returns(true);
		stub3.withArgs("moz-extension://test/settings/settings.html").returns(false);

		global.UsefulFunctions = UsefulFunctions;

		beforeEach(() => {
			browser.tabs.query.resolves([{url: "https://google.com/search"}, {url: "http://facebook.com/search"}, {url: "http://sub.domain.com"}, {url: "moz-extension://test/settings/settings.html"}]);
		});

		it("should have google.com in set", () => {
			return cleanupService.returnSetOfOpenTabDomains()
			.then((results) => {
				assert.isTrue(results.has("google.com"));
			});

			
		});

		it("should have facebook.com in set", () => {
			return cleanupService.returnSetOfOpenTabDomains()
			.then((results) => {
				assert.isTrue(results.has("facebook.com"));
			});
		});

		it("should have domain.com in set", () => {
			return cleanupService.returnSetOfOpenTabDomains()
			.then((results) => {
				assert.isTrue(results.has("domain.com"));
			});
		});

		it("should have length 3 in set", () => {
			return cleanupService.returnSetOfOpenTabDomains()
			.then((results) => {
				assert.strictEqual(results.size, 3);
			});
		});

		it("should not have youtube.com in set", () => {
			return cleanupService.returnSetOfOpenTabDomains()
			.then((results) => {
				assert.isFalse(results.has("youtube.com"));
			});
			
		});

		after(() => {
			stub1.restore();
			stub2.restore();
			stub3.restore();
			delete global.UsefulFunctions;
		});
	});

	// describe("isSafeToClean()", () => {
	// 	beforeEach(() => {
		
	// 	});

	// 	it("should return https://google.com", () => {
	// 		assert.strictEqual(cleanupService.prepareCookieDomain({domain: "google.com", secure: true}), "https://google.com");
	// 	});

		
	// });

	// describe("cleanCookiesOperation()", () => {
	// 	it("should return https://google.com", () => {
	// 		assert.strictEqual(cleanupService.prepareCookieDomain({domain: "google.com", secure: true}), "https://google.com");
	// 	});

	// 	it("should return http://google.com with a removed leading .", () => {
	// 		assert.strictEqual(cleanupService.prepareCookieDomain({domain: ".google.com", secure: false}), "http://google.com");
	// 	});
	// });




	afterEach(() => {
        browser.flush();
    });
});

