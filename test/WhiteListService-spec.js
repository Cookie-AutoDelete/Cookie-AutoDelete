let assert = require("chai").assert;
let WhiteListService = require("../src/services/WhiteListService");
let browser = require("sinon-chrome");

describe("WhiteListService with Contextual Identities Off", () => {
	let statsService;
	let items = {
		defaultWhiteList: ["youtube.com", "google.com", "facebook.com"],
		'defaultWhiteList-Grey': ["github.com"],
	};
	global.browser = browser;

	beforeEach(() => {
		whiteListService = new WhiteListService(items);
	});

	describe("hasHost()", () => {
		it("should return true for youtube.com", () => {
			assert.isTrue(whiteListService.hasHost("youtube.com"));
		});

		it("should return false for foo.com", () => {
			assert.isFalse(whiteListService.hasHost("foo.com"));
		});

		it("should return true for github.com in GreyList", () => {
			assert.isTrue(whiteListService.hasHost("github.com", "defaultWhiteList-Grey"));
		});
	});
	
	describe("returnList()", () => {
		it("returns [youtube.com, google.com, facebook.com]", () => {
			assert.sameMembers(whiteListService.returnList(), ["youtube.com", "google.com", "facebook.com"]);
		});
	});

	describe("addURL()", () => {
		it("should have yahoo.com in defaultWhiteList", () => {
			whiteListService.addURL("yahoo.com");
			assert.isTrue(whiteListService.hasHost("yahoo.com"));
		});
	});


	describe("removeURL()", () => {
		it("for google.com should not exist in the whiteList", () => {
			whiteListService.removeURL("google.com");
			assert.isFalse(whiteListService.hasHost("google.com"));
		});
	});

	describe("clearURL()", () => {
		it("should not have anything in the whitelist or greylist", () => {
			whiteListService.clearURL();
			assert.isFalse(whiteListService.hasHost("youtube.com"));
			assert.isFalse(whiteListService.hasHost("google.com"));
			assert.isFalse(whiteListService.hasHost("facebook.com"));
			assert.isFalse(whiteListService.hasHost("github.com", "defaultWhiteList-Grey"));
		});
	});	

	describe("constructor with no defaultWhiteList", () => {
		let items = {};
		let whiteListService = new WhiteListService(items);
		it("should return an empty list for defaultWhiteList and defaultWhiteList-Grey", () => {
			assert.sameMembers(whiteListService.returnList("defaultWhiteList"), []);
			assert.sameMembers(whiteListService.returnList("defaultWhiteList-Grey"), []);
		});
	});

	afterEach(() => {
        browser.flush();
    });
});

describe("WhiteListService with Contextual Identities On", () => {
	let statsService;
	let items = {firefox_container_1: ["youtube.com", "google.com", "facebook.com"],
				'firefox_container_1-Grey': ["mozilla.org"],
				firefox_container_2: ["github.com"]
				};
	let cache = { 
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
		let firefoxDefault = "firefox-default";
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

	describe("hasHost()", () => {
		it("should return true for youtube.com in Personal", () => {
			assert.isTrue(whiteListService.hasHost("youtube.com", "firefox_container_1"));
		});

		it("should return true for github.com in Work", () => {
			assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
		});

		it("should return false for youtube.com in Work", () => {
			assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_2"));
		});

		it("should return false for google.com in non existant container", () => {
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_3"));
		});
	});

	describe("hasHostSubdomain()", () => {
		it("should return true for youtube.com in Personal", () => {
			assert.isTrue(whiteListService.hasHostSubdomain("youtube.com", "sub.youtube.com", "firefox_container_1"));
		});
	});

	describe("hasHostInWhiteOrGrey()", () => {
		it("should return true for youtube.com in Personal", () => {
			assert.isTrue(whiteListService.hasHostInWhiteOrGrey("youtube.com", "sub.youtube.com", "firefox_container_1"));
		});

		it("should return true for mozilla.org in Personal", () => {
			assert.isTrue(whiteListService.hasHostInWhiteOrGrey("mozilla.org", "sub.mozilla.org", "firefox_container_1"));
		});

		it("should return false for test.com in Personal", () => {
			assert.isFalse(whiteListService.hasHostInWhiteOrGrey("test.com", "test.com", "firefox_container_1"));
		});
	});

	describe("returnList()", () => {
		it("returns [youtube.com, google.com, facebook.com] in Personal", () => {
			assert.sameMembers(whiteListService.returnList("firefox_container_1"), ["youtube.com", "google.com", "facebook.com"]);
		});

		it("returns [github.com] in Work", () => {
			assert.sameMembers(whiteListService.returnList("firefox_container_2"), ["github.com"]);
		});

		it("returns [] in non existant container", () => {
			assert.sameMembers(whiteListService.returnList("firefox_container_3"), []);
		});
	});

	describe("addURL()", () => {
		it("should exist in Work but not Personal yahoo.com", () => {
			whiteListService.addURL("yahoo.com", "firefox_container_2");
			assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
			assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
		});

		it("should exist in Work but not Personal yahoo.com", () => {
			whiteListService.addURL("yahoo.com", "firefox_container_2");
			assert.isTrue(whiteListService.hasHost("yahoo.com", "firefox_container_2"));
			assert.isFalse(whiteListService.hasHost("yahoo.com", "firefox_container_1"));
		});

		it("should create the container for github.com in a non existant container", () => {
			whiteListService.addURL("github.com", "firefox_container_3");
			assert.isTrue(whiteListService.cookieWhiteList.has("firefox_container_3"));
			assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_3"));
		});
	});

	describe("removeURL()", () => {
		it("should return false for Personal and Work for google.com ", () => {
			whiteListService.removeURL("google.com", "firefox_container_1");
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
		});

		it("should create the container for twitter.com in a non existant container", () => {
			whiteListService.removeURL("twitter.com", "firefox_container_3");
			assert.isTrue(whiteListService.cookieWhiteList.has("firefox_container_3"));
			assert.isFalse(whiteListService.hasHost("twitter.com", "firefox_container_3"));
		});
	});

	describe("removeURLFromLists()", () => {
		it("should return false for Personal and Work for google.com", () => {
			whiteListService.removeURL("google.com", "firefox_container_1");
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_2"));
		});
	});

	describe("returnOtherList()", () => {
		it("returns defaultWhiteList for defaultWhiteList-Grey", () => {
			let results = whiteListService.returnOtherList("defaultWhiteList-Grey");
			assert.strictEqual(results, "defaultWhiteList");
		});

		it("returns firefox_container_2-Grey for firefox_container_2", () => {
			let results = whiteListService.returnOtherList("firefox_container_2");
			assert.strictEqual(results, "firefox_container_2-Grey");
		});
	});

	describe("clearURL()", () => {
		it("should not have anything in the whitelist in Personal but not affect Work", () => {
			whiteListService.clearURL("firefox_container_1");
			assert.isFalse(whiteListService.hasHost("youtube.com", "firefox_container_1"));
			assert.isFalse(whiteListService.hasHost("google.com", "firefox_container_1"));
			assert.isFalse(whiteListService.hasHost("facebook.com", "firefox_container_1"));
			assert.isTrue(whiteListService.hasHost("github.com", "firefox_container_2"));
		});
	});

	

	afterEach(() => {
        browser.flush();
    });
});
