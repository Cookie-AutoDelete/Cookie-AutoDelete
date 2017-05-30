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
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("removeURL() for google.com and it should not exist", () => {
		whiteListService.removeURL("google.com");
		assert.isFalse(whiteListService.hasHost("google.com"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("clearURL() should not have anything in the whitelist", () => {
		whiteListService.clearURL();
		assert.isFalse(whiteListService.hasHost("youtube.com"));
		assert.isFalse(whiteListService.hasHost("google.com"));
		assert.isFalse(whiteListService.hasHost("facebook.com"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	afterEach(() => {
        browser.flush();
    });
});

describe("WhiteListService with Contextual Identities On", () => {
	var statsService;
	var items = {firefox_container_1: ["youtube.com", "google.com", "facebook.com"],
				firefox_container_2: ["github.com"]
				};
	var cache = { 
		nameCacheMap: new Map()
	};

	cache.nameCacheMap.set("firefox_container_1", "Personal");
	cache.nameCacheMap.set("firefox_container_2", "Work");
	
	global.browser = browser;

	beforeEach(() => {
		whiteListService = new WhiteListService(items, true, cache);
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


	it("returns [youtube.com, google.com, facebook.com] for returnList() in Personal", () => {
		assert.sameMembers(whiteListService.returnList("firefox_container_1"), ["youtube.com", "google.com", "facebook.com"]);
	});

	it("returns [github.com] for returnList() in Work", () => {
		assert.sameMembers(whiteListService.returnList("firefox_container_2"), ["github.com"]);
	});

	it("addURL() for yahoo.com and it should exist in Work but not Personal", () => {
		whiteListService.addURL("yahoo.com", "firefox_container_2");
		assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
		assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("removeURL() for google.com and it should return false for Personal and Work", () => {
		whiteListService.removeURL("google.com", "firefox_container_1");
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("clearURL() should not have anything in the whitelist in Personal but not affect Work", () => {
		whiteListService.clearURL("firefox_container_1");
		assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("facebook.com", "firefox_container_1"));
		assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	afterEach(() => {
        browser.flush();
    });
});