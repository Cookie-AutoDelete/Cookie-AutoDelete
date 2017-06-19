var assert = require("chai").assert;
var WhiteListService = require("../src/services/WhiteListService");
var browser = require("sinon-chrome");

describe("WhiteListService with Contextual Identities Off", () => {
	var statsService;
	var items = {defaultWhiteList: ["youtube.com", "google.com", "facebook.com"]};
	global.browser = browser;

	beforeEach(() => {
		whiteListService = new WhiteListService(items);
	});

	it("hasHost() should return true for youtube.com", () => {
		assert.isTrue(whiteListService.hasHost("youtube.com"));
	});

	it("hasHost() should return false for foo.com", () => {
		assert.isFalse(whiteListService.hasHost("foo.com"));
	});


	it("returns [youtube.com, google.com, facebook.com] for returnList()", () => {
		assert.sameMembers(whiteListService.returnList(), ["youtube.com", "google.com", "facebook.com"]);
	});

	it("addURL() for yahoo.com and it should exist", () => {
		whiteListService.addURL("yahoo.com");
		assert.isTrue(whiteListService.hasHost("yahoo.com"));
	});

	it("removeURL() for google.com and it should not exist", () => {
		whiteListService.removeURL("google.com");
		assert.isFalse(whiteListService.hasHost("google.com"));
	});

	it("clearURL() should not have anything in the whitelist", () => {
		whiteListService.clearURL();
		assert.isFalse(whiteListService.hasHost("youtube.com"));
		assert.isFalse(whiteListService.hasHost("google.com"));
		assert.isFalse(whiteListService.hasHost("facebook.com"));
	});

	describe("constructor with no defaultWhiteList", () => {
		let items = {};
		let whiteListService = new WhiteListService(items);
		it("should return an empty list for defaultWhiteList", () => {
			assert.sameMembers(whiteListService.returnList("defaultWhiteList"), []);
		});
	});

	afterEach(() => {
        browser.flush();
    });
});

describe("WhiteListService with Contextual Identities On", () => {
	var statsService;
	var items = {firefox_container_1: ["youtube.com", "google.com", "facebook.com"],
				'firefox_container_1-Grey': ["mozilla.org"],
				firefox_container_2: ["github.com"]
				};
	var cache = { 
		nameCacheMap: new Map()
	};

	cache.nameCacheMap.set("firefox_container_1", "Personal");
	cache.nameCacheMap.set("firefox_container_2", "Work");
	cache.nameCacheMap.set("firefox_container_5", "Play");
	cache.nameCacheMap.set("firefox-default", "Default");

	cache.nameCacheMap.set("firefox_container_1-Grey", "Personal-Grey");
	cache.nameCacheMap.set("firefox_container_2-Grey", "Work-Grey");
	cache.nameCacheMap.set("firefox_container_5-Grey", "Play-Grey");
	cache.nameCacheMap.set("firefox-default-Grey", "Default-Grey");

	global.browser = browser;

	beforeEach(() => {
		whiteListService = new WhiteListService(items, true, cache);
	});
	
	describe("constructor with firefox-default in items", () => {
		var firefoxDefault = "firefox-default";
		let items = [];
		items[firefoxDefault] = ["youtube.com", "google.com", "facebook.com"];
		let whiteListService;
		beforeEach(() => {
			whiteListService = new WhiteListService(items, true, cache);
		});
		
		it("should return [youtube.com, google.com, facebook.com]} for firefox-default", () => {
			assert.sameMembers(whiteListService.returnList(firefoxDefault), ["youtube.com", "google.com", "facebook.com"]);
		});
	});

	describe("constructor with no firefox_container_5 in items", () => {

		it("should return an empty list for firefox_container_5", () => {
			assert.sameMembers(whiteListService.returnList("firefox_container_5"), []);
		});

	});

	it("hasHost() should return true for youtube.com in Personal", () => {
		assert.isTrue(whiteListService.hasHost("youtube.com", "firefox_container_1"));
	});

	it("hasHost() should return true for github.com in Work", () => {
		assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
	});

	it("hasHost() should return false for youtube.com in Work", () => {
		assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_2"));
	});

	it("hasHost() should return false for google.com in non existant container", () => {
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_3"));
	});

	it("hasHostSubdomain() should return true for youtube.com in Personal", () => {
		assert.isTrue(whiteListService.hasHostSubdomain("youtube.com", "sub.youtube.com", "firefox_container_1"));
	});

	it("hasHostInWhiteOrGrey() should return true for youtube.com in Personal", () => {
		assert.isTrue(whiteListService.hasHostInWhiteOrGrey("youtube.com", "sub.youtube.com", "firefox_container_1"));
	});

	it("hasHostInWhiteOrGrey() should return true for mozilla.org in Personal", () => {
		assert.isTrue(whiteListService.hasHostInWhiteOrGrey("mozilla.org", "sub.mozilla.org", "firefox_container_1"));
	});

	it("hasHostInWhiteOrGrey() should return false for test.com in Personal", () => {
		assert.isFalse(whiteListService.hasHostInWhiteOrGrey("test.com", "test.com", "firefox_container_1"));
	});

	it("returns [youtube.com, google.com, facebook.com] for returnList() in Personal", () => {
		assert.sameMembers(whiteListService.returnList("firefox_container_1"), ["youtube.com", "google.com", "facebook.com"]);
	});

	it("returns [github.com] for returnList() in Work", () => {
		assert.sameMembers(whiteListService.returnList("firefox_container_2"), ["github.com"]);
	});

	it("returns [] for returnList() in non existant container", () => {
		assert.sameMembers(whiteListService.returnList("firefox_container_3"), []);
	});

	it("addURL() for yahoo.com and it should exist in Work but not Personal", () => {
		whiteListService.addURL("yahoo.com", "firefox_container_2");
		assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
		assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
	});


	it("removeURL() for google.com and it should return false for Personal and Work", () => {
		whiteListService.removeURL("google.com", "firefox_container_1");
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
	});

	// it("removeURLFromLists() for google.com and it should return false for Personal and Work", () => {
	// 	whiteListService.removeURL("google.com", "firefox_container_1");
	// 	assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
	// 	assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
	// });

	it("removeURL() for twitter.com in a non existant container and it should create the container", () => {
		whiteListService.removeURL("twitter.com", "firefox_container_3");
		assert.isTrue(whiteListService.cookieWhiteList.has("firefox_container_3"));
	});

	it("clearURL() should not have anything in the whitelist in Personal but not affect Work", () => {
		whiteListService.clearURL("firefox_container_1");
		assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("facebook.com", "firefox_container_1"));
		assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
	});

	afterEach(() => {
        browser.flush();
    });
});
