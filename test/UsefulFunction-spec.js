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

	it("should return domain.com from .domain.com", () => {
		var results = usefulFunctions.extractMainDomain("domain.com.");
		assert.strictEqual(results, "domain.com");
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