var assert = require("chai").assert;
var CleanupService = require("../src/services/CleanupService");
var browser = require("sinon-chrome");
var sinon = require("sinon");
var URL = require("url").URL;
global.URL = URL;

describe("CleanupService", () => {
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

		

		beforeEach(() => {
			global.UsefulFunctions = UsefulFunctions;
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

	describe("isSafeToClean()", () => {	
		var cacheSetUp = { 
			nameCacheMap: new Map()
		};
		cacheSetUp.nameCacheMap.set("firefox-container-1", "Personal");
		cacheSetUp.nameCacheMap.set("firefox-container-2", "Work");
		cacheSetUp.nameCacheMap.set("firefox-container-3", "Finance");
		cacheSetUp.nameCacheMap.set("firefox-container-4", "Shopping");


		var cleanupProperties = {
			whiteList: {
				hasHostInWhiteOrGrey: function() {}
			},
			contextualIdentitiesEnabled: false,
			cache: cacheSetUp,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set(["youtube.com", "mozilla.org"])
			
		}

		var cleanupPropertiesContextual = {
			whiteList: {
				hasHostInWhiteOrGrey: function() {}
			},
			contextualIdentitiesEnabled: true,
			cache: cacheSetUp,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set()
			
		}

		var stub1 = sinon.stub(cleanupProperties.whiteList, "hasHostInWhiteOrGrey");
		stub1.withArgs("google.com", "google.com").returns(false);
		stub1.withArgs("youtube.com", "youtube.com").returns(false);
		stub1.withArgs("sub.youtube.com", "sub.youtube.com").returns(false);

		stub1.withArgs("facebook.com", "facebook.com").returns(true);
		stub1.withArgs("developer.mozilla.org", "mozilla.org").returns(false);

		//contextual identity tests
		var stub2 = sinon.stub(cleanupPropertiesContextual.whiteList, "hasHostInWhiteOrGrey");
		stub2.withArgs("youtube.com", "youtube.com", "firefox-container-1").returns(true);
		stub2.withArgs("youtube.com", "youtube.com", "firefox-container-2").returns(false);

		//subdomain testing for 1.3.0 https://github.com/mrdokenny/Cookie-AutoDelete/issues/3#issuecomment-304912809
		stub1.withArgs("example.com", "example.com").returns(true);
		//implied in the whitelist because of example.com
		stub1.withArgs("sub.example.com", "example.com").returns(true);


		stub1.withArgs("sub.domain.com", "domain.com").returns(true);
		//implied in the whitelist because of sub.domain.com
		stub1.withArgs("sub.sub.domain.com", "sub.domain.com").returns(true);
		stub1.withArgs("other.domain.com", "domain.com").returns(false);
		stub1.withArgs("domain.com", "domain.com").returns(false);

		beforeEach(() => {
		
		});

		//google.com is not in whitelist or open tabs
		it("should return true for google.com", () => {
			var cookieProperties = {
				cookieDomainHost: "google.com",
				cookieBaseDomainHost: "google.com",
				cookieMainDomainHost: "google.com"
			}
			assert.isTrue(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//youtube.com is in open tab
		it("should return false for youtube.com", () => {
			var cookieProperties = {
				cookieDomainHost: "youtube.com",
				cookieBaseDomainHost: "youtube.com",
				cookieMainDomainHost: "youtube.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//sub.youtube.com shares main domain of youtube.com
		it("should return false for sub.youtube.com", () => {
			var cookieProperties = {
				cookieDomainHost: "sub.youtube.com",
				cookieBaseDomainHost: "youtube.com",
				cookieMainDomainHost: "youtube.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//facebook.com is in whitelist
		it("should return false for facebook.com", () => {
			var cookieProperties = {
				cookieDomainHost: "facebook.com",
				cookieBaseDomainHost: "facebook.com",
				cookieMainDomainHost: "facebook.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//a subdomain sharing mozilla.com in open tabs should not be deleted
		it("should return false for developer.mozilla.org", () => {
			var cookieProperties = {
				cookieDomainHost: "developer.mozilla.org",
				cookieMainDomainHost: "mozilla.org"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//contextual identity tests

		//youtube.com is in Personal
		it("should return false for youtube.com Personal", () => {
			var cookieProperties = {
				cookieDomainHost: "youtube.com",
				cookieBaseDomainHost: "youtube.com",
				cookieMainDomainHost: "youtube.com",
				storeId: "firefox-container-1"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupPropertiesContextual, cookieProperties));
		});

		//youtube.com is not in Work
		it("should return true for youtube.com Work", () => {
			var cookieProperties = {
				cookieDomainHost: "youtube.com",
				cookieBaseDomainHost: "youtube.com",
				cookieMainDomainHost: "youtube.com",
				storeId: "firefox-container-2"
			}
			assert.isTrue(cleanupService.isSafeToClean(cleanupPropertiesContextual, cookieProperties));
		});

		//subdomain testing for 1.3.0 https://github.com/mrdokenny/Cookie-AutoDelete/issues/3#issuecomment-304912809

		//example 1
		//example.com is whitelisted
		it("should return false for example.com", () => {
			var cookieProperties = {
				cookieDomainHost: "example.com",
				cookieBaseDomainHost: "example.com",
				cookieMainDomainHost: "example.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//sub.example.com is the subdomain of example.com
		it("should return false for sub.example.com", () => {
			var cookieProperties = {
				cookieDomainHost: "sub.example.com",
				cookieBaseDomainHost: "example.com",
				cookieMainDomainHost: "example.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//example 2
		//domain.com is not explicitly whitelisted
		it("should return true for domain.com", () => {
			var cookieProperties = {
				cookieDomainHost: "domain.com",
				cookieBaseDomainHost: "domain.com",
				cookieMainDomainHost: "domain.com"
			}
			assert.isTrue(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//sub.domain.com is in the whitelist
		it("should return false for sub.domain.com", () => {
			var cookieProperties = {
				cookieDomainHost: "sub.domain.com",
				cookieBaseDomainHost: "domain.com",
				cookieMainDomainHost: "domain.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});

		//sub.sub.domain.com is part of the subdomain for sub.domain.com
		it("should return false for sub.domain.com", () => {
			var cookieProperties = {
				cookieDomainHost: "sub.sub.domain.com",
				cookieBaseDomainHost: "sub.domain.com",
				cookieMainDomainHost: "domain.com"
			}
			assert.isFalse(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});
		

		//otherSub.domain.com can be deleted because it is not in open tabs and not in whitelist even though it shares domain.com
		it("should return true for otherSub.domain.com", () => {
			var cookieProperties = {
				cookieDomainHost: "otherSub.domain.com",
				cookieBaseDomainHost: "domain.com",
				cookieMainDomainHost: "domain.com"
			}
			assert.isTrue(cleanupService.isSafeToClean(cleanupProperties, cookieProperties));
		});


		after(() => {
			stub1.restore();
			stub2.restore();
		});
		
	});

	describe("cleanCookies()", () => {
		var cacheSetUp = { 
			nameCacheMap: new Map(),
			getNameFromCookieID: function() {}
		};
		cacheSetUp.nameCacheMap.set("firefox-container-1", "Personal");
		cacheSetUp.nameCacheMap.set("firefox-container-2", "Work");
		cacheSetUp.nameCacheMap.set("firefox-container-3", "Finance");
		cacheSetUp.nameCacheMap.set("firefox-container-4", "Shopping");


		var cleanupProperties = {
			whiteList: {
				hasHost: function() {}
			},
			contextualIdentitiesEnabled: false,
			cache: cacheSetUp,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set(["youtube.com", "mozilla.org"])
			
		}

		var cleanupPropertiesContextual = {
			whiteList: {
				hasHost: function() {}
			},
			contextualIdentitiesEnabled: true,
			cache: cacheSetUp,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set(["youtube.com", "mozilla.org"])
			
		}
		var googleCookie = {name:"NID", domain: "google.com", secure: true, path:"/", storeId:"none"};
		var youtubeCookie = {name:"SID", domain: "youtube.com", secure: true, path:"/", storeId:"none"};
		var yahooCookie = {name:"BID", domain: "yahoo.com", secure: false, path:"/login", storeId:"none"};

		var personalGoogleCookie = {name:"NID", domain: "google.com", secure: true, path:"/", storeId:"firefox-container-1"};

		var cookies = [googleCookie, youtubeCookie, yahooCookie];
		var stub1;
		
		var stub2 = sinon.stub(cleanupPropertiesContextual.cache, "getNameFromCookieID");
		stub2.withArgs("firefox-container-1").returns("Personal");

		beforeEach(() => {
			stub1 = sinon.stub(cleanupService, "isSafeToClean");
			stub1.withArgs(cleanupProperties,
								{ name: 'NID',
								  domain: 'google.com',
								  secure: true,
								  path: '/',
								  storeId: 'none',
								  cookieDomain: 'https://google.com',
								  cookieDomainHost: 'google.com',
								  cookieBaseDomainHost: 'google.com',
								  cookieMainDomainHost: 'google.com',
								  preparedCookieDomain: 'https://google.com/' }).returns(false);
			stub1.withArgs(cleanupProperties,
								{ name: 'SID',
								  domain: 'youtube.com',
								  secure: true,
								  path: '/',
								  storeId: 'none',
								  cookieDomain: 'https://youtube.com',
								  cookieDomainHost: 'youtube.com',
								  cookieBaseDomainHost: 'youtube.com',
								  cookieMainDomainHost: 'youtube.com',
								  preparedCookieDomain: 'https://youtube.com/' }).returns(true);
			stub1.withArgs(cleanupProperties,
								{ name: 'BID',
								  domain: 'yahoo.com',
								  secure: false,
								  path: '/login',
								  storeId: 'none',
								  cookieDomain: 'http://yahoo.com',
								  cookieDomainHost: 'yahoo.com',
								  cookieBaseDomainHost: 'yahoo.com',
								  cookieMainDomainHost: 'yahoo.com',
								  preparedCookieDomain: 'http://yahoo.com/login' }).returns(true);

			stub1.withArgs(cleanupPropertiesContextual,
								{ name: 'NID',
								  domain: 'google.com',
								  secure: true,
								  path: '/',
								  storeId: 'firefox-container-1',
								  cookieDomain: 'https://google.com',
								  cookieDomainHost: 'google.com',
								  cookieBaseDomainHost: 'google.com',
								  cookieMainDomainHost: 'google.com',
								  preparedCookieDomain: 'https://google.com/' }).returns(true);			
	        
	    });

		it("should be called twice for cookies.remove", () => {
			cleanupService.setOfDeletedDomainCookies = new Set();
			return cleanupService.cleanCookies(cookies, cleanupProperties)
			.then((setOfDeletedDomainCookies) => {
				assert.isTrue(browser.cookies.remove.calledTwice);
			});	
		});

		it("should return [youtube.com, yahoo.com]", () => {
			cleanupService.setOfDeletedDomainCookies = new Set();
			return cleanupService.cleanCookies(cookies, cleanupProperties)
			.then((setOfDeletedDomainCookies) => {
				assert.sameMembers(Array.from(setOfDeletedDomainCookies), ["youtube.com", "yahoo.com"]);
			});	
		});

		it("should return [youtube.com, yahoo.com]", () => {
			cleanupService.setOfDeletedDomainCookies = new Set();
			return cleanupService.cleanCookies(cookies, cleanupProperties)
			.then((setOfDeletedDomainCookies) => {
				assert.sameMembers(Array.from(setOfDeletedDomainCookies), ["youtube.com", "yahoo.com"]);
			});	
		});

		it("should return [google.com (Personal)]", () => {
			cleanupService.setOfDeletedDomainCookies = new Set();
			return cleanupService.cleanCookies([personalGoogleCookie], cleanupPropertiesContextual)
			.then((setOfDeletedDomainCookies) => {
				assert.sameMembers(Array.from(setOfDeletedDomainCookies), ["google.com (Personal)"]);
			});	
		});

		after(() => {
			stub1.restore();
			stub2.restore();
		});

	});

	describe("cleanCookiesOperation()", () => {
		var cache = { 
			nameCacheMap: new Map()
		};
		cache.nameCacheMap.set("firefox-container-1", "Personal");
		cache.nameCacheMap.set("firefox-container-2", "Work");
		cache.nameCacheMap.set("firefox-container-3", "Finance");
		cache.nameCacheMap.set("firefox-container-4", "Shopping");
		var cleanupProperties = {
			whiteList: {
				hasHost: function() {}
			},
			contextualIdentitiesEnabled: false,
			cache,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set(["youtube.com", "mozilla.org"])
			
		}

		var cleanupPropertiesContextual = {
			whiteList: {
				hasHost: function() {}
			},
			contextualIdentitiesEnabled: true,
			cache,
			globalSubdomainEnabled: true,
			setOfTabURLS: new Set(["youtube.com", "mozilla.org"])
			
		}

		var whiteList = {};
		var stub1;
		var stub2;

		beforeEach(() => {
			stub1 = sinon.stub(cleanupService, "cleanCookies");
			stub1.resolves(new Set(["facebook.com", "amazon.com"]));

			stub2 = sinon.stub(cleanupService, "returnSetOfOpenTabDomains");
			stub2.resolves({});
			browser.cookies.getAll.resolves({});
	        
	    });

		it("should return [facebook.com, amazon.com] with false contextualIdentitiesEnabled", () => {
			return cleanupService.cleanCookiesOperation(cleanupProperties)
			.then((setOfDeletedDomainCookies) => {
				assert.sameMembers(Array.from(setOfDeletedDomainCookies), ["facebook.com", "amazon.com"]);
			});	
		});

		it("should return [facebook.com, amazon.com] with true contextualIdentitiesEnabled", () => {
			return cleanupService.cleanCookiesOperation(cleanupPropertiesContextual)
			.then((setOfDeletedDomainCookies) => {
				assert.sameMembers(Array.from(setOfDeletedDomainCookies), ["facebook.com", "amazon.com"]);
			});	
		});

		it("should return 4 for call count of browser.cookies.getAll", () => {
			return cleanupService.cleanCookiesOperation(cleanupPropertiesContextual)
			.then((setOfDeletedDomainCookies) => {
				assert.strictEqual(browser.cookies.getAll.callCount, 4);
			});	
		});

		

		after(() => {
			stub1.restore();
		});

	});


	afterEach(() => {
        browser.flush();
    });
});

