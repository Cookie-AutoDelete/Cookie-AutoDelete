var assert = require("chai").assert;
var usefulFunctions = require("../src/services/UsefulFunctions");

describe("splitSubDomain()", () => {

	it("should return a set [sub.sub.domain.com, sub.domain.com, domain.com] from sub.sub.domain.com", () => {
		var results = usefulFunctions.splitSubDomain("sub.sub.domain.com");
		assert(results.has("domain.com"), "domain.com in set");
		assert(results.has("sub.domain.com"), "sub.domain.com in set");
		assert(results.has("sub.sub.domain.com"), "sub.sub.domain.com in set");
	});

});

describe("extractMainDomain()", () => {

	it("should return domain.com from domain.com", () => {
		var results = usefulFunctions.extractMainDomain("domain.com");
		assert(results === "domain.com");
	});

	it("should return domain.com from sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.domain.com");
		assert(results === "domain.com");
	});

	it("should return domain.com from sub.sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.sub.domain.com");
		assert(results === "domain.com");
	});

	it("should return domain.com from sub.sub.sub.domain.com", () => {
		var results = usefulFunctions.extractMainDomain("sub.sub.sub.domain.com");
		assert(results === "domain.com");
	});
});


describe("getHostname()", () => {

	it("should return en.wikipedia.org from https://en.wikipedia.org/wiki/Cat", () => {
		var results = usefulFunctions.getHostname("https://en.wikipedia.org/wiki/Cat");
		assert(results === "en.wikipedia.org");
	});

	it("should return yahoo.com from http://yahoo.com", () => {
		var results = usefulFunctions.getHostname("http://yahoo.com");
		assert(results === "yahoo.com");
	});

});

describe("isAWebpage()", () => {

	it("should return true from https://en.wikipedia.org/wiki/Cat", () => {
		var results = usefulFunctions.isAWebpage("https://en.wikipedia.org/wiki/Cat");
		assert(results === true);
	});

	it("should return true from http://yahoo.com", () => {
		var results = usefulFunctions.isAWebpage("http://yahoo.com");
		assert(results === true);
	});

	it("should return false from random", () => {
		var results = usefulFunctions.isAWebpage("random");
		assert(results === false);
	});

	it("should return false from extension page", () => {
		var results = usefulFunctions.isAWebpage("moz-extension://test/settings/settings.html");
		assert(results === false);
	});

});