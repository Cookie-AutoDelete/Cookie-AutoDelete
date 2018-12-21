const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const webpack = require('webpack');
// const UglifyEsPlugin = require('uglify-es-webpack-plugin');
const plugins = [
  new webpack.BannerPlugin(`
    Copyright (c) 2017 Kenny Do

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  `),
  // new BundleAnalyzerPlugin({
  //       analyzerMode: 'static'
  // })
];
const moduleConfig = {
  rules: [
    {
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'ts-loader',
          // options: {
          //   // this will disable any type checking
          //   transpileOnly: true,
          // },
        },
      ],
    },
    { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
  ],
};

const resolve = {
  extensions: ['.mjs', '.tsx', '.ts', '.js', '.json', '.png'],
};

const backgroundConfig = {
  entry: {
    settings: `${__dirname}/src/background.ts`,
  },
  output: {
    path: `${__dirname}/extension`,
    filename: 'backgroundBundle.js',
  },
  resolve,
  externals: {
    // "node/npm module name": "name of exported library variable"
    // redux: 'Redux',
    // 'redux-thunk': 'ReduxThunk',
    'redux-webext': 'ReduxWebExt',
    // shortid: 'ShortId',
  },
  module: moduleConfig,
  plugins,
};

const settingConfig = {
  entry: {
    settings: `${__dirname}/src/ui/settings/index.tsx`,
  },
  output: {
    path: `${__dirname}/extension/settings`,
    filename: 'settingsBundle.js',
  },
  resolve,
  externals: {
    // "node/npm module name": "name of exported library variable"
    // react: 'React',
    // 'react-dom': 'ReactDOM',
    // redux: 'Redux',
    // 'react-redux': 'ReactRedux',
    'redux-webext': 'ReduxWebExt',
  },
  module: moduleConfig,
  plugins,
};

const popupConfig = {
  entry: {
    settings: `${__dirname}/src/ui/popup/index.tsx`,
  },
  output: {
    path: `${__dirname}/extension/popup`,
    filename: 'popupBundle.js',
  },
  resolve,
  externals: {
    // "node/npm module name": "name of exported library variable"
    // react: 'React',
    // 'react-dom': 'ReactDOM',
    // redux: 'Redux',
    // 'react-redux': 'ReactRedux',
    'redux-webext': 'ReduxWebExt',
  },
  module: moduleConfig,
  plugins,
};

module.exports = [backgroundConfig, popupConfig, settingConfig];
