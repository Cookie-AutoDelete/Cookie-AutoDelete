import {assert} from "chai";
import {isSafeToClean, cleanCookies, returnSetOfOpenTabDomains} from "../src/services/CleanupService";
// ToDo: cleanCookiesOperation
import browser from "sinon-chrome";
import sinon from "sinon";
import {URL} from "url";
global.URL = URL;

const sampleState = {
	"lists": {
		"default": [
			{
				"expression": "*.google.com",
				"listType": "GREY"
			},
			{
				"expression": "youtube.com",
				"listType": "WHITE"
			}
		],
		"firefox-container-1": [
			{
				"expression": "*.facebook.com",
				"listType": "GREY"
			},
			{
				"expression": "messenger.com",
				"listType": "GREY"
			}
		]
	},
	"cookieDeletedCounterTotal": 0,
	"cookieDeletedCounterSession": 0,
	"settings": {
		"activeMode": {
			"name": "activeMode",
			"value": false,
			"id": 1
		},
		"delayBeforeClean": {
			"name": "delayBeforeClean",
			"value": 1,
			"id": 2
		},
		"statLogging": {
			"name": "statLogging",
			"value": true,
			"id": 3
		},
		"showNumOfCookiesInIcon": {
			"name": "showNumOfCookiesInIcon",
			"value": true,
			"id": 4
		},
		"showNotificationAfterCleanup": {
			"name": "showNotificationAfterCleanup",
			"value": true,
			"id": 5
		},
		"cleanCookiesFromOpenTabsOnStartup": {
			"name": "cleanCookiesFromOpenTabsOnStartup",
			"value": false,
			"id": 6
		},
		"contextualIdentities": {
			"name": "contextualIdentities",
			"value": true,
			"id": 7
		}
	},
	"cache": {}
};

describe("CleanupService", function() {
	global.browser = browser;

	describe("returnSetOfOpenTabDomains()", function() {
		let UsefulFunctions = {
			getHostname() {},
			extractMainDomain() {},
			isAWebpage() {}
		};
		let stub1 = sinon.stub(UsefulFunctions, "getHostname");
		stub1.withArgs("https://google.com/search").returns("google.com");
		stub1.withArgs("http://facebook.com/search").returns("facebook.com");
		stub1.withArgs("http://sub.domain.com").returns("sub.domain.com");

		let stub2 = sinon.stub(UsefulFunctions, "extractMainDomain");
		stub2.withArgs("google.com").returns("google.com");
		stub2.withArgs("facebook.com").returns("facebook.com");
		stub2.withArgs("sub.domain.com").returns("domain.com");

		let stub3 = sinon.stub(UsefulFunctions, "isAWebpage");
		stub3.withArgs("https://google.com/search").returns(true);
		stub3.withArgs("http://facebook.com/search").returns(true);
		stub3.withArgs("http://sub.domain.com").returns(true);
		stub3.withArgs("moz-extension://test/settings/settings.html").returns(false);

		beforeEach(function() {
			global.UsefulFunctions = UsefulFunctions;
			browser.tabs.query.resolves([{
				url: "https://google.com/search"
			}, {
				url: "http://facebook.com/search"
			}, {
				url: "http://sub.domain.com"
			}, {
				url: "moz-extension://test/settings/settings.html"
			}]);
		});

		it("should have google.com in set", function() {
			return returnSetOfOpenTabDomains()
				.then((results) => {
					assert.isTrue(results.has("google.com"));
					return Promise.resolve();
				});
		});

		it("should have facebook.com in set", function() {
			return returnSetOfOpenTabDomains()
				.then((results) => {
					assert.isTrue(results.has("facebook.com"));
					return Promise.resolve();
				});
		});

		it("should have domain.com in set", function() {
			return returnSetOfOpenTabDomains()
				.then((results) => {
					assert.isTrue(results.has("domain.com"));
					return Promise.resolve();
				});
		});

		it("should have length 3 in set", function() {
			return returnSetOfOpenTabDomains()
				.then((results) => {
					assert.strictEqual(results.size, 3);
					return Promise.resolve();
				});
		});

		it("should not have youtube.com in set", function() {
			return returnSetOfOpenTabDomains()
				.then((results) => {
					assert.isFalse(results.has("youtube.com"));
					return Promise.resolve();
				});
		});

		after(function() {
			stub1.restore();
			stub2.restore();
			stub3.restore();
			delete global.UsefulFunctions;
		});
	});

	describe("isSafeToClean()", function() {
		const cleanupProperties = {
			greyCleanup: false,
			ignoreOpenTabs: false,
			openTabDomains: new Set(["example.com", "mozilla.org"]),
			cachedResults: {}
		};

		it("should return true for yahoo.com", function() {
			const cookieProperty = {
				mainDomain: "yahoo.com", hostname: "yahoo.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isTrue(result);
		});

		it("should return false for youtube.com", function() {
			const cookieProperty = {
				mainDomain: "youtube.com", hostname: "youtube.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isFalse(result);
		});

		it("should return true for sub.youtube.com", function() {
			const cookieProperty = {
				mainDomain: "youtube.com", hostname: "sub.youtube.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isTrue(result);
		});

		it("should return false for google.com", function() {
			const cookieProperty = {
				mainDomain: "google.com", hostname: "google.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isFalse(result);
		});

		it("should return true for google.com in Personal", function() {
			const cookieProperty = {
				mainDomain: "google.com", hostname: "google.com", storeId: "firefox-container-1"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isTrue(result);
		});

		it("should return false for sub.google.com", function() {
			const cookieProperty = {
				mainDomain: "google.com", hostname: "sub.google.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isFalse(result);
		});

		it("should return false for example.com", function() {
			const cookieProperty = {
				mainDomain: "example.com", hostname: "example.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isFalse(result);
		});

		it("should return false for sub.example.com", function() {
			const cookieProperty = {
				mainDomain: "example.com", hostname: "sub.example.com", storeId: "firefox-default"
			};

			const result = isSafeToClean(sampleState, cookieProperty, cleanupProperties);
			assert.isFalse(result);
		});

		it("should return true for Facebook in Personal onStartup with Facebook in the Greylist", function() {
			const cookieProperty = {
				mainDomain: "facebook.com", hostname: "facebook.com", storeId: "firefox-container-1"
			};

			const result = isSafeToClean(sampleState, cookieProperty, {
				...cleanupProperties, greyCleanup: true
			});
			assert.isTrue(result);
		});
	});

	describe("cleanCookies()", function() {
		const googleCookie = {
			name: "NID", domain: "google.com", secure: true, path: "/", storeId: "firefox-default"
		};
		const youtubeCookie = {
			name: "SID", domain: "youtube.com", secure: true, path: "/", storeId: "firefox-default"
		};
		const yahooCookie = {
			name: "BID", domain: "yahoo.com", secure: false, path: "/login", storeId: "firefox-default"
		};

		const personalGoogleCookie = {
			name: "NID", domain: "google.com", secure: true, path: "/", storeId: "firefox-container-1"
		};

		const cookies = [googleCookie, youtubeCookie, yahooCookie, personalGoogleCookie];

		it("should be called twice for cookies.remove", function() {
			let cleanupProperties = {
				greyCleanup: false,
				ignoreOpenTabs: false,
				openTabDomains: new Set(["example.com", "mozilla.org"]),
				setOfDeletedDomainCookies: new Set(),
				hostnamesDeleted: new Set(),
				cachedResults: {}
			};

			cleanCookies(sampleState, cookies, cleanupProperties);
			assert.isTrue(browser.cookies.remove.calledTwice);
		});
	});

	// describe("cleanCookiesOperation()", function() {
	//
	//   let resolveStub = sinon.stub(browser.contextualIdentities, "query");
	// 	// let stub1;
	// 	// let stub2;
	//   //
	// 	beforeEach(function() {
	// 		// stub1 = sinon.stub(cleanupService, "cleanCookies");
	// 		// stub1.resolves(new Set(["facebook.com", "amazon.com"]));
	//     //
	// 		// stub2 = sinon.stub(cleanupService, "returnSetOfOpenTabDomains");
	// 		// stub2.resolves({});
	// 		browser.cookies.getAll.resolves({});
	//     resolveStub.resolves([{cookieStoreId: "firefox-container-1"}, {cookieStoreId: "firefox-container-2"}, {cookieStoreId: "firefox-container-3"}, {cookieStoreId: "firefox-container-4"}]);
	// 	});
	//
	//
	// 	it("should return 5 for call count of browser.cookies.getAll with contextualIdentities enabled", function() {
	// 		return cleanCookiesOperation(sampleState, {greyCleanup: false, ignoreOpenTabs: false})
	// 		.then((setOfDeletedDomainCookies) => {
	// 			assert.strictEqual(browser.cookies.getAll.callCount, 5);
	// 			return Promise.resolve();
	// 		});
	// 	});
	//
	// 	// after(function() {
	// 	// 	stub1.restore();
	// 	// });
	// });

	afterEach(function() {
		browser.flush();
	});
});
