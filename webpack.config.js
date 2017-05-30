const path = require("path");

module.exports = {
    entry: {
        background_scripts: "./src/background.js"
    },
    output: {
        path: path.resolve(__dirname, "extension"),
        filename: "./background-webpack.js",
        libraryTarget: "var",
        library: "exposedFunctions"
    },
    externals: {
		"UsefulFunctions": "UsefulFunctions"
    },
};