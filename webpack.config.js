const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: {
    background: `${__dirname}/src/background.ts`,
    popup: `${__dirname}/src/ui/popup/index.tsx`,
    setting: `${__dirname}/src/ui/settings/index.tsx`,
  },
  externals: {
    'redux-webext': 'ReduxWebExt',
  },
  output: {
    path: `${__dirname}/extension/bundles`,
    filename: `[name].bundle.js`,
  },
  module: {
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
  },
  plugins: [
    new webpack.BannerPlugin(`
      Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
      Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.

    `),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    // }),
    new CopyPlugin({
      patterns: [
        {
          force: true,
          from: 'bootstrap/dist/css/bootstrap.min.css*',
          to: '../../extension/global_files/[name].[ext]',
          context: `${__dirname}/node_modules`,
        },
        {
          force: true,
          from: 'bootstrap/dist/js/bootstrap.bundle.min.js*',
          to: '../../extension/global_files/[name].[ext]',
          context: `${__dirname}/node_modules`,
        },
        {
          force: true,
          from: 'jquery/dist/jquery.slim.min*',
          to: '../../extension/global_files/[name].[ext]',
          context: `${__dirname}/node_modules`,
        },
        {
          force: true,
          from: 'webextension-polyfill/dist/browser-polyfill.min.js*',
          to: '../../extension/global_files/[name].[ext]',
          context: `${__dirname}/node_modules`,
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.mjs', '.tsx', '.ts', '.js', '.json', '.png'],
  },
  optimization: {
    splitChunks: {
      automaticNameDelimiter: '-',
      cacheGroups: {
        ui: {
          test: /[\\/]node_modules[\\/](react|react-dom|@fortawesome)[\\/]|[\\/]src[\\/]ui[\\/]/,
          priority: -10,
        },
        common: {
          chunks: 'initial',
          // cacheGroupKey here is `common` as key of cacheGroup
          name: (module, chunks, cacheGroupKey) => {
            return [cacheGroupKey, chunks.map((c) => c.runtime).join('-')].join(
              '-',
            );
          },
          // Alternate version of above results, only if output.filename stays as [name].bundle.js
          // filename: (pathData) => {
          //   return `common-${
          //     pathData.runtime.size > 1
          //       ? Array.from(pathData.runtime).join('-')
          //       : pathData.runtime
          //   }.bundle.js`;
          // },
          priority: -15,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
