let assert = require("chai").assert;
let WhiteListService = require("../src/services/WhiteListService");
let browser = require("sinon-chrome");

describe("WhiteListService", function() {
	let whiteListService;

	describe("WhiteListService with Contextual Identities Off", function() {
		let items = {
			"defaultWhiteList": ["youtube.com", "google.com", "facebook.com"],
			"defaultWhiteList-Grey": ["github.com"]
		};
		global.browser = browser;

		beforeEach(function() {
			whiteListService = new WhiteListService(items);
		});

		describe("hasHost()", function() {
			it("should return true for youtube.com", function() {
				assert.isTrue(whiteListService.hasHost("youtube.com"));
			});

			it("should return false for foo.com", function() {
				assert.isFalse(whiteListService.hasHost("foo.com"));
			});

			it("should return true for github.com in GreyList", function() {
				assert.isTrue(whiteListService.hasHost("github.com", "defaultWhiteList-Grey"));
			});
		});

		describe("returnList()", function() {
			it("should returns [youtube.com, google.com, facebook.com]", function() {
				assert.sameMembers(whiteListService.returnList(), ["youtube.com", "google.com", "facebook.com"]);
			});
		});

		describe("addURL()", function() {
			it("should have yahoo.com in defaultWhiteList", function() {
				whiteListService.addURL("yahoo.com");
				assert.isTrue(whiteListService.hasHost("yahoo.com"));
			});
		});

		describe("removeURL()", function() {
			it("should not exist in the whiteList for google.com ", function() {
				whiteListService.removeURL("google.com");
				assert.isFalse(whiteListService.hasHost("google.com"));
			});
		});

		describe("clearURL()", function() {
			it("should not have anything in the whitelist or greylist", function() {
				whiteListService.clearURL();
				assert.isFalse(whiteListService.hasHost("youtube.com"));
				assert.isFalse(whiteListService.hasHost("google.com"));
				assert.isFalse(whiteListService.hasHost("facebook.com"));
				assert.isFalse(whiteListService.hasHost("github.com", "defaultWhiteList-Grey"));
			});
		});

		describe("constructor with no defaultWhiteList", function() {
			let items = {};
			let whiteListService = new WhiteListService(items);
			it("should return an empty list for defaultWhiteList and defaultWhiteList-Grey", function() {
				assert.sameMembers(whiteListService.returnList("defaultWhiteList"), []);
				assert.sameMembers(whiteListService.returnList("defaultWhiteList-Grey"), []);
			});
		});

		afterEach(function() {
			browser.flush();
		});
	});

	describe("WhiteListService with Contextual Identities On", function() {
		let items = {
			"firefox_container_1": ["youtube.com", "google.com", "facebook.com"],
			"firefox_container_1-Grey": ["mozilla.org"],
			"firefox_container_2": ["github.com"]
		};
		let cache = {nameCacheMap: new Map()};

		cache.nameCacheMap.set("firefox_container_1", "Personal");
		cache.nameCacheMap.set("firefox_container_2", "Work");
		cache.nameCacheMap.set("firefox_container_5", "Play");
		cache.nameCacheMap.set("firefox-default", "Default");

		cache.nameCacheMap.set("firefox_container_1-Grey", "Personal-Grey");
		cache.nameCacheMap.set("firefox_container_2-Grey", "Work-Grey");
		cache.nameCacheMap.set("firefox_container_5-Grey", "Play-Grey");
		cache.nameCacheMap.set("firefox-default-Grey", "Default-Grey");

		global.browser = browser;

		beforeEach(function() {
			whiteListService = new WhiteListService(items, true, cache);
		});

		describe("constructor with firefox-default in items", function() {
			let firefoxDefault = "firefox-default";
			let items = [];
			items[firefoxDefault] = ["youtube.com", "google.com", "facebook.com"];
			let whiteListService;
			beforeEach(function() {
				whiteListService = new WhiteListService(items, true, cache);
			});

			it("should return [youtube.com, google.com, facebook.com]} for firefox-default", function() {
				assert.sameMembers(whiteListService.returnList(firefoxDefault), ["youtube.com", "google.com", "facebook.com"]);
			});
		});

		describe("constructor with no firefox_container_5 in items", function() {
			it("should return an empty list for firefox_container_5", function() {
				assert.sameMembers(whiteListService.returnList("firefox_container_5"), []);
			});
		});

		describe("hasHost()", function() {
			it("should return true for youtube.com in Personal", function() {
				assert.isTrue(whiteListService.hasHost("youtube.com", "firefox_container_1"));
			});

			it("should return true for github.com in Work", function() {
				assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
			});

			it("should return false for youtube.com in Work", function() {
				assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_2"));
			});

			it("should return false for google.com in non existant container", function() {
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_3"));
			});
		});

		describe("hasHostSubdomain()", function() {
			it("should return true for youtube.com in Personal", function() {
				assert.isTrue(whiteListService.hasHostSubdomain("youtube.com", "sub.youtube.com", "firefox_container_1"));
			});
		});

		describe("hasHostInWhiteOrGrey()", function() {
			it("should return true for youtube.com in Personal", function() {
				assert.isTrue(whiteListService.hasHostInWhiteOrGrey("youtube.com", "sub.youtube.com", "firefox_container_1"));
			});

			it("should return true for mozilla.org in Personal", function() {
				assert.isTrue(whiteListService.hasHostInWhiteOrGrey("mozilla.org", "sub.mozilla.org", "firefox_container_1"));
			});

			it("should return false for test.com in Personal", function() {
				assert.isFalse(whiteListService.hasHostInWhiteOrGrey("test.com", "test.com", "firefox_container_1"));
			});
		});

		describe("returnList()", function() {
			it("should returns [youtube.com, google.com, facebook.com] in Personal", function() {
				assert.sameMembers(whiteListService.returnList("firefox_container_1"), ["youtube.com", "google.com", "facebook.com"]);
			});

			it("should returns [github.com] in Work", function() {
				assert.sameMembers(whiteListService.returnList("firefox_container_2"), ["github.com"]);
			});

			it("should returns [] in non existant container", function() {
				assert.sameMembers(whiteListService.returnList("firefox_container_3"), []);
			});
		});

		describe("addURL()", function() {
			it("should exist in Work but not Personal yahoo.com", function() {
				whiteListService.addURL("yahoo.com", "firefox_container_2");
				assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
				assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
			});

			it("should create the container for github.com in a non existant container", function() {
				whiteListService.addURL("github.com", "firefox_container_3");
				assert.isTrue(whiteListService.cookieWhiteList.has("firefox_container_3"));
				assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_3"));
			});
		});

		describe("removeURL()", function() {
			it("should return false for Personal and Work for google.com ", function() {
				whiteListService.removeURL("google.com", "firefox_container_1");
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
			});

			it("should create the container for twitter.com in a non existant container", function() {
				whiteListService.removeURL("twitter.com", "firefox_container_3");
				assert.isTrue(whiteListService.cookieWhiteList.has("firefox_container_3"));
				assert.isFalse(whiteListService.hasHost("twitter.com", "firefox_container_3"));
			});
		});

		describe("removeURLFromLists()", function() {
			it("should return false for Personal and Work for google.com", function() {
				whiteListService.removeURL("google.com", "firefox_container_1");
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
			});
		});

		describe("returnOtherList()", function() {
			it("should returns defaultWhiteList for defaultWhiteList-Grey", function() {
				let results = whiteListService.returnOtherList("defaultWhiteList-Grey");
				assert.strictEqual(results, "defaultWhiteList");
			});

			it("should returns firefox_container_2-Grey for firefox_container_2", function() {
				let results = whiteListService.returnOtherList("firefox_container_2");
				assert.strictEqual(results, "firefox_container_2-Grey");
			});
		});

		describe("clearURL()", function() {
			it("should not have anything in the whitelist in Personal but not affect Work", function() {
				whiteListService.clearURL("firefox_container_1");
				assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_1"));
				assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
				assert.isFalse(whiteListService.hasHost("facebook.com", "firefox_container_1"));
				assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
			});
		});

		afterEach(function() {
			browser.flush();
		});
	});
});
