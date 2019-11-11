const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
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
      Copyright (c) 2019 Kenny Do

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
