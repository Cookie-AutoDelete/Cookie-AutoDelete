const path = require("path");

module.exports = {
    entry: {
        background_scripts: "./prebuilt/background.js"
    },
    output: {
        path: path.resolve(__dirname, "src"),
        filename: "./background-webpack.js",
        libraryTarget: "var",
        library: "exposedFunctions"
    },
    externals: {
		"UsefulFunctions": "UsefulFunctions"
    },
};