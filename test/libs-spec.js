import {assert} from "chai";
import {getHostname, isAWebpage, extractMainDomain, prepareCookieDomain, globExpressionToRegExp, returnOptionalCookieAPIAttributes} from "../src/services/libs";
// ToDo: returnMatchedExpressionObject, getSetting
import {URL} from "url";
global.URL = URL;

describe("Library Functions", function() {
	describe("extractMainDomain()", function() {
		it("should return domain.com from domain.com", function() {
			let results = extractMainDomain("domain.com");
			assert.strictEqual(results, "domain.com");
		});

		it("should return domain.com from sub.domain.com", function() {
			let results = extractMainDomain("sub.domain.com");
			assert.strictEqual(results, "domain.com");
		});

		it("should return domain.com from sub.sub.domain.com", function() {
			let results = extractMainDomain("sub.sub.domain.com");
			assert.strictEqual(results, "domain.com");
		});

		it("should return domain.com from sub.sub.sub.domain.com", function() {
			let results = extractMainDomain("sub.sub.sub.domain.com");
			assert.strictEqual(results, "domain.com");
		});

		it("should return example.co.uk from sub.example.co.uk", function() {
			let results = extractMainDomain("sub.example.co.uk");
			assert.strictEqual(results, "example.co.uk");
		});

		it("should return example.com.br from sub.example.com.br", function() {
			let results = extractMainDomain("sub.example.com.br");
			assert.strictEqual(results, "example.com.br");
		});

		it("should return the ip address from an ip address", function() {
			let results = extractMainDomain("127.0.0.1");
			assert.strictEqual(results, "127.0.0.1");
		});

		it("should return the srv-test01 from an srv-test01", function() {
			let results = extractMainDomain("srv-test01");
			assert.strictEqual(results, "srv-test01");
		});

		it("should return the test.i2p from an test.i2p", function() {
			let results = extractMainDomain("test.i2p");
			assert.strictEqual(results, "test.i2p");
		});

		it("should return domain.com from .domain.com", function() {
			let results = extractMainDomain("domain.com.");
			assert.strictEqual(results, "domain.com");
		});

		it("should return nothing on empty string", function() {
			let results = extractMainDomain("");
			assert.strictEqual(results, "");
		});
	});

	describe("prepareCookieDomain()", function() {
		it("should return https://google.com", function() {
			assert.strictEqual(prepareCookieDomain({
				domain: "google.com", secure: true, path: "/"
			}), "https://google.com/");
		});

		it("should return http://google.com with a removed leading .", function() {
			assert.strictEqual(prepareCookieDomain({
				domain: ".google.com", secure: false, path: "/test"
			}), "http://google.com/test");
		});
	});

	describe("getHostname()", function() {
		it("should return en.wikipedia.org from https://en.wikipedia.org/wiki/Cat", function() {
			let results = getHostname("https://en.wikipedia.org/wiki/Cat");
			assert.strictEqual(results, "en.wikipedia.org");
		});

		it("should return yahoo.com from http://yahoo.com", function() {
			let results = getHostname("http://yahoo.com");
			assert.strictEqual(results, "yahoo.com");
		});

		it("should return scotiaonline.scotiabank.com from https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns", function() {
			let results = getHostname("https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns");
			assert.strictEqual(results, "scotiaonline.scotiabank.com");
		});

		it("should return mint.com from https://wwws.mint.com", function() {
			let results = getHostname("https://wwws.mint.com");
			assert.strictEqual(results, "mint.com");
		});

		it("should return an empty string from invalid URLs", function() {
			let results = getHostname("");
			assert.strictEqual(results, "");
		});
	});

	describe("isAWebpage()", function() {
		it("should return true from https://en.wikipedia.org/wiki/Cat", function() {
			let results = isAWebpage("https://en.wikipedia.org/wiki/Cat");
			assert.isTrue(results);
		});

		it("should return true from http://yahoo.com", function() {
			let results = isAWebpage("http://yahoo.com");
			assert.isTrue(results);
		});

		it("should return false from random", function() {
			let results = isAWebpage("random");
			assert.isFalse(results);
		});

		it("should return false from extension page", function() {
			let results = isAWebpage("moz-extension://test/settings/settings.html");
			assert.isFalse(results);
		});
	});

	describe("globExpressionToRegExp", function() {
		it("should match example.com for example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("example.com"));
			assert.isTrue(regExp.test("example.com"));
		});
		it("should not match badexample.com for example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("example.com"));
			assert.isFalse(regExp.test("badexample.com"));
		});
		it("should match example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("example.com"));
		});
		it("should match a.example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("a.example.com"));
		});
		it("should match a.b.example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("a.b.example.com"));
		});
		it("should match a.b-c.example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("a.b-c.example.com"));
		});
		it("should match a.b_c.example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("a.b_c.example.com"));
		});
		it("should match sub-with-strage_chars.example.another.sub.example.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isTrue(regExp.test("sub-with-strage_chars.example.another.sub.example.com"));
		});
		it("should not match badexample.com for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isFalse(regExp.test("badexample.com"));
		});
		it("should not match bad.example.com.others.org for *.example.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.example.com"));
			assert.isFalse(regExp.test("bad.example.com.others.org"));
		});
		it("should equal ^.*$ for just *", function() {
			const regExp = new RegExp(globExpressionToRegExp("*"));
			assert.strictEqual(regExp.toString(), "/^.*$/");
		});
		it("should match github.com with git*b.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("git*b.com"));
			assert.isTrue(regExp.test("github.com"));
		});
		it("should match sub.gitlab.com with *.git*b.com", function() {
			const regExp = new RegExp(globExpressionToRegExp("*.git*b.com"));
			assert.isTrue(regExp.test("sub.gitlab.com"));
		});
	});

	describe("returnOptionalCookieAPIAttributes()", function() {
		it("should return an object with an undefined firstPartyDomain", function() {
			const state = {
				cache: {
					browserDetect: "Firefox",
					firstPartyIsolateSetting: true
				}
			};
			const cookieAPIAttributes = {
				domain: "example.com"
			};
			const results = returnOptionalCookieAPIAttributes(state, cookieAPIAttributes);
			assert.include(results, {
				firstPartyDomain: undefined, domain: "example.com"
			});
		});

		it("should return an object the same object with a firstPartyDomain", function() {
			const state = {
				cache: {
					browserDetect: "Firefox",
					firstPartyIsolateSetting: true
				}
			};
			const cookieAPIAttributes = {
				domain: "example.com",
				firstPartyDomain: "example.com"
			};
			const results = returnOptionalCookieAPIAttributes(state, cookieAPIAttributes);
			assert.include(results, {
				firstPartyDomain: "example.com", domain: "example.com"
			});
		});

		it("should return an object with no firstPartyDomain (Setting false)", function() {
			const state = {
				cache: {
					browserDetect: "Firefox",
					firstPartyIsolateSetting: false
				}
			};
			const cookieAPIAttributes = {
				firstPartyDomain: ""
			};
			const results = returnOptionalCookieAPIAttributes(state, cookieAPIAttributes);
			assert.notInclude(results, {
				firstPartyDomain: ""
			});
		});

		it("should return an object with no firstPartyDomain (Browser other than FF)", function() {
			const state = {
				cache: {
					browserDetect: "Chrome",
					firstPartyIsolateSetting: false
				}
			};
			const cookieAPIAttributes = {
				firstPartyDomain: ""
			};
			const results = returnOptionalCookieAPIAttributes(state, cookieAPIAttributes);
			assert.notInclude(results, {
				firstPartyDomain: ""
			});
		});
	});
});
