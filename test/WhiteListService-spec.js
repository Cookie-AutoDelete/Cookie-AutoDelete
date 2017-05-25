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

	it("hasHost() for youtube.com", () => {
		assert.isTrue(whiteListService.hasHost("youtube.com"));
	});

	it("hasHost() for a site not in the whitelist", () => {
		assert.isFalse(whiteListService.hasHost("foo.com"));
	});


	it("returns array length 3 for returnList()", () => {
		assert.equal(whiteListService.returnList().length, 3);
	});

	it("addURL() for yahoo.com and see if it exists", () => {
		whiteListService.addURL("yahoo.com");
		assert.isTrue(whiteListService.hasHost("yahoo.com"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("removeURL() for google.com and see if it exists", () => {
		whiteListService.removeURL("google.com");
		assert.isFalse(whiteListService.hasHost("google.com"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("clearURL() should not have anything in the whitelist", () => {
		whiteListService.clearURL();
		assert.isFalse(whiteListService.hasHost("youtube.com"));
		assert.isFalse(whiteListService.hasHost("google.com"));
		assert.isFalse(whiteListService.hasHost("facebook.com"));
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
	
	global.cache = cache;
	global.browser = browser;

	beforeEach(() => {
		whiteListService = new WhiteListService(items, true);
	});

	it("hasHost() for youtube.com in Personal", () => {
		assert.isTrue(whiteListService.hasHost("youtube.com", "firefox_container_1"));
	});

	it("hasHost() for github.com in Work", () => {
		assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
	});

	it("hasHost() for youtube.com in Work", () => {
		assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_2"));
	});


	it("returns array length 3 for returnList() in Personal", () => {
		assert.equal(whiteListService.returnList("firefox_container_1").length, 3);
	});

	it("returns array length 1 for returnList() in Work", () => {
		assert.equal(whiteListService.returnList("firefox_container_2").length, 1);
	});

	it("addURL() for yahoo.com and see if it exists in Work", () => {
		whiteListService.addURL("yahoo.com", "firefox_container_2");
		assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
		assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("removeURL() for google.com and see if it exists", () => {
		whiteListService.removeURL("google.com", "firefox_container_1");
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
		assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
		assert.isTrue(browser.storage.local.set.calledOnce);
	});

	it("clearURL() should not have anything in the whitelist", () => {
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