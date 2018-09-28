const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
const UglifyEsPlugin = require('uglify-es-webpack-plugin');
const plugins = [
  new UglifyEsPlugin({
    output: {
        comments: false,
        beautify: true,
        preserve_line: true
    },
    compress: false,
    mangle: false
  }),
  new webpack.BannerPlugin(`
    Copyright (c) 2018 Kenny Do, Christian Zei

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  `)
  // new BundleAnalyzerPlugin({
  //       analyzerMode: 'static'
  // })
];
const moduleConfig = {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['react'],
            plugins: [
              require("babel-plugin-transform-class-properties"),
              require("babel-plugin-transform-async-to-generator"),
              require("babel-plugin-transform-object-rest-spread")
            ],
            babelrc: false
          }
        }
      ]
    },
    {
      test: /\.json$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'json-loader',
        }
      ]
    }

  ]
};

const backgroundConfig = {
  entry: {
      settings: `${__dirname}/src/background.js`
  },
  output: {
      path: `${__dirname}/extension`,
      filename: "backgroundBundle.js",
  },
  externals: {
      // "node/npm module name": "name of exported library variable"
      "redux": "Redux",
      "redux-thunk": "ReduxThunk",
      "redux-webext": "ReduxWebExt",
      "shortid": "ShortId"
  },
  module: moduleConfig,
  plugins
};


const settingConfig = {
    entry: {
        settings: `${__dirname}/src/ui/settings/index.js`
    },
    output: {
        path: `${__dirname}/extension/settings`,
        filename: "settingsBundle.js",
    },
    externals: {
        // "node/npm module name": "name of exported library variable"
        "react": "React",
        "react-dom": "ReactDOM",
        "redux": "Redux",
        "react-redux": "ReactRedux",
        "redux-webext": "ReduxWebExt"
    },
    module: moduleConfig,
    plugins
};

const popupConfig = {
    entry: {
        settings: `${__dirname}/src/ui/popup/index.js`
    },
    output: {
        path: `${__dirname}/extension/popup`,
        filename: "popupBundle.js",
    },
    externals: {
        // "node/npm module name": "name of exported library variable"
        "react": "React",
        "react-dom": "ReactDOM",
        "redux": "Redux",
        "react-redux": "ReactRedux",
        "redux-webext": "ReduxWebExt",
    },
    module: moduleConfig,
    plugins
};

const contentScriptConfig = {
    entry: {
        settings: `${__dirname}/src/removeECBrowsingData.js`
    },
    output: {
        path: `${__dirname}/extension`,
        filename: "contentScriptBundle.js",
    },
    externals: {
        // "node/npm module name": "name of exported library variable"
    },
    module: moduleConfig,
    plugins
};

module.exports = [
  backgroundConfig,
  settingConfig,
  popupConfig,
  contentScriptConfig
];
