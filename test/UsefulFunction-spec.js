var assert = require("chai").assert;
var usefulFunctions = require("../src/services/UsefulFunctions");
var URL = require("url").URL;
global.URL = URL;

describe("splitSubDomain()", () => {

	it("should return size 3 of [sub.sub.domain.com, sub.domain.com, domain.com] from sub.sub.domain.com", () => {
		var results = usefulFunctions.splitSubDomain("sub.sub.domain.com");
		assert.strictEqual(results.length, 3);
	});

	it("should return [sub.sub.domain.com, sub.domain.com, domain.com] from sub.sub.domain.com", () => {
		var results = usefulFunctions.splitSubDomain("sub.sub.domain.com");
		assert.sameMembers(results, ["sub.sub.domain.com", "sub.domain.com", "domain.com"]);
	});

});

describe("extractMainDomain()", () => {

	it("should return domain.com from domain.com", () => {
		var results = usefulFunctions.extractMainDomain("domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return domain.com from sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return domain.com from sub.sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.sub.domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return domain.com from sub.sub.sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.sub.sub.domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return the ip address from an ip address", () => {
		var results = usefulFunctions.extractMainDomain("127.0.0.1");
		assert.strictEqual(results, "127.0.0.1");
	});

	it("should return the srv-test01 from an srv-test01", () => {
		var results = usefulFunctions.extractMainDomain("srv-test01");
		assert.strictEqual(results, "srv-test01");
	});

	it("should return the test.i2p from an test.i2p", () => {
		var results = usefulFunctions.extractMainDomain("test.i2p");
		assert.strictEqual(results, "test.i2p");
	});
	
	it("should return domain.com from .domain.com", () => {
		var results = usefulFunctions.extractMainDomain("domain.com.");
		assert.strictEqual(results, "domain.com");
	});

	it("should return nothing on empty string", () => {
		var results = usefulFunctions.extractMainDomain("");
		assert.strictEqual(results, "");
	});
});

describe("extractBaseDomain()", () => {

	it("should return domain.com from domain.com", () => {
		var results = usefulFunctions.extractBaseDomain("domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return domain.com from sub.domain.com", () => {
		var results = usefulFunctions.extractBaseDomain("sub.domain.com");
		assert.strictEqual(results, "domain.com");
	});

	it("should return sub.domain.com from sub.sub.domain.com", () => {
		var results = usefulFunctions.extractBaseDomain("sub.sub.domain.com");
		assert.strictEqual(results, "sub.domain.com");
	});

	it("should return sub.sub.domain.com from sub.sub.sub.domain.com", () => {
		var results = usefulFunctions.extractBaseDomain("sub.sub.sub.domain.com");
		assert.strictEqual(results, "sub.sub.domain.com");
	});

	it("should return the ip address from an ip address", () => {
		var results = usefulFunctions.extractBaseDomain("127.0.0.1");
		assert.strictEqual(results, "127.0.0.1");
	});

	it("should return the srv-test01 from an srv-test01", () => {
		var results = usefulFunctions.extractBaseDomain("srv-test01");
		assert.strictEqual(results, "srv-test01");
	});

	it("should return the test.i2p from an test.i2p", () => {
		var results = usefulFunctions.extractBaseDomain("test.i2p");
		assert.strictEqual(results, "test.i2p");
	});

	it("should return domain.com from .domain.com", () => {
		var results = usefulFunctions.extractBaseDomain("domain.com.");
		assert.strictEqual(results, "domain.com");
	});

	it("should return nothing from empty string", () => {
		var results = usefulFunctions.extractBaseDomain("");
		assert.strictEqual(results, "");
	});
	
});


describe("getHostname()", () => {
	it("should return en.wikipedia.org from https://en.wikipedia.org/wiki/Cat", () => {
		var results = usefulFunctions.getHostname("https://en.wikipedia.org/wiki/Cat");
		assert.strictEqual(results, "en.wikipedia.org");
	});

	it("should return yahoo.com from http://yahoo.com", () => {
		var results = usefulFunctions.getHostname("http://yahoo.com");
		assert.strictEqual(results, "yahoo.com");
	});

	it("should return scotiaonline.scotiabank.com from https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns", () => {
		var results = usefulFunctions.getHostname("https://www1.scotiaonline.scotiabank.com/online/authentication/authentication.bns");
		assert.strictEqual(results, "scotiaonline.scotiabank.com");
	});

	it("should return mint.com from https://wwws.mint.com", () => {
		var results = usefulFunctions.getHostname("https://wwws.mint.com");
		assert.strictEqual(results, "mint.com");
	});

});

describe("isAWebpage()", () => {

	it("should return true from https://en.wikipedia.org/wiki/Cat", () => {
		var results = usefulFunctions.isAWebpage("https://en.wikipedia.org/wiki/Cat");
		assert.isTrue(results);
	});

	it("should return true from http://yahoo.com", () => {
		var results = usefulFunctions.isAWebpage("http://yahoo.com");
		assert.isTrue(results);
	});

	it("should return false from random", () => {
		var results = usefulFunctions.isAWebpage("random");
		assert.isFalse(results);
	});

	it("should return false from extension page", () => {
		var results = usefulFunctions.isAWebpage("moz-extension://test/settings/settings.html");
		assert.isFalse(results);
	});

});