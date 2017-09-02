import { assert } from 'chai';
import {getHostname, isAWebpage, spliceWWW, extractMainDomain, getSetting, prepareCookieDomain, returnMatchedExpressionObject} from '../src/services/libs';
import {URL} from 'url';
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
});
